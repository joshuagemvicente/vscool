/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Pure parsing of Lisa next-edit predictions. This module deliberately does not
 * import `vscode`: it turns arbitrary model output into a validated prediction
 * or `undefined`, and never throws.
 */

/**
 * A validated next-edit prediction. `line` is 1-based and `replacement` is the
 * full replacement text for that line (an empty string deletes the line).
 */
export interface NextEditPrediction {
	readonly line: number;
	readonly reason: string;
	readonly replacement: string;
}

interface RawNextEditResponse {
	readonly found?: unknown;
	readonly line?: unknown;
	readonly reason?: unknown;
	readonly replacement?: unknown;
}

/**
 * Extracts the first complete JSON object from `text`. Braces inside string
 * literals are ignored, so both a bare object and an object embedded in prose
 * or a markdown fence can be recovered.
 */
export function extractFirstJsonObject(text: string): string | undefined {
	const start = text.indexOf('{');
	if (start < 0) {
		return undefined;
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = start; i < text.length; i++) {
		const character = text[i];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (character === '\\') {
				escaped = true;
			} else if (character === '"') {
				inString = false;
			}
			continue;
		}

		if (character === '"') {
			inString = true;
		} else if (character === '{') {
			depth++;
		} else if (character === '}') {
			depth--;
			if (depth === 0) {
				return text.slice(start, i + 1);
			}
		}
	}

	return undefined;
}

/**
 * Parses a model reply into a prediction. Returns `undefined` when the reply is
 * not valid JSON, does not report `found: true`, or points outside the document.
 */
export function parseNextEditPrediction(text: string, lineCount: number): NextEditPrediction | undefined {
	const json = extractFirstJsonObject(text);
	if (json === undefined) {
		return undefined;
	}

	let raw: RawNextEditResponse;
	try {
		raw = JSON.parse(json) as RawNextEditResponse;
	} catch {
		return undefined;
	}

	if (raw === null || typeof raw !== 'object' || raw.found !== true) {
		return undefined;
	}

	const line = typeof raw.line === 'number' ? Math.floor(raw.line) : Number.NaN;
	if (!Number.isFinite(line) || line < 1 || line > lineCount) {
		return undefined;
	}

	return {
		line,
		reason: typeof raw.reason === 'string' ? raw.reason : '',
		replacement: typeof raw.replacement === 'string' ? raw.replacement : ''
	};
}
