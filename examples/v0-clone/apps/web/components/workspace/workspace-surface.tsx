'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CodeIcon, EyeIcon, FileIcon, SearchIcon, SettingsIcon, SparklesIcon, TerminalIcon } from '@/lib/icons'

const navigation = [
  { href: '/', label: 'Home', icon: SparklesIcon },
  { href: '/projects', label: 'Projects', icon: FileIcon },
  { href: '/chats', label: 'Chats', icon: TerminalIcon },
  { href: '/design-systems', label: 'Design Systems', icon: CodeIcon },
  { href: '/templates', label: 'Templates', icon: EyeIcon },
  { href: '/search', label: 'Search', icon: SearchIcon },
]

const records = [
  { title: 'v0 clone workspace', kind: 'Project', href: '/projects/v0-clone' },
  { title: 'Build a landing page', kind: 'Chat', href: '/chats' },
  { title: 'Minimal product system', kind: 'Design System', href: '/design-systems' },
  { title: 'Dashboard starter', kind: 'Template', href: '/templates' },
]

export function WorkspaceSurface({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-full overflow-y-auto bg-background px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2 border-b pb-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function WorkspaceHome() {
  return (
    <WorkspaceSurface eyebrow="Workspace" title="Build with focus" description="A local prototype of the v0 workspace for projects, chats, code-server, and sandbox workflows.">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {navigation.slice(1, 5).map(({ href, label, icon: Icon }) => (
          <Link className="group flex min-h-36 flex-col justify-between rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-accent" href={href} key={href}>
            <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
            <div><h2 className="font-medium">{label}</h2><p className="mt-1 text-sm text-muted-foreground">Open {label.toLowerCase()} workspace</p></div>
          </Link>
        ))}
      </div>
    </WorkspaceSurface>
  )
}

export function SearchSurface() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => records.filter((record) => `${record.title} ${record.kind}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <WorkspaceSurface eyebrow="Navigate" title="Search your workspace" description="Find projects, chats, systems, and templates from one command surface.">
    <div className="flex max-w-2xl items-center gap-2"><SearchIcon className="size-4 text-muted-foreground" /><Input autoFocus onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, chats, and templates" value={query} /></div>
    <div className="flex flex-col gap-2">{filtered.length ? filtered.map((record) => <Link className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent" href={record.href} key={record.title}><span className="font-medium">{record.title}</span><span className="text-xs text-muted-foreground">{record.kind}</span></Link>) : <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No matching workspace items.</p>}</div>
  </WorkspaceSurface>
}

export function ProjectSurface() {
  return <WorkspaceSurface eyebrow="Project" title="v0 clone" description="A focused project workspace with local runtime prototypes.">
    <div className="grid gap-3 md:grid-cols-2"><Link className="rounded-xl border bg-card p-5 hover:bg-accent" href="/projects/v0-clone/code-server"><CodeIcon className="mb-8 size-5 text-muted-foreground" /><h2 className="font-medium">Code Server</h2><p className="mt-1 text-sm text-muted-foreground">Edit files and preview changes locally.</p></Link><Link className="rounded-xl border bg-card p-5 hover:bg-accent" href="/projects/v0-clone/sandbox"><TerminalIcon className="mb-8 size-5 text-muted-foreground" /><h2 className="font-medium">Sandbox</h2><p className="mt-1 text-sm text-muted-foreground">Run a local prototype and inspect output.</p></Link></div>
  </WorkspaceSurface>
}

const codeFiles = {
  'app/page.tsx': 'export default function Page() {\n  return <main>Hello v0</main>\n}',
  'app/globals.css': ':root {\n  --background: oklch(0.14 0.01 260);\n  --foreground: oklch(0.96 0 0);\n}',
  'package.json': '{\n  "name": "v0-clone",\n  "private": true,\n  "scripts": { "dev": "next dev" }\n}',
}

export function CodeServerSurface() {
  const [file, setFile] = useState<keyof typeof codeFiles>('app/page.tsx')
  const [files, setFiles] = useState(codeFiles)
  const [saved, setSaved] = useState(true)
  const [preview, setPreview] = useState(false)
  const code = files[file]
  const reset = () => { setFiles(codeFiles); setSaved(true) }
  return <WorkspaceSurface eyebrow="Code Server" title="Edit in your workspace" description="A local editor prototype with file selection, editable code, and a preview state.">
    <div className="overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 p-3"><div className="flex items-center gap-2"><CodeIcon className="size-4" /><span className="text-sm font-medium">v0-clone</span><span className="text-xs text-muted-foreground">• local</span></div><div className="flex gap-2"><Button onClick={reset} size="sm" variant="outline">Reset</Button><Button onClick={() => setPreview((value) => !value)} size="sm" variant="outline">{preview ? 'Close preview' : 'Open preview'}</Button><Button disabled={saved} onClick={() => setSaved(true)} size="sm">{saved ? 'Saved' : 'Save changes'}</Button></div></div>
      <div className="grid min-h-[460px] md:grid-cols-[220px_1fr]">
        <div className="border-b bg-muted/10 p-3 md:border-b-0 md:border-r"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Files</p>{(Object.keys(files) as Array<keyof typeof codeFiles>).map((name) => <button className={cn('block w-full rounded px-2 py-1.5 text-left text-sm', file === name ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground')} key={name} onClick={() => setFile(name)} type="button">{name}</button>)}</div>
        <div className="grid min-w-0 lg:grid-cols-2"><div className="flex min-w-0 flex-col"><div className="border-b px-4 py-2 text-xs text-muted-foreground">{file}{!saved && <span className="ml-2 text-amber-600">Unsaved</span>}</div><textarea aria-label={`Edit ${file}`} className="min-h-[360px] flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 outline-none" onChange={(event) => { setFiles((current) => ({ ...current, [file]: event.target.value })); setSaved(false) }} spellCheck={false} value={code} /></div>{preview && <div className="border-t bg-muted/10 p-4 lg:border-l lg:border-t-0"><div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><EyeIcon className="size-4" /> Live preview</div><div className="flex min-h-64 items-center justify-center rounded-lg border bg-background p-6 text-center"><div><p className="font-medium">Hello v0</p><p className="mt-1 text-sm text-muted-foreground">Previewing {file}</p></div></div></div>}</div>
      </div>
    </div>
  </WorkspaceSurface>
}

export function SandboxSurface() {
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'terminal' | 'preview'>('terminal')
  const [output, setOutput] = useState<string[]>(['$ sandbox ready', 'Waiting for a command…'])
  const toggleRuntime = () => { const next = !running; setRunning(next); setOutput((items) => [...items, next ? '$ bun run dev' : '$ stop', next ? 'Compiled successfully in 420ms' : 'Sandbox stopped']) }
  const reset = () => { setRunning(false); setTab('terminal'); setOutput(['$ sandbox reset', 'Waiting for a command…']) }
  return <WorkspaceSurface eyebrow="Sandbox" title="Run a safe prototype" description="Start, stop, and inspect a local runtime without connecting an external execution service.">
    <div className="flex flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><div className="flex items-center gap-2"><span className={cn('size-2 rounded-full', running ? 'bg-emerald-500' : 'bg-muted-foreground/40')} /><p className="font-medium">Local runtime</p></div><p className="mt-1 text-sm text-muted-foreground">{running ? 'Running on port 3000' : 'Stopped'}</p></div><div className="flex gap-2"><Button onClick={toggleRuntime} size="sm">{running ? 'Stop sandbox' : 'Start sandbox'}</Button><Button onClick={reset} size="sm" variant="outline">Reset</Button></div></div><div className="overflow-hidden rounded-xl border bg-muted/20"><div className="flex items-center justify-between border-b px-4 py-3"><div className="flex gap-1"><button className={cn('rounded px-2 py-1 font-mono text-xs', tab === 'terminal' && 'bg-accent')} onClick={() => setTab('terminal')} type="button">terminal</button><button className={cn('rounded px-2 py-1 font-mono text-xs', tab === 'preview' && 'bg-accent')} onClick={() => setTab('preview')} type="button">preview</button></div><Button onClick={() => setOutput([])} size="sm" variant="ghost">Clear</Button></div>{tab === 'terminal' ? <pre className="min-h-48 overflow-auto p-4 font-mono text-xs leading-6 text-muted-foreground">{output.join('\n')}</pre> : <div className="flex min-h-48 items-center justify-center p-6 text-center"><div><EyeIcon className="mx-auto mb-3 size-5 text-muted-foreground" /><p className="font-medium">{running ? 'Preview is available' : 'Start the sandbox to preview'}</p><p className="mt-1 text-sm text-muted-foreground">Local preview surface for v0-clone.</p></div></div>}</div></div>
  </WorkspaceSurface>
}

export function SettingsSurface() {
  const sections = ['Account', 'Preferences', 'Workspace', 'Memories', 'Skills', 'Integrations', 'Billing', 'Members', 'Usage & Activity', 'API Keys']
  const [active, setActive] = useState('Account')
  return <WorkspaceSurface eyebrow="Workspace settings" title={active} description="Configure your local v0 clone workspace. Changes in this prototype stay in the current session."><div className="grid gap-8 md:grid-cols-[220px_1fr]"><nav className="flex flex-col gap-1">{sections.map((section) => <button className={cn('rounded-md px-3 py-2 text-left text-sm', active === section ? 'bg-accent font-medium' : 'text-muted-foreground hover:text-foreground')} key={section} onClick={() => setActive(section)} type="button">{section}</button>)}</nav><div className="rounded-xl border p-6"><SettingsIcon className="mb-6 size-5 text-muted-foreground" /><h2 className="font-medium">{active} settings</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This section is ready for local configuration controls and can be connected to a backend without changing the navigation contract.</p><Button className="mt-6" onClick={() => undefined} size="sm">Save changes</Button></div></div></WorkspaceSurface>
}
