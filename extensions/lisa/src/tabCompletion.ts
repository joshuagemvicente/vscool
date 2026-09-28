/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { LanguageModelClient } from './languageModel';
import { Logger } from './log';
import { NextEditController, NextEditHint } from './nextEdit';
import { getTabCompletionSettings } from './settings';
import { buildTabCompletionPrompt, cleanCompletionText, extractCompletionContext } from './tabCompletionPrompt';

/**
 * Provides Lisa ghost text for all files: either the stashed next-edit
 * prediction requested for the cursor position, or a model generated
 * continuation of the text around the cursor.
 */
export class LisaInlineCompletionProvider implements vscode.InlineCompletionItemProvider {

	constructor(
		private readonly nextEdit: NextEditController,
		private readonly models: LanguageModelClient,
		private readonly logger: Logger
	) { }

	async provideInlineCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_context: vscode.InlineCompletionContext,
		token: vscode.CancellationToken
	): Promise<vscode.InlineCompletionItem[] | undefined> {
		const hint = this.nextEdit.getHint(document.uri, position);
		if (hint) {
			return nextEditHintItems(hint, document);
		}

		const settings = getTabCompletionSettings();
		if (!settings.enabled) {
			return undefined;
		}

		if (!await delayOrCancel(settings.debounceMs, token)) {
			return undefined;
		}

		const context = extractCompletionContext(document.getText(), document.offsetAt(position), settings.maxPrefixLines, settings.maxSuffixLines);
		const prompt = buildTabCompletionPrompt({
			languageId: document.languageId,
			filePath: document.uri.fsPath,
			prefix: context.prefix,
			suffix: context.suffix
		});

		const response = await this.models.request(prompt, token);
		if (response === undefined || token.isCancellationRequested) {
			return undefined;
		}

		const insertText = cleanCompletionText(response);
		if (insertText.length === 0) {
			this.logger.info(`tab completion for ${document.uri.toString()} produced no text`);
			return undefined;
		}

		return [new vscode.InlineCompletionItem(insertText, new vscode.Range(position, position))];
	}
}

/**
 * Builds the ghost text for a stashed next-edit prediction.
 *
 * The first item is the actual prediction: it replaces the predicted line, so
 * accepting it with Tab performs exactly the edit the model predicted. The
 * editor only shows such an item when the line it produces still contains the
 * current line as a prefix or subsequence, so a second item that appends the
 * predicted line text at the cursor is offered as an always visible fallback.
 * Only one of the two is ever rendered, and Tab accepts the one that is shown.
 */
function nextEditHintItems(hint: NextEditHint, document: vscode.TextDocument): vscode.InlineCompletionItem[] {
	const line = document.lineAt(hint.line - 1);
	const items = [new vscode.InlineCompletionItem(hint.replacement, line.range)];
	if (hint.replacement.length > 0) {
		items.push(new vscode.InlineCompletionItem(hint.replacement, new vscode.Range(line.range.end, line.range.end)));
	}
	return items;
}

/**
 * Waits for `ms` milliseconds, resolving with `false` as soon as the request is
 * cancelled. This is how the debounce setting keeps Lisa from asking the model
 * about every single keystroke.
 */
function delayOrCancel(ms: number, token: vscode.CancellationToken): Promise<boolean> {
	if (token.isCancellationRequested) {
		return Promise.resolve(false);
	}
	if (ms <= 0) {
		return Promise.resolve(true);
	}

	return new Promise<boolean>(resolve => {
		let subscription: vscode.Disposable | undefined;
		const timer = setTimeout(() => {
			subscription?.dispose();
			resolve(!token.isCancellationRequested);
		}, ms);
		subscription = token.onCancellationRequested(() => {
			clearTimeout(timer);
			subscription?.dispose();
			resolve(false);
		});
	});
}
