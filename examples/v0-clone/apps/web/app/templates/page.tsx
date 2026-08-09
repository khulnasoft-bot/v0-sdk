import { WorkspaceSurface } from '@/components/workspace/workspace-surface'

export default function TemplatesPage() {
  return (
    <WorkspaceSurface
      eyebrow="Library"
      title="Templates"
      description="Start from a focused foundation instead of a blank canvas."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="font-medium">Dashboard starter</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A clear shell for data-rich products.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <h2 className="font-medium">Marketing page</h2>
          <p className="mt-2 text-sm text-muted-foreground">A conversion-focused launch surface.</p>
        </div>
      </div>
    </WorkspaceSurface>
  )
}
