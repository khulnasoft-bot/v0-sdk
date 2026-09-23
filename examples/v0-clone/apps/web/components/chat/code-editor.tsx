'use client'

import type { Files } from '@v0-sdk/react'
import { useFiles, useUpdateChatFiles } from '@v0-sdk/react/swr'
import { use, useEffect, useMemo, useState } from 'react'
import { Loader } from '@/components/ai-elements/loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileIcon,
  CopyIcon,
  PlusIcon,
  RenameIcon,
  SearchIcon,
  SidebarToggleIcon,
  SpinnerIcon,
  TrashIcon,
  CheckIcon,
  CrossIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'

type ChatFile = Files['files'][number]
export type ChatFilesResult = { files: Files['files'] } | { error: string }

type EditorMode = 'edit' | 'diff'

export function CodeEditorLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader size={16} />
      Loading files…
    </div>
  )
}

export function CodeEditorPane({
  chatId,
  filesPromise,
  isPreviewReady,
}: {
  chatId: string
  filesPromise: Promise<ChatFilesResult>
  isPreviewReady: boolean
}) {
  const result = use(filesPromise)

  if ('error' in result) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-destructive">
        {result.error}
      </div>
    )
  }

  return <CodeEditor chatId={chatId} files={result.files} isPreviewReady={isPreviewReady} />
}

function CodeEditor({
  chatId,
  files: initialFiles,
  isPreviewReady,
}: {
  chatId: string
  files: ChatFile[]
  isPreviewReady: boolean
}) {
  const filesUrl = `/api/chats/${encodeURIComponent(chatId)}/files`
  const filesQuery = useFiles(filesUrl, {
    fallbackData: { files: initialFiles },
    revalidateOnMount: false,
  })
  const updateFiles = useUpdateChatFiles(filesUrl)
  const cachedFiles = filesQuery.data?.files ?? initialFiles
  const [files, setFiles] = useState(cachedFiles)
  const [savedFiles, setSavedFiles] = useState(cachedFiles)
  const [selectedPath, setSelectedPath] = useState(
    cachedFiles.find((file: ChatFile) => file.encoding === 'utf8')?.path ??
      cachedFiles[0]?.path ??
      null,
  )
  const [splitPath, setSplitPath] = useState(selectedPath)
  const [showExplorer, setShowExplorer] = useState(true)
  const [split, setSplit] = useState(false)
  const [mode, setMode] = useState<EditorMode>('edit')
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [renamePath, setRenamePath] = useState<string | null>(null)
  const [deletePath, setDeletePath] = useState<string | null>(null)

  const isSaving = updateFiles.isMutating
  const selectedFile = files.find((file: ChatFile) => file.path === selectedPath)
  const splitFile = files.find((file: ChatFile) => file.path === splitPath)

  const changedFiles = files.filter((file: ChatFile) => {
    if (file.encoding !== 'utf8') return false
    return savedFiles.find((saved: ChatFile) => saved.path === file.path)?.content !== file.content
  })

  const searchResults = useMemo(() => {
    if (!globalSearch) return []
    return files.filter(
      (file: ChatFile) =>
        file.encoding === 'utf8' &&
        file.content?.toLowerCase().includes(globalSearch.toLowerCase()),
    )
  }, [files, globalSearch])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void save()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setShowExplorer((value) => !value)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const updateFile = (path: string, content: string) => {
    setStatus(null)
    setFiles((current: ChatFile[]) =>
      current.map((file: ChatFile) => (file.path === path ? { ...file, content } : file)),
    )
  }

  async function save() {
    if (!changedFiles.length) return
    if (!isPreviewReady) {
      setStatus('Preview is still loading')
      return
    }
    setStatus(null)
    try {
      await updateFiles.trigger({
        files: changedFiles.map(({ path, content }: { path: string; content: string }) => ({
          path,
          content,
        })),
      })
      setSavedFiles(files)
      setStatus('Saved')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save files.')
    }
  }

  const reset = () => {
    setFiles(savedFiles)
    setStatus('Changes discarded')
  }

  const copy = async () => {
    if (selectedFile?.encoding !== 'utf8') return
    try {
      await navigator.clipboard.writeText(selectedFile.content ?? '')
      setStatus('Copied')
    } catch {
      setStatus('Copy failed')
    }
  }

  const addFile = (path = newPath) => {
    const clean = path.trim()
    if (!clean || files.some((file: ChatFile) => file.path === clean)) {
      setStatus('A unique file path is required')
      return
    }
    const file = { path: clean, encoding: 'utf8', content: '' } as ChatFile
    setFiles((current: ChatFile[]) => [...current, file])
    setSelectedPath(clean)
    setNewPath('')
    setStatus('File created')
  }

  const rename = () => {
    if (
      !renamePath ||
      !newPath.trim() ||
      files.some((file: ChatFile) => file.path === newPath.trim())
    ) {
      setStatus('A unique file path is required')
      return
    }
    const path = newPath.trim()
    setFiles((current: ChatFile[]) =>
      current.map((file: ChatFile) => (file.path === renamePath ? { ...file, path } : file)),
    )
    setSelectedPath(path)
    setRenamePath(null)
    setNewPath('')
    setStatus('File renamed')
  }

  const remove = () => {
    if (!deletePath) return
    const remaining = files.filter((file: ChatFile) => file.path !== deletePath)
    setFiles(remaining)
    setSelectedPath(remaining[0]?.path ?? null)
    setDeletePath(null)
    setStatus('File deleted')
  }

  const replaceCurrent = () => {
    if (selectedFile?.encoding !== 'utf8' || !query) return
    updateFile(selectedFile.path, (selectedFile.content ?? '').split(query).join(replace))
    setStatus('Replaced')
  }

  if (!files.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No files yet.
      </div>
    )
  }

  const renderEditor = (file: ChatFile | undefined) => {
    if (!file) return null
    if (file.encoding === 'utf8') {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>{file.path}</span>
            {file.content !==
            savedFiles.find((item: ChatFile) => item.path === file.path)?.content ? (
              <span className="text-foreground">• unsaved</span>
            ) : null}
          </div>
          <textarea
            aria-label={`Edit ${file.path}`}
            className="min-h-0 flex-1 resize-none bg-background p-4 font-mono text-xs leading-5 text-foreground outline-none"
            disabled={isSaving}
            onChange={(event) => updateFile(file.path, event.target.value)}
            spellCheck={false}
            value={file.content ?? ''}
          />
        </div>
      )
    }
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Binary files cannot be edited.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      {showExplorer ? (
        <aside className="flex w-56 shrink-0 flex-col border-r border-border">
          <div className="flex items-center gap-1 border-b border-border p-2">
            <span className="flex-1 text-xs font-medium">Explorer</span>
            <Button
              aria-label="Create file"
              onClick={() => addFile(`untitled-${files.length + 1}.tsx`)}
              size="icon-xs"
              variant="ghost"
            >
              <PlusIcon />
            </Button>
            <Button
              aria-label="Hide explorer"
              onClick={() => setShowExplorer(false)}
              size="icon-xs"
              variant="ghost"
            >
              <SidebarToggleIcon />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {files.map((file: ChatFile) => (
              <div className="group flex items-center gap-1" key={file.path}>
                <button
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground',
                    file.path === selectedPath && 'bg-accent text-foreground',
                  )}
                  onClick={() => setSelectedPath(file.path)}
                  title={file.path}
                  type="button"
                >
                  <FileIcon />
                  <span className="truncate">{file.path}</span>
                  {changedFiles.some((item: ChatFile) => item.path === file.path) ? (
                    <span aria-label="Unsaved">•</span>
                  ) : null}
                </button>
                <Button
                  aria-label={`Rename ${file.path}`}
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setRenamePath(file.path)
                    setNewPath(file.path)
                  }}
                  size="icon-xs"
                  variant="ghost"
                >
                  <RenameIcon />
                </Button>
                <Button
                  aria-label={`Delete ${file.path}`}
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => setDeletePath(file.path as string)}
                  size="icon-xs"
                  variant="ghost"
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <Button className="w-full" onClick={() => addFile()} size="xs" variant="outline">
              <PlusIcon data-icon="inline-start" />
              New file
            </Button>
          </div>
        </aside>
      ) : (
        <Button
          aria-label="Show explorer"
          className="m-2 shrink-0"
          onClick={() => setShowExplorer(true)}
          size="icon-xs"
          variant="outline"
        >
          <SidebarToggleIcon />
        </Button>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-10 flex-wrap items-center gap-1 border-b border-border px-2">
          <span className="min-w-0 flex-1 truncate px-2 text-xs text-muted-foreground">
            {selectedFile?.path}
          </span>
          {changedFiles.length ? (
            <span className="text-[11px] text-muted-foreground">{changedFiles.length} unsaved</span>
          ) : null}
          {status ? (
            <span
              className={cn(
                'text-[11px]',
                status === 'Saved' ? 'text-muted-foreground' : 'text-destructive',
              )}
            >
              {status}
            </span>
          ) : null}
          <Button aria-label="Copy file" onClick={() => void copy()} size="icon-xs" variant="ghost">
            <CopyIcon />
          </Button>
          <Button
            aria-label="Find and replace"
            onClick={() => setShowSearch((value) => !value)}
            size="icon-xs"
            variant="ghost"
          >
            <SearchIcon />
          </Button>
          <Button
            aria-label="Global search"
            onClick={() => setShowGlobalSearch((value) => !value)}
            size="icon-xs"
            variant="ghost"
          >
            <SearchIcon />
          </Button>
          <Button
            aria-label="Toggle diff"
            onClick={() => setMode(mode === 'edit' ? 'diff' : 'edit')}
            size="xs"
            variant={mode === 'diff' ? 'secondary' : 'ghost'}
          >
            Diff
          </Button>
          <Button
            aria-label="Toggle split"
            onClick={() => setSplit((value) => !value)}
            size="xs"
            variant={split ? 'secondary' : 'ghost'}
          >
            Split
          </Button>
          <Button
            disabled={!changedFiles.length || isSaving}
            onClick={reset}
            size="xs"
            variant="ghost"
          >
            Reset
          </Button>
          <Button disabled={!changedFiles.length || isSaving} onClick={() => void save()} size="xs">
            {isSaving ? <SpinnerIcon /> : null}
            {isSaving ? 'Saving' : 'Save'}
          </Button>
        </div>

        {showSearch ? (
          <div className="flex gap-2 border-b border-border p-2">
            <Input
              aria-label="Find in file"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find"
              value={query}
            />
            <Input
              aria-label="Replace in file"
              onChange={(event) => setReplace(event.target.value)}
              placeholder="Replace"
              value={replace}
            />
            <Button onClick={replaceCurrent} size="xs">
              Replace all
            </Button>
          </div>
        ) : null}

        {showGlobalSearch ? (
          <div className="border-b border-border p-2">
            <Input
              aria-label="Search all files"
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search all files"
              value={globalSearch}
            />
            {globalSearch ? (
              <div className="mt-2 flex flex-col gap-1 text-xs">
                {searchResults.length ? (
                  searchResults.map((file: ChatFile) => (
                    <button
                      className="text-left text-muted-foreground hover:text-foreground"
                      key={file.path}
                      onClick={() => {
                        setSelectedPath(file.path)
                        setShowGlobalSearch(false)
                      }}
                      type="button"
                    >
                      {file.path}
                    </button>
                  ))
                ) : (
                  <span className="text-muted-foreground">No results</span>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          {mode === 'diff' ? (
            <div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-border">
              {renderEditor(savedFiles.find((file: ChatFile) => file.path === selectedPath))}
              {renderEditor(selectedFile)}
            </div>
          ) : split ? (
            <div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-border">
              {renderEditor(selectedFile)}
              <div className="flex min-w-0 flex-col">
                <select
                  aria-label="Select split file"
                  className="border-b border-border bg-background p-2 text-xs"
                  onChange={(event) => setSplitPath(event.target.value)}
                  value={splitPath ?? ''}
                >
                  {files.map((file: ChatFile) => (
                    <option key={file.path} value={file.path}>
                      {file.path}
                    </option>
                  ))}
                </select>
                {renderEditor(splitFile)}
              </div>
            </div>
          ) : (
            renderEditor(selectedFile)
          )}
        </div>
      </div>

      {renamePath ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-lg">
            <h2 className="text-sm font-medium">Rename file</h2>
            <Input
              aria-label="New file path"
              autoFocus
              onChange={(event) => setNewPath(event.target.value)}
              value={newPath}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setRenamePath(null)} size="sm" variant="ghost">
                <CrossIcon data-icon="inline-start" />
                Cancel
              </Button>
              <Button onClick={rename} size="sm">
                <CheckIcon data-icon="inline-start" />
                Rename
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deletePath ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-lg">
            <h2 className="text-sm font-medium">Delete {deletePath}?</h2>
            <p className="text-xs text-muted-foreground">This removes the file from the editor.</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeletePath(null)} size="sm" variant="ghost">
                Cancel
              </Button>
              <Button onClick={remove} size="sm" variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
