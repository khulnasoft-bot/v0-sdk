# Plan: code-server integration (v0.app-style) for v0-clone

## 1. Goal

Give the v0-clone chat a real code editing experience like v0.app, and make it
code-server-ready so a full VS Code-in-the-browser (coder/code-server) can be added
later without rework.

- **MVP (Phase A):** upgrade the existing code view to a VS Code-style editor running
  inside `apps/web` (file tree + Monaco + syntax highlighting + find/replace + diff).
- **Seam (Phase B):** add a workspace/file abstraction and a code-server proxy route
  mirroring the existing preview proxy, so the embedded editor and a future remote
  code-server share one protocol.
- **Code-server (Phase C):** wire the installed build
  (`/usr/local/lib/code-server-0.0.84/`, VS Code 1.108.1, includes `v0-bridge`
  extension, `/api/git-show`, `/api/v0`) into the workspace via the seam.

Decision (confirmed): Hybrid — ship the in-app editor first, design for code-server.

## 2. Current state (relevant seams)

| Area | Location | Note |
|---|---|---|
| Code view | `apps/web/components/chat/code-editor.tsx` | flat file list + `<textarea>`, save via PATCH files |
| Split view + toggle | `apps/web/components/chat/chat-workspace.tsx` (`view: 'preview' \| 'code'`), `apps/web/components/chat/chat-header.tsx` (`ChatView`) | keyed by `contentRevision` |
| Files API | `apps/web/app/api/chats/[chatId]/files/route.ts` (GET `getFiles`, PATCH `updateFiles`); download via `apps/web/app/api/chats/[chatId]/download/route.ts` | `Files = [{path, content, encoding: 'utf8'\|'base64'}]`; `content: null` deletes |
| Preview iframe | `apps/web/components/preview/preview-pane.tsx` | `sandbox="allow-scripts allow-same-origin..."`, postMessage loading state |
| Preview proxy | `apps/preview-proxy/app/api/v0-preview/[chatId]/[[...path]]/route.ts` + `apps/preview-proxy/lib/preview.ts` + `packages/v0/src/preview-proxy.ts` | origin-isolated catch-all proxy, auth via `authorizeProxyRequest` (`apps/preview-proxy/lib/authorize.ts`), trusted-host registration |
| `<CodeProject>` artifact | `apps/web/components/chat/message-parts.tsx` L151–159 | currently stripped from assistant text — natural hook for a code artifact view |
| File-edit parts | `Message['parts']` `file-edit` (create/update/delete/rename/patch), `file-read` | available for diff/history UI |
| Editor stack today | none (no Monaco/Shiki/CodeMirror in repo) | `apps/web` is Next.js 16, React 19, Tailwind v4, radix-ui |

## 3. Target architecture

```
browser
  ├─ Chat workspace (apps/web) ──────────┬─ PreviewPane (iframe, existing)
  │                                      └─ CodeProjectPane (Phase A)   ◄─ Monaco + file tree
  │                                         reads/writes via /api/chats/{id}/files
  │
  ├─ CodeServerPane (Phase C, iframe)  ──┐  code-server UI on isolated origin
  │                                      ▼
apps/preview-proxy ─ /api/code-server/{chatId}/[[...path]] ─► CodeServerRunner
                                        │                          │  spawn / manage
                                        │                          ▼
                                        │   workspace dir /workspaces/{chatId}
                                        │        ├─ code-server (vscode UI, ws)
                                        │        └─ v0-bridge → /api/v0 (port 9876)
                                        │        └─ git-show (git on workspace dir)
                                        └── file sync watcher ──► v0 Files API (PATCH)
```

**Key principle:** the in-app editor and code-server both treat the v0 Files API as the
source of truth. The seam is a `FileSource` interface so UI components don't know which
backend they talk to.

## 4. Phase A — In-app editor (MVP)

### A1. `FileSource` abstraction (`apps/web/lib/files-source.ts`)
```ts
interface FileSource {
  list(): Promise<Files['files']>
  read(path: string): Promise<string>          // utf8/base64 decode
  write(path: string, content: string): Promise<void>
  delete(path: string): Promise<void>
  subscribe(chatId: string, cb: (files: Files['files']) => void): () => void
}
```
- `ApiFileSource` wraps the existing `/api/chats/{id}/files` GET/PATCH + SWR `useFiles`.
- Keep server pre-fetch in `apps/web/app/chats/[chatId]/page.tsx` (already passes a
  `filesPromise` to the editor).

### A2. File tree (`apps/web/components/chat/file-tree.tsx`)
- Recursive tree from flat paths (split on `/`), expand/collapse, select, icons by
  extension, folder auto-open when a file inside is created.
- Actions: create file/folder, rename, delete (right-click context menu + tree header
  buttons) mapping to `write/delete` on the `FileSource`.
- Replaces the flat `<aside>` list in `code-editor.tsx`.

### A3. Monaco editor
- Add `@monaco-editor/react` + `monaco-editor` (dynamic `next/dynamic` import, only when
  `view === 'code'`).
- Language auto-detect from extension; line numbers; minimap off (matches v0.app).
- `Cmd/Ctrl+S` save; unsaved-changes banner + Save/Reset like v0.app; save disabled
  unless `isPreviewReady` (keep existing gating in `code-editor.tsx`).
- Binary (`base64`) files: read-only "Binary files cannot be edited" (current behavior).
- Loading + error states (`CodeEditorLoading` already exists).

### A4. Diff view
- Reuse `file-edit` parts: reconstruct previous snapshot per path from the active
  message's `parts` (operations create/update/delete/rename/patch) to diff
  current-on-disk vs previous-generation.
- "Toggle Diff View" toolbar button; Monaco `createEditor`/`createDiffEditor` swap.
- Requires Monaco diff worker (bundle with the editor chunk).

### A5. Artifact hook
- In `message-parts.tsx`, stop stripping `<CodeProject>…</CodeProject>`; when present,
  render `CodeProjectPane` (or focus the code view). Parsing: extract `chatId` from the
  tag payload; fall back to the current chat's `view` toggle if absent.

### A6. Acceptance (Phase A)
- Edit a file → save → preview refreshes (existing `contentRevision`/`onContentChange`
  path) and `getFiles` reflects the change.
- Create/rename/delete files/folders persist via PATCH.
- `Cmd+S`, find/replace, diff view work inside the iframe-less in-app editor.
- Passes `bun run typecheck` / `bun run lint` / `bun run test` (react-chat unaffected).

## 5. Phase B — code-server-ready seam

### B1. Workspace abstraction (shared)
- `FileSource` becomes the contract for both editors. code-server mode is a
  `CodeServerFileSource` that talks to the proxy (below) instead of the web API, so the
  file tree can point at a live workspace dir.
- Add `WorkspaceDescriptor { chatId, files[], revision }` so materialization is idempotent.

### B2. Proxy route in `apps/preview-proxy` (mirror of preview)
- New catch-all `apps/preview-proxy/app/api/code-server/[chatId]/[[...path]]/route.ts`.
- Same shape as `v0-preview`: `authorizeProxyRequest` (origin check) →
  resolve runner target → forward HTTP + `upgrade` for WS (`code-server` needs ws for
  the editor) → strip hop-by-hop headers.
- Add a `lib/code-server.ts` with `proxyCodeServerRequest(request, chatId, path)`
  (model it on `apps/preview-proxy/lib/preview.ts`), including:
  - workspace target URL resolution (env `CODE_SERVER_RUNNER_URL` + `?folder=…`),
  - `x-code-server-token` header passing (analogous to `x-v0-preview-token`),
  - loading fallback page + postMessage (`v0-code-server-loading`) mirroring the preview
    loading route so the iframe shows a spinner until the editor responds.
- **Do not** add per-task env for these vars to `turbo.base.json` yet — add
  `CODE_SERVER_*` vars when Phase C ships.

### B3. Runner contract (interface only in Phase B)
```ts
interface CodeServerRunner {
  getTarget(chatId: string): Promise<URL>        // runner may be remote
  ensureWorkspace(descriptor: WorkspaceDescriptor): Promise<string> // returns folder
  dispose(chatId: string): Promise<void>         // idle cleanup
}
```
- Provide `LocalCodeServerRunner` (Phase C) and document the interface so a
  container/sandbox runner can be added without touching the proxy.
- The proxy depends only on `getTarget`, so serverless Vercel stays thin; the runner is
  the long-lived part (see §7).

### B4. Deployment caveat (must be decided before Phase C)
- code-server is a long-running Node v22 process; **it cannot run in a Vercel serverless
  function.** Options:
  1. **Local/self-hosted runner:** one `code-server` process per deployment, workspace
     dirs under a root folder; use code-server's single-instance session routing
     (`?folder=`) to open per-chat subfolders — most resource-efficient.
  2. **Per-chat containers** on a VM / Docker host or a sandbox provider (E2B, Coder
     Workspaces, etc.) — most isolated.
  3. **This repo's dev flow:** a turbo task (e.g. `code-server`) in
     `examples/v0-clone` that starts the installed binary on port 8080 pointing at a
     `workspaces/` dir for local development.
- Pick the target in Phase C; the seam keeps the proxy unchanged.

## 6. Phase C — wire in code-server (installed build)

Using `/usr/local/lib/code-server-0.0.84/bin/code-server` (VS Code 1.108.1, includes
`v0-bridge` extension, `/api/git-show`, `/api/v0`):

### C1. Materialize workspace
- On first `getTarget(chatId)`: `GET /api/chats/{id}/files`, write each file to
  `<workspace-root>/{chatId}/<path>` (utf8/base64), record a `.revision` marker for
  idempotent re-materialization.

### C2. Launch
- `LocalCodeServerRunner` spawns:
  ```
  code-server <workspaceRoot>/{chatId} \
    --auth none --bind-addr 127.0.0.1:8080 \
    --disable-telemetry --disable-update-check --disable-workspace-trust \
    --idle-timeout-seconds 1800 --trusted-origins <web+proxy origins>
  ```
  Auth is delegated to the proxy's `authorizeProxyRequest` (origin isolation), matching
  the preview iframe model. WS upgrade auth is handled by code-server's origin check +
  `--trusted-origins`.
- Single instance per deployment + per-chat folder (option B4-1) OR per-chat process
  (B4-2). Tie-breaking: prefer single-instance for dev; container per chat for prod.

### C3. Edit sync back to v0
- `v0-bridge` extension already persists edits to its bridge; point
  `/api/v0`'s target (`127.0.0.1:9876`) at the app so saves flow to the v0 Files API
  (PATCH). For robustness, add a `chokidar` watcher on the workspace dir that debounces
  and PATCHes diffs to `updateFiles`, then bumps `contentRevision` so the preview
  reloads (reuses `onContentChange`).
- Handle deletes (`content: null`) and renames (delete + create) on the watcher.

### C4. UI wiring
- Add `code-server` as a third `ChatView` option ("VS Code") in
  `chat-header.tsx`/`chat-workspace.tsx`, rendered as a `CodeServerPane` iframe pointing
  at `/api/code-server/{chatId}/` through the preview-proxy origin (same
  origin-resolution as `PreviewPane`, `apps/web/lib/preview-proxy.ts`).
- Loading state via the `v0-code-server-loading` postMessage route (B2).
- Fall back to the in-app Monaco editor if the runner is unreachable (proxy returns
  loading page → after N seconds, surface "Start code-server" button instead of a dead
  iframe).

### C5. Acceptance (Phase C)
- Open chat → Code tab → VS Code: editor loads in iframe, file tree matches `getFiles`.
- Edit + save in VS Code → file reflected in `getFiles` → preview refreshes.
- `/api/v0` bridge + `/api/git-show` work inside the editor (diff view).
- Idle → process shuts down; next open re-materializes.

## 7. Security model
- Same origin-isolation as the preview: generated project and editor run on the proxy
  origin, iframe uses `sandbox="allow-scripts allow-same-origin"` only.
- code-server runs with `--auth none` ONLY behind the authorized proxy; never expose the
  runner port directly. `--disable-proxy` on the runner unless app port-forwarding is a
  feature.
- Per-chat path sanitization on the proxy (reuse `normalizePreviewPath` from
  `packages/v0/src/preview-proxy.ts`).
- Token passing: short-lived per-chat token header (mirror `x-v0-preview-token`).
- Watcher sync runs server-side, debounced, content-type validated (utf8 only).

## 8. Work breakdown (suggested order)

| # | Task | Depends |
|---|---|---|
| 1 | `FileSource` interface + `ApiFileSource` | — |
| 2 | File tree component replacing flat list | 1 |
| 3 | Monaco dynamic import + editor pane | 1 |
| 4 | Save/unsaved/diff wiring + artifact hook | 2,3 |
| 5 | `v0-code-server` proxy route + loading page (preview-proxy) | — |
| 6 | `CodeServerRunner` interface + local dev turbo task | 5 |
| 7 | Workspace materialize + launch + idle (LocalCodeServerRunner) | 6 |
| 8 | Watcher sync → Files API | 7 |
| 9 | `CodeServerPane` + third view toggle + fallback | 5,7 |
| 10 | v0-bridge `/api/v0` + `/api/git-show` wiring | 7 |
| 11 | Prod runner decision (container/sandbox) | 6 |
| 12 | Docs update (v0-clone README) | all |

## 9. Open questions
1. Prod runner: single shared instance vs per-chat container vs sandbox provider? (blocker for C)
2. Bundle budget: Monaco adds ~2–4 MB; acceptable behind dynamic import?
3. Should code-server edits merge with concurrent agent file-edit parts, or lock the
   workspace while the agent is streaming?
4. Do we need file upload/download inside the editor (code-server supports both)?

## 10. Success criteria
- `bun run typecheck && bun run lint && bun run test` green after each phase.
- Phase A: in-app editor fully replaces the textarea UX; preview refreshes on save.
- Phase C: full VS Code in-browser editing of the generated project, edits synced to the
  v0 Files API and reflected in the live preview, idle cleanup works.
