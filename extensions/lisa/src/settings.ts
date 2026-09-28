/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

/**
 * Settings for Lisa tab autocomplete.
 */
export interface TabCompletionSettings {
	readonly enabled: boolean;
	readonly debounceMs: number;
	readonly maxPrefixLines: number;
	readonly maxSuffixLines: number;
}

/**
 * Settings for Lisa next-edit prediction.
 */
export interface NextEditSettings {
	readonly enabled: boolean;
	readonly debounceMs: number;
}

const defaultTabCompletionSettings: TabCompletionSettings = {
	enabled: true,
	debounceMs: 250,
	maxPrefixLines: 120,
	maxSuffixLines: 40
};

const defaultNextEditSettings: NextEditSettings = {
	enabled: true,
	debounceMs: 600
};

/**
 * Reads the tab autocomplete settings, guarding against nonsensical values in
 * user configuration (negative line counts, negative delays).
 */
export function getTabCompletionSettings(): TabCompletionSettings {
	const config = vscode.workspace.getConfiguration('lisa');
	return {
		enabled: config.get<boolean>('tabCompletion.enabled', defaultTabCompletionSettings.enabled),
		debounceMs: nonNegative(config.get<number>('tabCompletion.debounceMs', defaultTabCompletionSettings.debounceMs), defaultTabCompletionSettings.debounceMs),
		maxPrefixLines: nonNegative(config.get<number>('tabCompletion.maxPrefixLines', defaultTabCompletionSettings.maxPrefixLines), defaultTabCompletionSettings.maxPrefixLines),
		maxSuffixLines: nonNegative(config.get<number>('tabCompletion.maxSuffixLines', defaultTabCompletionSettings.maxSuffixLines), defaultTabCompletionSettings.maxSuffixLines)
	};
}

/**
 * Reads the next-edit prediction settings, guarding against nonsensical values
 * in user configuration.
 */
export function getNextEditSettings(): NextEditSettings {
	const config = vscode.workspace.getConfiguration('lisa');
	return {
		enabled: config.get<boolean>('nextEdit.enabled', defaultNextEditSettings.enabled),
		debounceMs: nonNegative(config.get<number>('nextEdit.debounceMs', defaultNextEditSettings.debounceMs), defaultNextEditSettings.debounceMs)
	};
}

/**
 * The model family requested by the user, or `undefined` when the first
 * available model should be used.
 */
export function getModelFamily(): string | undefined {
	const family = vscode.workspace.getConfiguration('lisa').get<string>('model.family', '').trim();
	return family.length > 0 ? family : undefined;
}

function nonNegative(value: number, fallback: number): number {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		return fallback;
	}
	return Math.floor(value);
}
