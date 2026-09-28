/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

/**
 * The output channel logger for Lisa. Logging never shows UI: failures to talk
 * to a language model end up here instead of in a notification.
 */
export class Logger implements vscode.Disposable {

	private readonly channel = vscode.window.createOutputChannel('Lisa');
	private disposed = false;

	info(message: string): void {
		this.append(`[info] ${message}`);
	}

	error(message: string, error: unknown): void {
		this.append(`[error] ${message}: ${describeError(error)}`);
	}

	private append(message: string): void {
		if (this.disposed) {
			return;
		}
		this.channel.appendLine(`[${new Date().toISOString()}] ${message}`);
	}

	dispose(): void {
		this.disposed = true;
		this.channel.dispose();
	}
}

/**
 * Renders an unknown error in a stable, log friendly way. Language model errors
 * are reduced to their code (for example `NoPermissions`) so that rate limits,
 * missing permissions and missing models can be told apart in the log.
 */
export function describeError(error: unknown): string {
	if (error instanceof vscode.LanguageModelError) {
		return `${error.code} (${error.message})`;
	}
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
}
