import { ComingSoon } from '@/components/settings/coming-soon'
import { MemoriesIcon } from '@/lib/icons'

export default function MemoriesSettingsPage() {
  return (
    <ComingSoon
      description="Manage what the assistant remembers across chats."
      icon={MemoriesIcon}
      title="Memories"
    />
  )
}
