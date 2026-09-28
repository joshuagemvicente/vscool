/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { LanguageModelClient } from './languageModel';
import { Logger } from './log';
import { NextEditController } from './nextEdit';
import { getTabCompletionSettings } from './settings';
import { LisaInlineCompletionProvider } from './tabCompletion';

export function activate(context: vscode.ExtensionContext): void {
	const logger = new Logger();
	context.subscriptions.push(logger);

	const models = new LanguageModelClient(logger);
	context.subscriptions.push(models);

	const nextEdit = new NextEditController(logger, models);
	context.subscriptions.push(nextEdit);

	context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, new LisaInlineCompletionProvider(nextEdit, models, logger)));

	context.subscriptions.push(vscode.commands.registerCommand('lisa.tabCompletion.toggle', async () => {
		const configuration = vscode.workspace.getConfiguration('lisa');
		const enabled = configuration.get<boolean>('tabCompletion.enabled', true);
		await configuration.update('tabCompletion.enabled', !enabled, vscode.ConfigurationTarget.Global);
		vscode.window.setStatusBarMessage(enabled
			? vscode.l10n.t('Lisa: tab completion disabled')
			: vscode.l10n.t('Lisa: tab completion enabled'), 3000);
	}));

	logger.info(`Lisa activated (tab completion: ${getTabCompletionSettings().enabled ? 'enabled' : 'disabled'})`);
}

export function deactivate(): void {
	// All resources are registered in `context.subscriptions`.
}
