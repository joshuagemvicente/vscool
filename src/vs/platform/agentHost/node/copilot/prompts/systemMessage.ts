/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { SectionOverride, SystemMessageConfig, SystemMessageSection } from '@github/copilot-sdk';

/**
 * Identity section of the default agent-host system message. Per-model overrides
 * inherit it via {@link withDefaultSections}, so it is defined in one place and
 * only a contributor that names `identity` replaces it.
 */
export const COPILOT_AGENT_HOST_IDENTITY = 'You are Lisa, an AI coding assistant in VS Code. You help users with software engineering tasks. When asked about your identity, you must state that you are Lisa, an AI coding assistant in VS Code.';

/**
 * Used as-is when no per-model override matches, and composed UNDER a matching
 * override's sections. `customize` mode keeps the CLI/SDK foundation prompt and
 * its guardrails intact.
 */
export const COPILOT_AGENT_HOST_SYSTEM_MESSAGE = {
	mode: 'customize',
	sections: {
		identity: {
			action: 'replace',
			content: COPILOT_AGENT_HOST_IDENTITY,
		},
	},
} satisfies SystemMessageConfig;

/**
 * Builds a {@link SystemMessageConfig} that fully replaces the CLI/SDK system
 * prompt with `content`.
 *
 * ⚠️ `replace` mode drops ALL SDK guardrails (including security restrictions).
 * The prompt registry appends its universal layers when this config passes
 * through it; direct SDK callers receive only this replacement.
 */
export function fullSystemPrompt(content: string): SystemMessageConfig {
	return { mode: 'replace', content };
}

/**
 * Composes the default sections UNDER `config`'s own, so a section the config
 * does not name inherits the default and contributors need not re-state it.
 */
export function withDefaultSections(config: SystemMessageConfig): SystemMessageConfig {
	if (config.mode !== 'customize') {
		return config;
	}
	return { ...config, sections: { ...COPILOT_AGENT_HOST_SYSTEM_MESSAGE.sections, ...config.sections } };
}

/**
 * Folds `content` into a section override, preserving whatever a contributor
 * already set for that section rather than clobbering it.
 *
 * A `remove` action or a transform function is a deliberate, non-composable
 * choice by the contributor; it is returned untouched so a universal layer never
 * fights a per-model decision. For `append`/`prepend` the content keeps its
 * adjacency padding relative to the SDK foundation section.
 */
export function composeSectionOverride(existing: SectionOverride | undefined, content: string): SectionOverride {
	// No per-model override: append after the SDK foundation section, led by a
	// newline so it does not run on from the foundation content.
	if (!existing) {
		return { action: 'append', content: `\n${content}` };
	}
	if (existing.action === 'remove' || typeof existing.action === 'function') {
		return existing;
	}
	// Fold our content into the contributor's, then pad by where this action
	// places it: `append` sits after the foundation (leading newline), `prepend`
	// before it (trailing newline), `replace` owns the section and needs neither.
	const base = existing.content ?? '';
	const merged = base ? `${base}\n${content}` : content;
	switch (existing.action) {
		case 'append': return { action: 'append', content: `\n${merged}` };
		case 'prepend': return { action: 'prepend', content: `${merged}\n` };
		default: return { action: existing.action, content: merged };
	}
}

/**
 * Builds a `customize`-mode {@link SystemMessageConfig} that overrides only the
 * given sections, leaving the rest of the CLI/SDK foundation prompt intact.
 */
export function sectionOverrides(sections: Partial<Record<SystemMessageSection, SectionOverride>>): SystemMessageConfig {
	return { mode: 'customize', sections };
}

/**
 * Appends to the config's trailing `content`, including after a `replace`
 * prompt's text — so host plumbing survives a full replacement.
 */
export function appendSystemMessageContent(config: SystemMessageConfig, content: string): SystemMessageConfig {
	const existing = config.content;
	return { ...config, content: existing ? `${existing}\n\n${content}` : content };
}

/**
 * One-line, log-friendly summary of a resolved {@link SystemMessageConfig} —
 * the mode plus, for `customize`, which sections are overridden and with what
 * action (e.g. `mode=customize sections=[identity:replace, tool_instructions:append]`).
 *
 * Keeps prompt observability cheap at `info` level without dumping full prompt
 * text on every session launch (log the whole config at `trace` for that).
 */
export function describeSystemMessageConfig(config: SystemMessageConfig): string {
	if (config.mode === 'replace') {
		return `mode=replace (content length ${config.content.length})`;
	}
	if (config.mode === 'customize') {
		const parts = Object.entries(config.sections ?? {}).map(([name, override]) => {
			const action = override?.action;
			return `${name}:${typeof action === 'function' ? 'transform' : action}`;
		});
		// The customize convenience `content` is appended after all sections; note
		// it so the summary doesn't understate what was sent.
		const content = config.content ? ` +content(length ${config.content.length})` : '';
		return `mode=customize sections=[${parts.join(', ')}]${content}`;
	}
	return `mode=append (content length ${config.content?.length ?? 0})`;
}
