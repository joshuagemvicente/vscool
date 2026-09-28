/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Logger } from './log';
import { getModelFamily } from './settings';

/**
 * Thin wrapper around `vscode.lm` that selects a chat model once and reuses it.
 *
 * Every failure mode (no model contributed, no authentication or missing user
 * consent, rate limiting, cancelled request) resolves to `undefined` and is
 * logged to the `Lisa` output channel. Callers therefore never have to deal
 * with errors and Lisa never shows an error notification.
 */
export class LanguageModelClient implements vscode.Disposable {

	private readonly disposables: vscode.Disposable[] = [];
	private cached: { readonly family: string | undefined; readonly model: vscode.LanguageModelChat } | undefined;
	private readonly inFlight = new Set<vscode.CancellationTokenSource>();

	constructor(private readonly logger: Logger) {
		this.disposables.push(vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('lisa.model')) {
				this.cached = undefined;
			}
		}));
	}

	/**
	 * Asks the selected chat model for a completion. Returns the raw response
	 * text, or `undefined` when no model could be used or the request failed.
	 */
	async request(prompt: string, token: vscode.CancellationToken): Promise<string | undefined> {
		if (token.isCancellationRequested) {
			return undefined;
		}

		const model = await this.selectModel();
		if (!model || token.isCancellationRequested) {
			return undefined;
		}

		const cancellation = new vscode.CancellationTokenSource();
		this.inFlight.add(cancellation);
		const subscription = token.onCancellationRequested(() => cancellation.cancel());
		if (token.isCancellationRequested) {
			cancellation.cancel();
		}

		try {
			const response = await model.sendRequest(
				[vscode.LanguageModelChatMessage.User(prompt)],
				{ justification: vscode.l10n.t('Lisa uses the selected language model to generate tab completions and next-edit predictions in the editor.') },
				cancellation.token
			);

			let text = '';
			for await (const fragment of response.text) {
				text += fragment;
				if (cancellation.token.isCancellationRequested) {
					break;
				}
			}
			return text;
		} catch (error) {
			this.logger.error(`language model request failed (model: ${model.id})`, error);
			return undefined;
		} finally {
			subscription.dispose();
			this.inFlight.delete(cancellation);
			cancellation.dispose();
		}
	}

	/**
	 * Returns the model to use, honouring `lisa.model.family` and falling back
	 * to the first available model. The result is cached until the setting
	 * changes.
	 */
	private async selectModel(): Promise<vscode.LanguageModelChat | undefined> {
		const family = getModelFamily();
		if (this.cached && this.cached.family === family) {
			return this.cached.model;
		}

		let models: readonly vscode.LanguageModelChat[];
		try {
			models = await vscode.lm.selectChatModels(family ? { family } : undefined);
		} catch (error) {
			this.logger.error('selecting a chat model failed', error);
			return undefined;
		}

		const model = models.at(0);
		if (!model) {
			this.logger.info(family
				? `no chat model available for family '${family}'`
				: 'no chat model available; Lisa stays idle until a model is contributed');
			return undefined;
		}

		this.cached = { family, model };
		this.logger.info(`using chat model ${model.id} (${model.vendor}, family '${model.family}') for family request '${family ?? '<any>'}'`);
		return model;
	}

	dispose(): void {
		for (const cancellation of this.inFlight) {
			cancellation.cancel();
			cancellation.dispose();
		}
		this.inFlight.clear();
		vscode.Disposable.from(...this.disposables).dispose();
	}
}
