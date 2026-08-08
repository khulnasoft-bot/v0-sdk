import { ComingSoon } from '@/components/settings/coming-soon'
import { MembersIcon } from '@/lib/icons'

export default function MembersSettingsPage() {
  return (
    <ComingSoon
      description="Invite and manage workspace members."
      icon={MembersIcon}
      title="Members"
    />
  )
}
