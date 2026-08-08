import { ApiKeySettings } from '@/components/settings/api-key-settings'
import { getV0ApiKeyStatus } from '@/lib/v0-client'

export default async function ApiKeysSettingsPage() {
  const apiKeyStatus = await getV0ApiKeyStatus()

  return <ApiKeySettings {...apiKeyStatus} />
}
