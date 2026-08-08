'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ApiKeyIcon,
  GeneralSettingsIcon,
  IntegrationsIcon,
  MembersIcon,
  MemoriesIcon,
  ToolIcon,
  UsageIcon,
} from '@/lib/icons'

const SECTIONS = [
  { href: '/settings/general', label: 'General', icon: GeneralSettingsIcon },
  { href: '/settings/memories', label: 'Memories', icon: MemoriesIcon },
  { href: '/settings/skills', label: 'Skills', icon: ToolIcon },
  { href: '/settings/integrations', label: 'Integrations', icon: IntegrationsIcon },
  { href: '/settings/members', label: 'Members', icon: MembersIcon },
  { href: '/settings/usage', label: 'Usage & Activity', icon: UsageIcon },
  { href: '/settings/api-keys', label: 'API Keys', icon: ApiKeyIcon },
] as const

export function SettingsNav({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  const pathname = usePathname()

  if (orientation === 'horizontal') {
    return (
      <nav aria-label="Settings" className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href

          return (
            <Link
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
                active && 'bg-sidebar-accent font-medium text-sidebar-foreground',
              )}
              href={href}
              key={href}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Settings" className="flex flex-col gap-0.5">
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href

        return (
          <Link
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
              active && 'bg-sidebar-accent font-medium text-sidebar-foreground',
            )}
            href={href}
            key={href}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
