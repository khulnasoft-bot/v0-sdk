import { ComingSoon } from '@/components/settings/coming-soon'
import { ToolIcon } from '@/lib/icons'

export default function SkillsSettingsPage() {
  return (
    <ComingSoon
      description="Custom capabilities the assistant can use."
      icon={ToolIcon}
      title="Skills"
    />
  )
}
