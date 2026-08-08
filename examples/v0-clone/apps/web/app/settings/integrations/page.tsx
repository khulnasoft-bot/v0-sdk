import { ComingSoon } from '@/components/settings/coming-soon'
import { IntegrationsIcon } from '@/lib/icons'

export default function IntegrationsSettingsPage() {
  return (
    <ComingSoon
      description="Connect external tools and services."
      icon={IntegrationsIcon}
      title="Integrations"
    />
  )
}
