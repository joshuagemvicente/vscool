# Agents Window competitor analysis

Research date: 2026-09-28. Unless a publication date is stated, official documentation was accessed on 2026-09-28.

## Scope and method

This note compares user-visible interaction patterns for agent work: session and task navigation, execution transparency and control, and workspace/result review. Sources are first-party documentation, product pages, release notes, or source repositories. Product descriptions report documented facts; sections labeled **Reusable principle**, **Caution**, recommendations, and scores are analytical judgments.

No repository-wide research-note convention was found, so this note lives in `research/`.

The comparison covers the requested products:

- Cursor
- OpenCode
- Claude Code
- Warp
- Orca, interpreted as Stably's product at `onorca.dev`

It adds three alternatives with strong evidence and direct relevance to a desktop coding-agent workspace:

- OpenAI Codex in the ChatGPT desktop app
- GitHub Copilot app and cloud agent
- Zed

Windsurf is excluded as a ninth profile because the brief allows at most three additional products.

## Executive findings

1. **Claude Code Desktop supplies the closest complete reference model.** Its Code tab combines parallel sessions, local/cloud/SSH execution, a selectable permission mode, stop and mid-run correction, normal/thinking/verbose transcript views, a line-commentable diff, preview, terminal, file, plan, task, and subagent panes, plus CI status in one first-party-documented workspace ([Claude Code Desktop documentation](https://code.claude.com/docs/en/desktop)).
2. **Warp supplies the strongest run-operations model.** Its management surfaces expose source, owner, status, duration, parent/child relationships, credit use, and links to prompts, plans, commands, logs, outputs, and follow-ups; its code-review panel sends batched inline feedback to a running agent ([agent management](https://docs.warp.dev/platform/managing-cloud-agents), [code review](https://docs.warp.dev/code/code-review)).
3. **Zed supplies the clearest project-and-thread navigation model.** Its Threads Sidebar groups agent and terminal threads by project, shows status and agent identity, supports search/history, and restores an associated worktree when a thread returns from history ([parallel agents](https://zed.dev/docs/ai/parallel-agents)).
4. **A result should remain connected to its execution record.** Warp recommends pairing a pull request with a narrow session link containing the prompt, plan, commands, validation, and known risks; GitHub links agent-authored commits to session logs ([Warp PR context guide](https://docs.warp.dev/guides/agent-workflows/how-to-attach-agent-session-context-to-github-prs), [GitHub session management](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)).
5. **The best products separate three user decisions:** which run needs attention, whether the run may continue, and whether its result should ship. They connect those decisions without collapsing navigation, execution, and review into one transcript.

## Evaluation criteria

The ranking is an analytical judgment for a desktop coding-agent workspace, not a market ranking. Each score runs from 1 (weak or undocumented) to 5 (strong and directly documented).

| Criterion | Weight | What matters |
| --- | ---: | --- |
| Session/task navigation | 30% | Parallel runs, project grouping, state, search/history, parent/child navigation, isolation visibility |
| Execution transparency/control | 25% | Current activity, tool/command evidence, permissions, plan approval, queue/steer/stop, attention states |
| Result/review workflow | 25% | Scoped diffs, comments, accept/reject or stage/revert, validation evidence, commit/PR handoff |
| Desktop/IDE fit | 10% | A coherent desktop surface with editor, terminal, browser, or equivalent handoff |
| Evidence confidence | 10% | Specific current first-party documentation for the compared behavior |

## Ranked shortlist

| Rank | Comparator | Navigation | Control | Review | Desktop fit | Evidence | Weighted score |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Claude Code Desktop | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | **5.00** |
| 2 | Warp | 4.5 | 5.0 | 5.0 | 4.5 | 5.0 | **4.80** |
| 3 | Zed | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | **4.75** |
| 4 | Cursor Agents Window | 5.0 | 4.5 | 4.5 | 5.0 | 4.5 | **4.70** |
| 5 | OpenAI Codex / ChatGPT desktop | 4.5 | 4.5 | 5.0 | 5.0 | 4.5 | **4.68** |

Near-shortlist references:

| Comparator | Navigation | Control | Review | Desktop fit | Evidence | Weighted score | Why it remains useful |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GitHub Copilot app/cloud agent | 4.5 | 4.5 | 5.0 | 4.0 | 5.0 | **4.60** | Best PR-native provenance and cloud/local continuation model |
| Orca | 4.5 | 4.0 | 5.0 | 4.5 | 4.0 | **4.45** | Worktree-native orchestration and an unusually complete diff loop |
| OpenCode | 3.5 | 4.5 | 3.0 | 3.0 | 4.5 | **3.68** | Compact permission and undo/redo patterns from a terminal-first product |

## Comparator profiles

### 1. Claude Code Desktop

**Core interaction model.** The Code tab treats each conversation as an independent session with its own chat history and project folder. A session can run locally, in Anthropic's cloud, over SSH, or in WSL on Windows. Before starting, the user selects environment, project, model, and permission mode ([Claude Code Desktop documentation](https://code.claude.com/docs/en/desktop)).

**Session/task navigation.** The sidebar lists sessions and supports several parallel runs; keyboard commands cycle, create, and close sessions. Claude documents Git isolation for parallel sessions, side chats for tangents, and the ability for one session to inspect, message, or archive another ([Claude Code Desktop documentation](https://code.claude.com/docs/en/desktop)). The VS Code extension provides a searchable session history, AI-generated titles, rename/archive actions, multiple tabs or windows, groupable sessions, and distinct indicators for a pending permission request or a finished hidden tab ([Claude Code for VS Code](https://code.claude.com/docs/en/vs-code)).

**Execution transparency and control.** The user can stop immediately or send a correction that Claude consumes after the current action. Permission modes include Manual, Accept edits, Plan, Auto, and, where policy allows it, Bypass permissions. Transcript modes expose collapsed actions, thinking, or every tool call and intermediate step. The desktop workspace can open plan, task, and subagent panes alongside chat; the VS Code extension's agent map shows subagent status, elapsed time, token count, prompt, tool calls, transcript, and a stop action ([desktop controls](https://code.claude.com/docs/en/desktop), [VS Code agent map](https://code.claude.com/docs/en/vs-code)).

**Result and review.** A diff-stat control opens a file-by-file diff. Users can attach line comments, batch-submit them, and review the revised diff. A separate Review code action asks Claude to add high-signal comments. The workspace can also show browser verification, terminals, editable files, and CI status with optional auto-fix and auto-merge controls ([Claude Code Desktop diff and CI documentation](https://code.claude.com/docs/en/desktop#review-changes-with-diff-view)). Checkpointing can restore code, conversation, or both, but Anthropic documents that Bash changes and most background-subagent edits are outside its reliable restore boundary ([checkpointing](https://code.claude.com/docs/en/checkpointing)).

**Reusable principle.** Keep the default transcript quiet, then expose action-level detail, subordinate work, and verification in dedicated views. Let the user choose autonomy at the session boundary and change it during the run.

**Caution.** Do not imply that every visible edit is rewindable. The review and restore surfaces need explicit scope labels.

### 2. Warp

**Core interaction model.** Warp combines interactive local agents and cloud runs with a terminal, code editor, agent conversations, and a management surface. The Agent Management Panel and Oz Runs page cover runs started interactively or by CLI, API, Slack, Linear, schedules, and other integrations ([Warp agent management](https://docs.warp.dev/platform/managing-cloud-agents)).

**Session/task navigation.** A scannable list exposes source, status, duration where meaningful, and filters for source, day, creator, and status. Documented statuses include Working, Blocked, Canceled, Failed/Errored, and Success. Local child agents appear as status pills above the parent; cloud children appear as separate rows or grouped under the parent in Oz ([Warp agent management](https://docs.warp.dev/platform/managing-cloud-agents)).

**Execution transparency and control.** Selecting a run opens its prompt, plan, commands, logs, outputs, and follow-up messages where available. Parent and child statuses remain independent, so a successful parent does not hide a running or failed child. Shared session links preserve this evidence for a teammate ([Warp agent management](https://docs.warp.dev/platform/managing-cloud-agents)). Team controls can require approval for commands, file reads, and applying code diffs ([Warp team administration](https://docs.warp.dev/knowledge-and-collaboration/admin-panel)).

**Result and review.** The Code Review panel covers uncommitted changes or comparison with another branch, reflects edits made inside or outside Warp, supports direct editing and hunk reversion, opens a full file, and accepts inline comments that can be sent to a running first- or third-party agent ([Warp code review](https://docs.warp.dev/code/code-review)). Warp's handoff guide asks authors to attach goal, session link, changed files, validation, known risks, and reviewer asks to a pull request; it still calls the GitHub diff the source of truth ([Warp PR context guide](https://docs.warp.dev/guides/agent-workflows/how-to-attach-agent-session-context-to-github-prs)).

**Reusable principle.** Make the sessions list an operational control plane. Use a small state vocabulary, show why a run needs attention, and preserve the execution evidence behind a change.

**Caution.** A run status and a result status are different. “Success” can mean the process completed, not that the patch passed human review.

### 3. Zed

**Core interaction model.** Zed's Agent Panel hosts Zed's first-party agent, ACP-integrated external agents, and terminal-backed agent threads. Responses stream with tool-use indicators ([Zed Agent Panel](https://zed.dev/docs/ai/agent-panel)).

**Session/task navigation.** The Threads Sidebar groups agent and terminal threads by project. Each row shows a title, status, and agent; the sidebar supports search, recent-thread cycling, archive/history, and restore. Multiple threads run independently with separate context and history. Threads in linked worktrees stay grouped with the main project, and restoring an archived thread can recreate its removed worktree ([Zed parallel agents](https://zed.dev/docs/ai/parallel-agents)).

**Execution transparency and control.** Users can follow the agent as it reads and edits files, receive completion or waiting notifications, inspect token use and compaction, and see tool activity. Messages sent while the agent runs queue by default; Zed's first-party agent can receive a queued message at the next step, while an immediate stop remains available. Zed notes that checkpoints, token display, restoration, and similar controls depend on the external-agent integration ([Zed Agent Panel](https://zed.dev/docs/ai/agent-panel)). Tool permissions can allow, deny, or ask for gated calls ([Zed tool permissions](https://zed.dev/docs/ai/tool-permissions)).

**Result and review.** The panel summarizes changed files and line counts. Review Changes opens a multi-buffer diff with per-hunk and whole-set accept/reject controls; the same controls can appear inline in files. Checkpoints appear on messages after edits, including interrupted work ([Zed Agent Panel](https://zed.dev/docs/ai/agent-panel#reviewing-changes)).

**Reusable principle.** Group mixed execution types around the project and task, not around the agent vendor. Preserve each provider's capabilities, but present a stable host vocabulary for status, review, history, and isolation.

**Caution.** Capability-dependent actions need honest affordances. Disable or explain unsupported controls instead of offering a generic action that may behave differently by provider.

### 4. Cursor Agents Window

**Core interaction model.** Cursor describes the Agents Window as an agent-first workspace across local, cloud, remote SSH, and other environments. It supports multiple workspaces and lets users switch to the classic IDE or open both surfaces. Cursor states that the Agents Window became generally available with Cursor 3 on 2026-04-02 ([Cursor Agents Window](https://cursor.com/docs/agent/agents-window)).

**Session/task navigation.** The window is built for parallel agents across projects. Cursor documents cloud-to-local and local-to-cloud handoff, cloud subagents, and isolated Git worktrees. Conversation search covers prior agent transcripts, while side chats create durable tangent threads that can be mentioned back into the parent ([Agents Window](https://cursor.com/docs/agent/agents-window), [Agent overview](https://cursor.com/docs/agent/overview)).

**Execution transparency and control.** A message can wait in a reorderable queue, steer the active run at the next tool boundary, or interrupt in CLI. Cursor automatically places checkpoints before significant Agent changes; restoring changes the files without deleting conversation messages ([Cursor Agent overview](https://cursor.com/docs/agent/overview)).

**Result and review.** Cursor documents a new diff view for reviewing and committing changes and managing pull requests inside the Agents Window. Worktree results can stay isolated, become a commit or PR, or return to the main workspace. Agent Review can run automatically or on demand and can compare all local work against the main branch at Quick or Deep depth ([Agents Window](https://cursor.com/docs/agent/agents-window), [worktrees](https://cursor.com/docs/configuration/worktrees), [Agent Review](https://prod.cursor.com/docs/agent/agent-review)).

**Reusable principle.** Treat local, remote, and cloud as execution locations for one task model. Preserve a clear handoff instead of making users reconstruct context when work moves.

**Caution.** The docs establish the capabilities but provide less detail than Claude, Warp, or Zed on list-state semantics and review-control granularity. Detailed imitation would outrun the evidence.

### 5. OpenAI Codex in the ChatGPT desktop app

**Core interaction model.** OpenAI launched the Codex app on 2026-02-02 as a desktop command center for multiple parallel, long-running agents; a 2026-03-04 update added Windows. Current ChatGPT desktop documentation presents Codex as a selectable workspace for repository work ([Codex app announcement, 2026-02-02](https://openai.com/index/introducing-the-codex-app/), [ChatGPT desktop app](https://learn.chatgpt.com/docs/app)).

**Session/task navigation.** The announcement describes separate threads organized by project, existing CLI/IDE session history, and worktree isolation. Each agent can continue in an isolated copy without changing the user's local Git state, and the user can check out the result locally ([Codex app announcement](https://openai.com/index/introducing-the-codex-app/)).

**Execution transparency and control.** Local commands run inside a platform-native sandbox. The desktop permissions menu can ask the user, delegate eligible approval review, grant full access, or use a custom profile. Sandbox mode and approval policy remain separate concepts: the first sets the technical boundary and the second sets when execution pauses ([OpenAI sandbox documentation](https://learn.chatgpt.com/docs/sandboxing)).

**Result and review.** OpenAI documents a review pane scoped to unstaged, staged, commit, branch, or last-turn changes. It supports line comments, per-file/per-hunk/whole-diff staging and reversion, editor handoff, inline review findings, multiple repositories, and a PR feedback loop. `/review` can inspect a branch or uncommitted work without changing the working tree ([OpenAI code review documentation](https://learn.chatgpt.com/docs/code-review?surface=app)).

**Reusable principle.** Show review scope as a first-class selector. “Last agent turn,” “working tree,” “staged,” and “branch” answer different questions and should not share an ambiguous Changes label.

**Caution.** OpenAI's current ChatGPT documentation and the dated Codex launch article describe different product boundaries. Use current documentation for implementation decisions and the launch article for the origin of the multi-agent model.

### 6. GitHub Copilot app and cloud agent

**Core interaction model.** The GitHub Copilot app runs isolated sessions in local repositories, new working trees, or cloud sandboxes. A session can use Interactive, Plan, or Autopilot mode, and active sessions appear by repository in the sidebar ([GitHub Copilot app sessions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)). The cloud agent uses repository-level Agents surfaces to start, monitor, steer, and hand off runs ([GitHub agent management](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/agent-management)).

**Session/task navigation.** App sessions run in parallel, each with its own branch and isolated workspace. Manage Sessions adds search, filtering, archive/delete/restore actions, and storage-size columns. GitHub's repository Agents tab and global Agents page show current and past cloud sessions; cloud runs can continue in VS Code or Copilot CLI ([app sessions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions), [agent management](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/agent-management)).

**Execution transparency and control.** A cloud session exposes progress, token usage, duration, tool use, validation, and an ephemeral-environment log. Steering arrives after the current tool call, Stop ends the backing Actions run while preserving pushed commits, and finished sessions can be archived. Local and cloud sandboxes constrain execution differently ([GitHub session management](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents), [app sessions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions)).

**Result and review.** The cloud agent produces a pull request. Users review it normally, mention `@copilot` to request changes, and separately approve privileged Actions workflows. GitHub states that an initiating user's approval of a Copilot PR does not satisfy required human approval counts ([review Copilot output](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/review-copilot-output)). Agent-authored commits include session-log links, giving review and audit a path back to execution evidence ([session management](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)).

**Reusable principle.** Carry provenance forward. A commit, changed file, or review request should lead back to the run and validation that produced it.

**Caution.** PR-native flow is excellent for shared review but too coarse for the frequent local inspect-correct-reinspect loop. The desktop window needs both.

### 7. Orca

**Identity and ambiguity.** “Orca” is not unique. This note uses **Orca by Stably** because its official docs explicitly describe a desktop IDE for multiple coding agents, Git worktrees, terminals, browser tabs, and diff review ([Stably Orca](https://www.onorca.dev/docs)). A separate product at `tryorca.com` also uses the Orca name ([tryorca.com](https://tryorca.com/)); claims below do not apply to it.

**Core interaction model.** One agent session is one CLI agent in one terminal in one worktree. Every task receives a Git worktree with its own branch and files. A task lifecycle spans create, work, review, ship, and archive/delete, with terminals, editors, browsers, and review scoped to the worktree ([worktrees](https://www.onorca.dev/docs/model/worktrees), [agents and sessions](https://www.onorca.dev/docs/model/agents-sessions)).

**Session/task navigation.** The project-grouped sidebar supports filters, search, a jump palette, pinning, nesting, multi-selection, activity indicators, and workspace cleanup. An experimental Agent Dashboard groups recognized sessions into Needs You, Working, Done, and Idle, and can show child agents under their parent ([worktrees](https://www.onorca.dev/docs/model/worktrees), [agents and sessions](https://www.onorca.dev/docs/model/agents-sessions)).

**Execution transparency and control.** Status detection uses terminal title sequences and hooks from supported CLIs. Cards can show the last message or task summary and open the live terminal. The documented launch default applies each supported agent's full-autonomy or permission-bypass flag, although users can override launch arguments ([agents and sessions](https://www.onorca.dev/docs/model/agents-sessions)).

**Result and review.** Every worktree has a diff against its starting ref. The diff combines staged, unstaged, and untracked files, supports line or hunk staging, image and HTML previews, and merge-conflict resolution ([Orca diff viewer](https://www.onorca.dev/docs/review/diff-viewer)). Users can place line comments, send the batch to the agent, watch it revise, resolve comments, and repeat before commit ([review an AI diff](https://www.onorca.dev/docs/recipes/review-ai-diff)).

**Reusable principle.** Put task isolation in the visible domain model. Users should know which repository, base, branch/worktree, host, and agent own a run before they inspect its transcript.

**Caution.** Orca's dashboard is marked experimental, and its status quality depends on CLI integration. Its full-autonomy default is a product-specific risk choice, not a pattern to adopt.

### 8. OpenCode

**Core interaction model.** OpenCode is terminal-first. Its TUI provides file references, shell commands, slash commands, sessions, agents, and configurable attention behavior; a local web UI exposes the same server-side sessions and can share state with an attached TUI ([OpenCode TUI](https://opencode.ai/docs/tui/), [OpenCode web UI](https://dev.opencode.ai/docs/web/)).

**Session/task navigation.** `/sessions` lists and switches sessions. Primary agents can be cycled during a session, while subagents create child sessions that users traverse with parent/child navigation bindings. The web home lists active sessions and starts new ones ([TUI](https://opencode.ai/docs/tui/), [agents](https://opencode.ai/docs/agents), [web UI](https://dev.opencode.ai/docs/web/)).

**Execution transparency and control.** `/details` toggles tool-execution detail and `/thinking` toggles supported reasoning blocks. Permissions resolve to allow, ask, or deny, support tool/input patterns, and can switch into auto-approve while retaining explicit denies. Attention settings can notify for a question, permission, error, completed session, or completed subagent ([TUI](https://opencode.ai/docs/tui/), [permissions](https://opencode.ai/docs/permissions/)).

**Result and review.** `/undo` removes the latest user message, all later responses, and associated file changes; `/redo` restores them, with Git required for file restoration. `/export` writes a readable transcript, and `/share` publishes a conversation at a public URL until it is unshared ([TUI](https://opencode.ai/docs/tui/), [sharing](https://opencode.ai/docs/share/)).

**Evidence gap.** The selected primary docs establish message-level undo/redo and transcript sharing, but not a desktop, hunk-level review cockpit comparable to Claude, Warp, Zed, Codex, or Orca. Do not infer that absence across all OpenCode clients; the product's docs point to a newer v2 surface while the cited pages still describe the current TUI/web commands.

**Reusable principle.** A small, configurable permission vocabulary works across tools. “Allow, ask, deny” is easier to scan than agent-specific policy prose.

## Cross-product pattern matrix

| Pattern | Strong primary examples | Reusable idea |
| --- | --- | --- |
| Attention-first session list | Warp statuses and filters; Orca Needs You board; Zed thread status | Sort or filter by user action needed, not only recency |
| Project/task grouping | Zed project groups; Cursor multi-workspace; Codex project threads | Keep one navigation model across repositories and execution locations |
| Isolation made visible | Orca/Cursor/Zed worktrees; GitHub working trees and sandboxes | Show base, branch/worktree, host, and conflict risk on the session |
| Progressive transcript detail | Claude Normal/Thinking/Verbose; OpenCode details toggle | Default to action summaries; reveal commands, logs, and outputs on demand |
| Safe mid-run intervention | Claude stop/correct; Cursor queue/steer; GitHub steer/stop; Zed queue/steer | Distinguish queue, steer-at-boundary, and hard stop |
| Parent/child work | Warp run relationships; Claude agent map; OpenCode child sessions | Keep child state independent and summarize it at the parent |
| Explicit review scope | Codex unstaged/staged/commit/branch/last turn; Warp uncommitted/base branch | Name exactly which changes are being reviewed |
| Comment-to-revision loop | Claude, Warp, Codex, Orca line comments | Batch precise feedback and return to the same diff after revision |
| Execution provenance | Warp shared run context; GitHub commit-to-session links | Link results and commits back to prompt, actions, validation, and risks |
| Restore with boundaries | Claude/Cursor/Zed checkpoints; OpenCode Git-backed undo | State what will and will not roll back before the user confirms |

## Reusable design principles

These principles describe behavior, not proprietary visual treatment.

1. **Model work as a task with several views.** Conversation, execution detail, terminal, preview, files, diff, and pull request all describe one task. Keep a stable task identity as the user moves between them.
2. **Use an attention state separate from run state.** A task can be running and need approval, finished and need review, or failed and already acknowledged. One status cannot carry all three meanings.
3. **Put trust controls next to the run.** Show execution location, isolation boundary, and permission mode before start and during execution. Let the user lower autonomy without restarting.
4. **Expose actions, not hidden chain-of-thought.** Show plans, tool calls, commands, files, logs, validation, and outcomes. Products may expose “thinking,” but a host should not depend on private reasoning for accountability.
5. **Make intervention semantics explicit.** “Queue,” “steer after current action,” “deny this request,” and “stop now” have different consequences. Label them as different actions.
6. **Review from scope to evidence to decision.** First choose the diff scope, then inspect code and validation, then stage/revert/comment/commit. Do not start with a generic success summary.
7. **Preserve context across handoff.** Moving local to cloud, agent to editor, or run to pull request should retain task goal, branch/worktree, conversation, validation, and open review comments.
8. **Keep provider capability differences visible.** A stable host interface should not pretend that every agent supports checkpointing, steering, subagent inspection, or exact status detection.
9. **Prefer reversible control points.** Checkpoints, hunk reversion, worktree isolation, and draft PRs reduce the cost of exploration. Explain the restore boundary before users rely on it.
10. **Treat completion as a review transition.** “Agent stopped” moves a task into review; it does not declare the result correct.

## Three recommended feature themes

### Theme 1: Attention-aware session control tower

Use the existing sessions list as the control plane for all workspaces and providers.

Recommended behavior:

- Group by workspace/project, with optional task/parent nesting.
- Show separate **run state** (`queued`, `working`, `waiting`, `stopped`, `failed`) and **user state** (`needs approval`, `needs answer`, `ready to review`, `unread`).
- Put sessions needing action above routine running sessions without destroying project grouping.
- Add search and filters for workspace, provider, execution location, branch/worktree, state, and age.
- Surface the isolation identity on each task: repository, base, branch/worktree, local/remote/cloud host.
- Preserve archive/history and make restoration semantics clear.
- Summarize child runs on the parent but retain each child's independent state and failure.

Success measure: a user supervising several runs can answer “what needs me, where is it running, and what might conflict?” without opening each transcript.

### Theme 2: Inspectable execution with graded intervention

Use the chat/session surface for intent and concise progress, and the auxiliary detail plus terminal panel for evidence.

Recommended behavior:

- Default to a compact timeline of plan steps and action summaries; expand a step to commands, tool inputs, logs, changed files, duration, and result.
- Show current plan/checklist, current action, elapsed time, permission mode, execution location, and validation status in a persistent run header.
- Offer four distinct controls: **queue next**, **steer at safe boundary**, **deny/answer request**, and **stop now**.
- Expose permission policies through a provider-neutral `allow / ask / deny` vocabulary while preserving provider-specific detail.
- Add a parent/child map for delegated work with status, age, and stop/open controls.
- Notify only on actionable transitions: permission, question, failure, completion ready for review.
- Link every summary claim to evidence. “Tests passed” should open the command and output that support it.

Success measure: a user can understand and redirect a run without reading a raw transcript, while a debugger can still reach the complete evidence.

### Theme 3: Review-to-ship workspace

Use the editor/results pane as the decision surface, with chat and auxiliary detail remaining available.

Recommended behavior:

- Make review scope explicit: **last turn**, **agent-owned changes**, **working tree**, **staged**, **branch vs base**, or **commit/PR**.
- Present changed-file navigation, diff stats, validation evidence, open risks, and review comments together.
- Support per-hunk keep/revert or stage/unstage, line comments, and a batch **Send feedback to agent** loop.
- Return users to the same file/hunk/comment position after the agent revises.
- Keep terminal, preview, or artifact evidence beside the diff rather than burying it in chat.
- Carry task provenance into commit/PR handoff: goal, session link, changed areas, commands/checks, failures, assumptions, and reviewer asks.
- Mark “run completed,” “validation passed,” “review approved,” and “merged” as separate milestones.

Success measure: a user can move from agent completion to an informed keep/revise/reject/ship decision without reconstructing context across unrelated surfaces.

## Suggested sequence

1. **Unify lifecycle semantics first.** Define task, run, user-attention, review, execution-location, and isolation states before adding controls. Navigation, notifications, and status badges all depend on this model.
2. **Add evidence-backed run detail.** Wire the compact timeline to actual tool, command, file, log, and validation records. Avoid a second synthetic progress model.
3. **Close the review loop.** Add explicit diff scopes and comment-to-agent feedback, then preserve provenance through commit and PR handoff.

This sequence avoids copying any comparator's layout. It adopts their strongest shared behaviors: attention-aware navigation, transparent bounded execution, and evidence-based review.

## Uncertainty and follow-up questions

- **Fast-moving documentation:** Several cited products changed substantially in 2026. Cursor's Agents Window became generally available in April 2026; OpenAI's current desktop documentation places Codex inside ChatGPT; Claude Desktop documents pane and review behavior tied to current app versions. Validate critical decisions against current builds before matching exact interaction details ([Cursor Agents Window](https://cursor.com/docs/agent/agents-window), [Codex announcement](https://openai.com/index/introducing-the-codex-app/), [ChatGPT desktop app](https://learn.chatgpt.com/docs/app), [Claude Desktop](https://code.claude.com/docs/en/desktop)).
- **Orca identity:** Stably's Orca is the best match for an “agent development environment,” but the name is ambiguous. The comparison excludes other Orca products ([Stably Orca](https://www.onorca.dev/docs), [tryorca.com](https://tryorca.com/)).
- **Provider differences:** Zed explicitly warns that checkpoints, token use, restoration, and similar features vary by external-agent integration. A cross-provider Agents Window needs capability discovery rather than optimistic uniformity ([Zed Agent Panel](https://zed.dev/docs/ai/agent-panel)).
- **Checkpoint limits:** Claude documents incomplete restoration for shell-created changes and most background-subagent edits. Cursor describes file checkpoints as separate from Git. A shared checkpoint affordance needs a trustworthy coverage report ([Claude checkpointing](https://code.claude.com/docs/en/checkpointing), [Cursor Agent overview](https://cursor.com/docs/agent/overview)).
- **Reasoning visibility:** Some products expose thinking/reasoning views, but first-party documentation does not establish that hidden reasoning is a reliable audit record. Prefer observable plans, calls, outputs, edits, and validation.
- **Negative evidence:** OpenCode's cited docs do not establish a graphical hunk-review surface. That is a source gap, not proof that no current client has one.

## Primary sources

### Cursor

- [Agents Window](https://cursor.com/docs/agent/agents-window), accessed 2026-09-28; page dates GA to 2026-04-02.
- [Agent overview](https://cursor.com/docs/agent/overview), accessed 2026-09-28.
- [Worktrees](https://cursor.com/docs/configuration/worktrees), accessed 2026-09-28.
- [Agent Review](https://prod.cursor.com/docs/agent/agent-review), accessed 2026-09-28.

### OpenCode

- [TUI](https://opencode.ai/docs/tui/), accessed 2026-09-28.
- [Agents](https://opencode.ai/docs/agents), accessed 2026-09-28.
- [Permissions](https://opencode.ai/docs/permissions/), accessed 2026-09-28.
- [Web UI](https://dev.opencode.ai/docs/web/), accessed 2026-09-28.
- [Share](https://opencode.ai/docs/share/), accessed 2026-09-28.

### Claude Code

- [Desktop application](https://code.claude.com/docs/en/desktop), accessed 2026-09-28.
- [VS Code extension](https://code.claude.com/docs/en/vs-code), accessed 2026-09-28.
- [Manage sessions](https://code.claude.com/docs/en/sessions), accessed 2026-09-28.
- [Interactive mode](https://code.claude.com/docs/en/interactive-mode), accessed 2026-09-28.
- [Permissions](https://code.claude.com/docs/en/permissions), accessed 2026-09-28.
- [Checkpointing](https://code.claude.com/docs/en/checkpointing), accessed 2026-09-28.

### Warp

- [Managing cloud agents](https://docs.warp.dev/platform/managing-cloud-agents), accessed 2026-09-28.
- [Code Review panel](https://docs.warp.dev/code/code-review), accessed 2026-09-28.
- [Share agent context in GitHub PRs](https://docs.warp.dev/guides/agent-workflows/how-to-attach-agent-session-context-to-github-prs), accessed 2026-09-28.
- [Team Admin Panel](https://docs.warp.dev/knowledge-and-collaboration/admin-panel), accessed 2026-09-28.

### Orca

- [What is Orca?](https://www.onorca.dev/docs), accessed 2026-09-28.
- [Worktrees](https://www.onorca.dev/docs/model/worktrees), accessed 2026-09-28.
- [Agents and sessions](https://www.onorca.dev/docs/model/agents-sessions), accessed 2026-09-28.
- [Diff viewer](https://www.onorca.dev/docs/review/diff-viewer), accessed 2026-09-28.
- [Review an AI diff](https://www.onorca.dev/docs/recipes/review-ai-diff), accessed 2026-09-28.

### OpenAI Codex

- [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/), published 2026-02-02 and updated 2026-03-04.
- [ChatGPT desktop app](https://learn.chatgpt.com/docs/app), accessed 2026-09-28.
- [Code review](https://learn.chatgpt.com/docs/code-review?surface=app), accessed 2026-09-28.
- [Sandbox](https://learn.chatgpt.com/docs/sandboxing), accessed 2026-09-28.

### GitHub Copilot

- [Working with agent sessions in the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/agent-sessions), accessed 2026-09-28.
- [About agent management](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/agent-management), accessed 2026-09-28.
- [Managing agent sessions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents), accessed 2026-09-28.
- [Review output from Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/review-copilot-output), accessed 2026-09-28.

### Zed

- [Agent Panel](https://zed.dev/docs/ai/agent-panel), accessed 2026-09-28.
- [Parallel Agents](https://zed.dev/docs/ai/parallel-agents), accessed 2026-09-28.
- [Tool Permissions](https://zed.dev/docs/ai/tool-permissions), accessed 2026-09-28.
