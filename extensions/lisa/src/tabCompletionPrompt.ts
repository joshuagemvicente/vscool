/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Pure helpers for Lisa tab autocomplete. This module deliberately does not
 * import `vscode` so that prompt building and response cleanup can be reviewed
 * (and unit tested) in isolation.
 */

/**
 * The maximum number of lines a single completion may span. Chat models that
 * ignore the "insert text only" instruction would otherwise be able to dump an
 * entire file into the editor.
 */
export const maxCompletionLines = 20;

export interface CompletionContext {
	/** The text before the cursor, limited to the configured number of lines. */
	readonly prefix: string;
	/** The text after the cursor, limited to the configured number of lines. */
	readonly suffix: string;
}

export interface TabCompletionPromptOptions {
	readonly languageId: string;
	readonly filePath: string;
	readonly prefix: string;
	readonly suffix: string;
}

/**
 * Extracts the context around `offset` that is sent to the language model.
 * Only the last `maxPrefixLines` lines before the cursor and the first
 * `maxSuffixLines` lines after it are kept.
 */
export function extractCompletionContext(text: string, offset: number, maxPrefixLines: number, maxSuffixLines: number): CompletionContext {
	const clampedOffset = Math.min(Math.max(offset, 0), text.length);
	return {
		prefix: keepLastLines(text.slice(0, clampedOffset), maxPrefixLines),
		suffix: keepFirstLines(text.slice(clampedOffset), maxSuffixLines)
	};
}

/**
 * Builds the prompt asking the model for the text to insert at the cursor.
 * The reply must consist of the insertion only: no prose, no markdown fences.
 */
export function buildTabCompletionPrompt(options: TabCompletionPromptOptions): string {
	return [
		'You are a code completion engine embedded in a code editor.',
		'Continue the code at the cursor position marked by <CURSOR> in the file below.',
		'',
		'Rules:',
		'- Reply with the exact text to insert at the cursor and nothing else.',
		'- Do not repeat code that is already before the cursor.',
		'- Do not wrap the reply in markdown code fences and do not add explanations, comments or apologies.',
		'- If no completion is appropriate, reply with an empty string.',
		`- Keep the completion at or below ${maxCompletionLines} lines.`,
		'',
		`File: ${options.filePath}`,
		`Language: ${options.languageId}`,
		'',
		'<CODE>',
		options.prefix + '<CURSOR>' + options.suffix,
		'</CODE>'
	].join('\n');
}

/**
 * Turns a raw model reply into text that can be inserted at the cursor.
 * Markdown code fences are unwrapped, blank lines around the completion are
 * dropped and overly long replies are truncated.
 */
export function cleanCompletionText(raw: string): string {
	let text = unwrapCodeFence(raw).replace(/\r\n/g, '\n');
	text = text.replace(/^\n+/, '').replace(/\s+$/, '');

	const lines = text.split('\n');
	if (lines.length > maxCompletionLines) {
		text = lines.slice(0, maxCompletionLines).join('\n');
	}
	return text;
}

/**
 * Keeps a reply that is wrapped in a single markdown fence, discarding a
 * ```` ```lang ```` info string and any surrounding prose.
 */
function unwrapCodeFence(raw: string): string {
	const trimmed = raw.trim();
	const fence = /^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n?\1[^\n]*$/.exec(trimmed);
	if (fence) {
		return fence[2];
	}
	return trimmed;
}

function keepLastLines(text: string, maxLines: number): string {
	if (maxLines <= 0) {
		return '';
	}
	const lines = text.split('\n');
	return lines.length <= maxLines ? text : lines.slice(lines.length - maxLines).join('\n');
}

function keepFirstLines(text: string, maxLines: number): string {
	if (maxLines <= 0) {
		return '';
	}
	const lines = text.split('\n');
	return lines.length <= maxLines ? text : lines.slice(0, maxLines).join('\n');
}
