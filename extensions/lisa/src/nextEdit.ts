/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { LanguageModelClient } from './languageModel';
import { Logger } from './log';
import { buildNextEditPrompt } from './nextEditPrompt';
import { NextEditPrediction, parseNextEditPrediction } from './nextEditResponse';
import { getNextEditSettings } from './settings';

/**
 * Context key that is true while a next-edit hint can be jumped to with Tab.
 */
const hintAvailableContextKey = 'lisa.nextEditAvailable';

/**
 * Context key that is true while Lisa previews a prediction as ghost text, so
 * that `Escape` can clear the hint again.
 */
const previewingContextKey = 'lisa.nextEditPreviewing';

const maxStatusBarReasonLength = 60;

/**
 * A stashed next-edit prediction. `position` is the end of the predicted line
 * and the place where the prediction is shown as ghost text.
 */
export interface NextEditHint {
	readonly uri: vscode.Uri;
	/** 1-based line the predicted edit replaces. */
	readonly line: number;
	readonly position: vscode.Position;
	readonly replacement: string;
}

/**
 * Predicts the next edit in the document the user is editing and offers a
 * Tab-to-jump hint. Predictions are debounced, only ever consider `file`
 * documents and are dropped again as soon as the user keeps editing.
 */
export class NextEditController implements vscode.Disposable {

	private readonly disposables: vscode.Disposable[] = [];
	private readonly decoration: vscode.TextEditorDecorationType;
	private readonly statusBarItem: vscode.StatusBarItem;
	private readonly pendingTimers = new Map<string, NodeJS.Timeout>();
	private readonly inFlight = new Map<string, vscode.CancellationTokenSource>();

	private hint: NextEditHint | undefined;
	private disposed = false;

	constructor(
		private readonly logger: Logger,
		private readonly models: LanguageModelClient
	) {
		this.decoration = vscode.window.createTextEditorDecorationType({
			isWholeLine: true,
			backgroundColor: new vscode.ThemeColor('lisa.nextEdit.background'),
			overviewRulerColor: new vscode.ThemeColor('lisa.nextEdit.background'),
			overviewRulerLane: vscode.OverviewRulerLane.Right
		});

		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.name = 'Lisa Next Edit';
		this.statusBarItem.command = 'lisa.nextEdit.jump';

		this.disposables.push(
			this.decoration,
			this.statusBarItem,
			vscode.workspace.onDidChangeTextDocument(event => this.onDidChangeTextDocument(event)),
			vscode.workspace.onDidCloseTextDocument(document => this.onDidCloseTextDocument(document)),
			vscode.commands.registerCommand('lisa.nextEdit.jump', () => this.jump()),
			vscode.commands.registerCommand('lisa.nextEdit.clear', () => this.clear())
		);
	}

	/**
	 * The hint to show when inline completions are requested at `position`.
	 * The hint is keyed by document, and applies to the whole predicted line so
	 * that a preview still resolves when the cursor sits elsewhere on the line.
	 */
	getHint(uri: vscode.Uri, position: vscode.Position): NextEditHint | undefined {
		const hint = this.hint;
		if (!hint || hint.uri.toString() !== uri.toString()) {
			return undefined;
		}
		return position.line + 1 === hint.line ? hint : undefined;
	}

	private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
		if (this.disposed || event.contentChanges.length === 0 || event.document.uri.scheme !== 'file') {
			return;
		}

		if (this.isLisaEdit(event)) {
			// The user accepted a prediction Lisa offered: that is not a fresh
			// user edit, so do not predict again from it.
			this.logger.info(`ignoring change applied by Lisa in ${event.document.uri.toString()}`);
			this.clearHint();
			return;
		}

		this.clearHint();

		const settings = getNextEditSettings();
		if (!settings.enabled) {
			return;
		}

		const key = event.document.uri.toString();
		this.cancelPending(key);
		const timer = setTimeout(() => {
			this.pendingTimers.delete(key);
			void this.predict(event.document, event.contentChanges, key);
		}, settings.debounceMs);
		this.pendingTimers.set(key, timer);
	}

	/**
	 * A change counts as Lisa's own when it is exactly the stashed prediction:
	 * the replacement text inserted at the predicted line.
	 */
	private isLisaEdit(event: vscode.TextDocumentChangeEvent): boolean {
		const hint = this.hint;
		if (!hint || hint.uri.toString() !== event.document.uri.toString()) {
			return false;
		}

		return event.contentChanges.some(change =>
			change.text === hint.replacement
			&& change.range.start.line + 1 === hint.line
			&& (change.text.length > 0 || !change.range.isEmpty));
	}

	private async predict(document: vscode.TextDocument, changes: readonly vscode.TextDocumentContentChangeEvent[], key: string): Promise<void> {
		const settings = getNextEditSettings();
		if (this.disposed || !settings.enabled || document.isClosed) {
			return;
		}

		const lastChange = changes[changes.length - 1];
		const editedLines = new Set<number>();
		for (const change of changes) {
			for (let line = change.range.start.line; line <= change.range.end.line; line++) {
				editedLines.add(line + 1);
			}
		}

		const prompt = buildNextEditPrompt({
			languageId: document.languageId,
			filePath: document.uri.fsPath,
			documentText: document.getText(),
			cursorLine: lastChange.range.start.line + 1,
			editedLines: [...editedLines],
			lastEdit: lastChange.text.length > 0 ? lastChange.text : undefined
		});

		this.cancelInFlight(key);
		const cancellation = new vscode.CancellationTokenSource();
		this.inFlight.set(key, cancellation);

		try {
			const response = await this.models.request(prompt, cancellation.token);
			if (response === undefined || cancellation.token.isCancellationRequested || this.disposed || document.isClosed) {
				return;
			}

			const prediction = parseNextEditPrediction(response, document.lineCount);
			if (!prediction) {
				this.logger.info(`no next edit predicted for ${key}`);
				return;
			}

			this.showHint(document, prediction);
		} finally {
			cancellation.dispose();
			if (this.inFlight.get(key) === cancellation) {
				this.inFlight.delete(key);
			}
		}
	}

	private showHint(document: vscode.TextDocument, prediction: NextEditPrediction): void {
		const line = document.lineAt(prediction.line - 1);
		this.hint = {
			uri: document.uri,
			line: prediction.line,
			position: line.range.end,
			replacement: prediction.replacement
		};

		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri.toString() !== document.uri.toString()) {
				continue;
			}
			editor.setDecorations(this.decoration, [line.range]);
			editor.revealRange(line.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
			editor.selection = new vscode.Selection(line.range.start, line.range.end);
			break;
		}

		this.statusBarItem.text = `$(arrow-right) ${truncateReason(prediction.reason)}`;
		this.statusBarItem.tooltip = vscode.l10n.t('Lisa predicted a next edit on line {0}. Press Tab to jump there.', prediction.line);
		this.statusBarItem.show();
		this.setContextKey(hintAvailableContextKey, true);

		this.logger.info(`next edit hint for ${document.uri.toString()} on line ${prediction.line}: ${prediction.reason || '(no reason given)'}`);
	}

	/**
	 * Moves the cursor to the predicted line and previews the predicted edit as
	 * ghost text. The hint itself stays stashed so that the inline completion
	 * provider can still answer the preview request.
	 */
	private async jump(): Promise<void> {
		const hint = this.hint;
		if (!hint) {
			return;
		}

		const visible = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === hint.uri.toString());
		if (!visible || hint.line > visible.document.lineCount) {
			this.logger.info('next edit jump ignored: the predicted document is no longer visible');
			this.clearHint();
			return;
		}

		const line = visible.document.lineAt(hint.line - 1);
		const editor = await vscode.window.showTextDocument(visible.document, {
			viewColumn: visible.viewColumn,
			preserveFocus: false,
			selection: new vscode.Range(line.range.end, line.range.end)
		});
		editor.revealRange(line.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

		// The hint is consumed: from now on Tab accepts the ghost text instead.
		this.setContextKey(hintAvailableContextKey, false);
		this.setContextKey(previewingContextKey, true);

		try {
			await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
		} catch (error) {
			this.logger.error('triggering the inline suggestion preview failed', error);
		}
	}

	/**
	 * Hides the previewed ghost text and drops the hint. Wired to the
	 * `lisa.nextEdit.clear` command, which `Escape` runs while previewing.
	 */
	private async clear(): Promise<void> {
		try {
			await vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
		} catch (error) {
			this.logger.error('hiding the inline suggestion failed', error);
		}
		this.clearHint();
	}

	private onDidCloseTextDocument(document: vscode.TextDocument): void {
		const hint = this.hint;
		if (hint && hint.uri.toString() === document.uri.toString()) {
			this.clearHint();
		}
		this.cancelPending(document.uri.toString());
		this.cancelInFlight(document.uri.toString());
	}

	private clearHint(): void {
		const hint = this.hint;
		if (hint) {
			const key = hint.uri.toString();
			for (const editor of vscode.window.visibleTextEditors) {
				if (editor.document.uri.toString() === key) {
					editor.setDecorations(this.decoration, []);
				}
			}
		}

		this.hint = undefined;
		this.statusBarItem.hide();
		this.setContextKey(hintAvailableContextKey, false);
		this.setContextKey(previewingContextKey, false);
	}

	private setContextKey(key: string, value: boolean): void {
		void vscode.commands.executeCommand('setContext', key, value);
	}

	private cancelPending(key: string): void {
		const timer = this.pendingTimers.get(key);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.pendingTimers.delete(key);
		}
	}

	private cancelInFlight(key: string): void {
		const cancellation = this.inFlight.get(key);
		if (cancellation) {
			cancellation.cancel();
			cancellation.dispose();
			this.inFlight.delete(key);
		}
	}

	dispose(): void {
		this.disposed = true;
		for (const key of [...this.pendingTimers.keys()]) {
			this.cancelPending(key);
		}
		for (const key of [...this.inFlight.keys()]) {
			this.cancelInFlight(key);
		}
		vscode.Disposable.from(...this.disposables).dispose();
	}
}

function truncateReason(reason: string): string {
	const singleLine = reason.replace(/\s+/g, ' ').trim();
	const text = singleLine.length > 0 ? singleLine : vscode.l10n.t('Lisa: next edit');
	return text.length > maxStatusBarReasonLength ? `${text.slice(0, maxStatusBarReasonLength)}…` : text;
}
