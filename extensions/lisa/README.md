# Lisa

Lisa is a built-in extension that adds two Cursor-style features to the editor on
top of the **stable** `vscode.lm` API (no proposed APIs, no extra npm
dependencies):

1. **Tab autocomplete** — ghost-text inline completions for any file.
2. **Next-edit prediction with Tab-to-jump** — after you edit code, Lisa
   predicts where the next edit in the same document will be, marks that line,
   and `Tab` moves the cursor there and previews the predicted edit as ghost
   text.

Lisa works with any chat model that is contributed to VS Code through
`vscode.lm`.

## Tab autocomplete

- One inline completion provider is registered for **all** files
  (`{ pattern: '**' }`), so a completion is available in every language,
  including plain text and untitled buffers.
- On a request, Lisa builds a prompt from
  - the lines before the cursor (at most `lisa.tabCompletion.maxPrefixLines`),
  - the lines after the cursor (at most `lisa.tabCompletion.maxSuffixLines`),
  - the document language id and file path,
  and asks the model for **only the text to insert at the cursor** — no prose,
  no markdown fences.
- The reply is cleaned up (fences unwrapped, surrounding blank lines removed,
  capped at 20 lines) and returned as a single `InlineCompletionItem` at the
  cursor position, so ghost text appears after the debounce delay
  (`lisa.tabCompletion.debounceMs`) and is cancelled as soon as you keep typing.
- `Lisa: Toggle Tab Completion` (command `lisa.tabCompletion.toggle`) flips
  `lisa.tabCompletion.enabled` in your user settings and confirms it with a
  transient status bar message. Tab autocomplete deliberately has **no status bar
  item**.

## Next-edit prediction with Tab-to-jump

- Lisa listens to `vscode.workspace.onDidChangeTextDocument`. Every user edit in
  a `file` document clears the current hint and, after
  `lisa.nextEdit.debounceMs`, asks the model to predict the next edit **in the
  same document**.
- The model must answer with a strict JSON object:

  ```json
  { "found": true, "line": 12, "reason": "update the total after the change", "replacement": "  const total = a + b + c;" }
  ```

  `line` is 1-based and `replacement` replaces that whole line. Lisa extracts the
  first JSON object from the reply (braces inside strings are handled), validates
  it and silently drops anything that is unparseable, reports `"found": false`,
  or points outside the document. Malformed model output never throws.
- When a prediction is found, Lisa
  - stashes it for the document and the predicted line,
  - replaces the selection with the predicted line range and reveals it,
  - decorates the line with the theme color `lisa.nextEdit.background`,
  - sets the context key `lisa.nextEditAvailable` to `true`,
  - shows the prediction reason in the status bar item `Lisa Next Edit`.
- Pressing `Tab` (`lisa.nextEdit.jump`, enabled by
  `editorTextFocus && lisa.nextEditAvailable && !inlineSuggestionVisible &&
  !suggestWidgetVisible && !editorTabMovesFocus`) moves the cursor to the end of
  the predicted line, consumes the hint (the context key becomes `false`) and
  triggers the ghost-text preview with `editor.action.inlineSuggest.trigger`.
  If that command is unavailable, Lisa logs it and keeps working.
- `Escape` while the preview is showing runs `lisa.nextEdit.clear`, which hides
  the ghost text and drops the hint. The same command is available from the
  command palette at any time, and the hint is also cleared when the document is
  closed, when the prediction's document is edited again, and when a prediction
  becomes stale.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `lisa.tabCompletion.enabled` | `true` | Enables ghost-text tab autocomplete. |
| `lisa.tabCompletion.debounceMs` | `250` | Delay before the model is asked for a tab completion. |
| `lisa.tabCompletion.maxPrefixLines` | `120` | Lines before the cursor sent as context. |
| `lisa.tabCompletion.maxSuffixLines` | `40` | Lines after the cursor sent as context. |
| `lisa.nextEdit.enabled` | `true` | Enables next-edit prediction. |
| `lisa.nextEdit.debounceMs` | `600` | Delay before the model is asked for a prediction. |
| `lisa.model.family` | `""` | Model family to use (for example `gpt-4o`). Empty means "first available model". |

Commands (all in the `Lisa` category):

- `Lisa: Toggle Tab Completion` (`lisa.tabCompletion.toggle`)
- `Lisa: Jump To Predicted Next Edit` (`lisa.nextEdit.jump`)
- `Lisa: Clear Next Edit Hint` (`lisa.nextEdit.clear`)

The only contributed color is `lisa.nextEdit.background`, the background of the
predicted next-edit line.

## No relation to `.lisa/rules`

This extension is an **editor feature** and is independent of the
`.lisa/rules/**/*.md` workspace rules convention. Lisa's prompts contain only the
text described above — the file, the surrounding lines, the recent edit and the
configured limits. `.lisa/rules` files are consumed by Lisa's agent surfaces (the
Agent Host and chat prompts), never by this extension.

## Billing and model access

Requests are made through `vscode.lm`, so they use whichever chat model you have
access to, under that provider's terms. Missing models, missing authentication or
consent, rate limits and cancelled requests all result in **no completion and no
notification**; the reason is written to the `Lisa` output channel.

## Known limitations

- **No fill-in-the-middle endpoint.** Completions are generated by a chat model
  from the surrounding lines, so quality depends on the selected model and is
  lower than a dedicated code completion model, especially for long or
  repetitive files.
- **Same-document predictions only.** Next-edit prediction never spans files.
- **Requires a chat model.** Without a model that is exposed through
  `vscode.lm` (and without the required consent), Lisa stays silent.
- **Ghost text can only preview what the editor can render.** An inline
  completion that rewrites a line is only shown when the editor accepts it as a
  continuation of the current line; Lisa therefore also offers the predicted line
  text as a plain insertion at the cursor line as a fallback. Only one of the two
  is ever shown. Predictions that reduce a line to nothing cannot be previewed.
- **Prompts are bounded.** Next-edit prediction sends at most 400 lines (a window
  around the last edit) and quotes at most 200 characters of the last insertion.
- **Non-`file` documents are ignored** by next-edit prediction, and hints are
  dropped when the prediction's document is closed or edited again.
