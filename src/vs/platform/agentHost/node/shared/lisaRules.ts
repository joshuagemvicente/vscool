/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { joinPath } from '../../../../base/common/resources.js';
import { compare as compareStrings } from '../../../../base/common/strings.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService, IFileStat } from '../../../files/common/files.js';
import { ILogService } from '../../../log/common/log.js';

/**
 * Workspace-relative directory holding the user's Lisa rules.
 *
 * This is the agent-host half of the `.lisa/rules` convention; the Copilot Chat
 * extension discovers the same directory for its own prompt. Keep the two in
 * sync — the convention is the contract between them.
 */
export const LISA_RULES_DIRECTORY = '.lisa/rules';

/** Only markdown files count as rules. */
const LISA_RULE_FILE_SUFFIX = '.md';

/** Bounds so a stray tree cannot blow the system prompt up. */
const MAX_LISA_RULE_FILES = 50;
const MAX_LISA_RULE_CONTENT_LENGTH = 32 * 1024;
const MAX_LISA_RULE_RECURSION_DEPTH = 8;

/** A single rule file read from {@link LISA_RULES_DIRECTORY}. */
export interface ILisaRuleFile {
	/** Absolute location of the rule file; also the sort key. */
	readonly uri: URI;
	/** File contents, truncated to {@link MAX_LISA_RULE_CONTENT_LENGTH} characters. */
	readonly content: string;
}

/** Opens the rules block. Kept as a constant so tests assert on the framing without restating it. */
export const LISA_RULES_HEADER = [
	'<lisa_rules>',
	'Standing workspace rules the user authored in `.lisa/rules`. Follow them for every task in this workspace; an explicit request in the conversation takes precedence.',
].join('\n');

/** Closes the rules block. */
export const LISA_RULES_FOOTER = '</lisa_rules>';

/**
 * Reads `<workspaceFolder>/.lisa/rules/**\/*.md`, sorted by path so the rendered
 * prompt does not depend on directory enumeration order.
 *
 * A missing, unreadable, or empty directory yields `[]`: rules are opt-in per
 * workspace and their absence is not an error. Unreadable individual files are
 * logged and skipped; the size bounds truncate rather than fail.
 */
export async function collectLisaRuleFiles(fileService: IFileService, workspaceFolder: URI | undefined, logService: ILogService, token: CancellationToken = CancellationToken.None): Promise<readonly ILisaRuleFile[]> {
	if (!workspaceFolder || token.isCancellationRequested) {
		return [];
	}

	const resources: URI[] = [];
	await collectMarkdownFiles(fileService, joinPath(workspaceFolder, ...LISA_RULES_DIRECTORY.split('/')), resources, 0, token);
	resources.sort((a, b) => compareStrings(a.toString(), b.toString()));

	const files: ILisaRuleFile[] = [];
	for (const uri of resources.slice(0, MAX_LISA_RULE_FILES)) {
		if (token.isCancellationRequested) {
			break;
		}
		let content: string;
		try {
			content = (await fileService.readFile(uri, undefined, token)).value.toString();
		} catch (error) {
			logService.warn(`[LisaRules] Failed to read rule file ${uri.toString()}`, error);
			continue;
		}
		if (!content.trim()) {
			continue;
		}
		if (content.length > MAX_LISA_RULE_CONTENT_LENGTH) {
			logService.warn(`[LisaRules] Truncating rule file ${uri.toString()} to ${MAX_LISA_RULE_CONTENT_LENGTH} characters`);
			content = content.slice(0, MAX_LISA_RULE_CONTENT_LENGTH);
		}
		files.push({ uri, content });
	}
	return files;
}

/**
 * Frames collected rules as one prompt block, or `undefined` when there are none
 * — the caller then contributes no section at all rather than an empty one.
 */
export function formatLisaRules(files: readonly ILisaRuleFile[], workspaceFolder: URI): string | undefined {
	if (files.length === 0) {
		return undefined;
	}
	const folderPath = workspaceFolder.path.endsWith('/') ? workspaceFolder.path : `${workspaceFolder.path}/`;
	const body = files
		.map(file => {
			const label = file.uri.path.startsWith(folderPath) ? file.uri.path.substring(folderPath.length) : file.uri.path;
			return `${label}\n${file.content}`;
		})
		.join('\n\n');
	return `${LISA_RULES_HEADER}\n\n${body}\n${LISA_RULES_FOOTER}`;
}

/**
 * Reads and frames the workspace's rules in one step — the shape the session
 * launcher needs when it builds the system message.
 */
export async function readWorkspaceLisaRules(fileService: IFileService, workspaceFolder: URI | undefined, logService: ILogService, token: CancellationToken = CancellationToken.None): Promise<string | undefined> {
	const files = await collectLisaRuleFiles(fileService, workspaceFolder, logService, token);
	return workspaceFolder ? formatLisaRules(files, workspaceFolder) : undefined;
}

async function collectMarkdownFiles(fileService: IFileService, directory: URI, result: URI[], depth: number, token: CancellationToken): Promise<void> {
	if (token.isCancellationRequested || depth > MAX_LISA_RULE_RECURSION_DEPTH || result.length >= MAX_LISA_RULE_FILES) {
		return;
	}
	let children: readonly IFileStat[];
	try {
		children = (await fileService.resolve(directory)).children ?? [];
	} catch {
		// The overwhelmingly common case: this workspace has no rules directory.
		return;
	}
	for (const child of children) {
		if (result.length >= MAX_LISA_RULE_FILES) {
			return;
		}
		if (child.isDirectory) {
			await collectMarkdownFiles(fileService, child.resource, result, depth + 1, token);
		} else if (child.name.toLowerCase().endsWith(LISA_RULE_FILE_SUFFIX)) {
			result.push(child.resource);
		}
	}
}
