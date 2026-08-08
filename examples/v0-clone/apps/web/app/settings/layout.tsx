import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border p-3 md:hidden">
        <p className="px-2.5 py-1.5 text-sm font-semibold text-foreground">Settings</p>
        <SettingsNav orientation="horizontal" />
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3 md:flex">
          <p className="px-2.5 py-1.5 text-sm font-semibold text-foreground">Settings</p>
          <SettingsNav />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
