import { WorkspaceSurface } from '@/components/workspace/workspace-surface'

export default function DesignSystemsPage() {
  return (
    <WorkspaceSurface
      eyebrow="Library"
      title="Design systems"
      description="Reusable visual foundations for your generated products."
    >
      <div className="rounded-xl border p-6">
        <h2 className="font-medium">Minimal product system</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Geist typography, neutral surfaces, and compact controls.
        </p>
      </div>
    </WorkspaceSurface>
  )
}
