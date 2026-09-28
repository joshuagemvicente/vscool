/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Pure prompt/line math for Lisa next-edit prediction. This module deliberately
 * does not import `vscode`.
 */

/**
 * The maximum number of document lines included in a next-edit prompt. The
 * window is centred on the line the user last edited.
 */
export const maxPromptLines = 400;

/**
 * Longest inserted text quoted back to the model as "the most recent edit".
 */
export const maxQuotedEditLength = 200;

export interface PromptWindow {
	/** First included line, 1-based and inclusive. */
	readonly startLine: number;
	/** Last included line, 1-based and inclusive. */
	readonly endLine: number;
}

export interface NextEditPromptOptions {
	readonly languageId: string;
	readonly filePath: string;
	readonly documentText: string;
	/** The 1-based line the user edited last. */
	readonly cursorLine: number;
	/** The 1-based line numbers touched by the most recent user edit. */
	readonly editedLines: readonly number[];
	/** The text inserted by the most recent user edit, if any. */
	readonly lastEdit?: string;
}

/**
 * Computes the 1-based, inclusive line window that is sent to the model,
 * centred on `cursorLine` and clamped to the document.
 */
export function getPromptWindow(lineCount: number, cursorLine: number, maxLines: number = maxPromptLines): PromptWindow {
	const lines = Math.max(lineCount, 1);
	const size = Math.max(maxLines, 1);
	const centre = Math.min(Math.max(cursorLine, 1), lines);

	let startLine = centre - Math.floor(size / 2);
	let endLine = startLine + size - 1;

	if (startLine < 1) {
		startLine = 1;
		endLine = Math.min(lines, size);
	}
	if (endLine > lines) {
		endLine = lines;
		startLine = Math.max(1, endLine - size + 1);
	}

	return { startLine, endLine };
}

/**
 * Renders the given 1-based, inclusive line range of `text` with line numbers.
 * The cursor line is marked with `>` and lines touched by the last edit with `*`.
 */
export function numberLines(text: string, window: PromptWindow, cursorLine: number, editedLines: readonly number[]): string {
	const lines = text.split('\n');
	const edited = new Set(editedLines);
	const rendered: string[] = [];

	for (let line = window.startLine; line <= window.endLine && line <= lines.length; line++) {
		const marker = line === cursorLine ? '>' : (edited.has(line) ? '*' : ' ');
		rendered.push(`${marker}${line}| ${lines[line - 1]}`);
	}

	return rendered.join('\n');
}

/**
 * Builds the prompt asking the model to predict the next edit in the same
 * document, as a strict JSON object.
 */
export function buildNextEditPrompt(options: NextEditPromptOptions): string {
	const lineCount = countLines(options.documentText);
	const window = getPromptWindow(lineCount, options.cursorLine);

	const lines = [
		'You are a next-edit prediction engine embedded in a code editor.',
		'The user just edited the file below. Predict the single next edit the user is most likely to make in the same file.',
		'',
		'Reply with one JSON object and nothing else, using exactly this shape:',
		'{"found": true, "line": <1-based line number to replace>, "reason": "<short reason>", "replacement": "<full replacement text for that line>"}',
		'',
		'Rules:',
		`- "line" must be an existing line number between ${window.startLine} and ${window.endLine}.`,
		'- "replacement" is the complete new text of that line; use an empty string to delete the line.',
		'- The predicted edit must be in the same file and must differ from the current content of that line.',
		'- Do not repeat the edit the user just made.',
		'- If no next edit can be predicted, reply exactly {"found": false}.',
		'- Do not wrap the JSON in markdown fences and do not add prose.',
		'',
		`File: ${options.filePath}`,
		`Language: ${options.languageId}`,
		''
	];

	if (options.lastEdit) {
		lines.push(`Most recent edit inserted: ${quoteEdit(options.lastEdit)}`, '');
	}

	lines.push(
		`Document lines ${window.startLine}-${window.endLine} of ${lineCount} (">" marks the last edited line, "*" marks lines changed by that edit):`,
		numberLines(options.documentText, window, options.cursorLine, options.editedLines)
	);

	return lines.join('\n');
}

function countLines(text: string): number {
	return text.split('\n').length;
}

function quoteEdit(text: string): string {
	const singleLine = text.replace(/\r?\n/g, '\\n');
	return singleLine.length > maxQuotedEditLength ? `\`${singleLine.slice(0, maxQuotedEditLength)}…\`` : `\`${singleLine}\``;
}
