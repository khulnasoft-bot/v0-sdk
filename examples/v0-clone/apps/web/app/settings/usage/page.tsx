import { ComingSoon } from '@/components/settings/coming-soon'
import { UsageIcon } from '@/lib/icons'

export default function UsageSettingsPage() {
  return (
    <ComingSoon
      description="Track your usage and activity."
      icon={UsageIcon}
      title="Usage & Activity"
    />
  )
}
