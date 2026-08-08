// Demo only: remove browser-provided API key support before using this example in production.
'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePreviewProxyOrigin } from '@/components/preview/preview-proxy-provider'
import { configureApiKey, removeConfiguredApiKey } from '@/lib/api-key-client'
import { SpinnerIcon } from '@/lib/icons'

export function ApiKeySettings({
  hasBrowserApiKey: initialHasBrowserApiKey,
  hasEnvironmentApiKey,
}: {
  hasBrowserApiKey: boolean
  hasEnvironmentApiKey: boolean
}) {
  const router = useRouter()
  const previewProxyOrigin = usePreviewProxyOrigin()
  const [hasBrowserApiKey, setHasBrowserApiKey] = useState(initialHasBrowserApiKey)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const saveApiKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = apiKey.trim()
    if (!value) return

    setError(null)
    setIsSaving(true)

    try {
      await configureApiKey({ apiKey: value, previewProxyOrigin })

      setApiKey('')
      setHasBrowserApiKey(true)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The v0 API key could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeApiKey = async () => {
    setError(null)
    setIsRemoving(true)

    try {
      await removeConfiguredApiKey(previewProxyOrigin)

      setHasBrowserApiKey(false)
      window.location.assign('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The saved API key could not be removed.')
      setIsRemoving(false)
    }
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">API Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the v0 API key used to power this workspace.
        </p>
      </div>

      <section className="grid gap-4">
        <h2 className="text-sm font-medium text-foreground">
          {hasEnvironmentApiKey ? 'Environment key' : 'v0 API key'}
        </h2>

        {hasEnvironmentApiKey ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              This deployment uses V0_API_KEY. Remove that environment variable to use a
              browser-provided key.
            </p>
            <p className="text-sm text-muted-foreground">
              Saving stores the key on both app origins. The preview proxy adds itself as a
              trusted host.
            </p>
          </div>
        ) : (
          <form className="grid max-w-sm gap-2" onSubmit={saveApiKey}>
            <Label htmlFor="settings-api-key">
              {hasBrowserApiKey ? 'Replace saved key' : 'API key'}
            </Label>
            <Input
              autoComplete="off"
              disabled={isSaving || isRemoving}
              id="settings-api-key"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="v1:..."
              spellCheck={false}
              type="password"
              value={apiKey}
            />
            <p className="text-xs text-muted-foreground">
              Create a key at{' '}
              <a
                className="text-foreground underline underline-offset-2"
                href="https://v0.app/chat/settings/keys"
                rel="noreferrer"
                target="_blank"
              >
                v0.app/chat/settings/keys
              </a>
              .
            </p>
            {hasBrowserApiKey ? (
              <p className="text-sm text-muted-foreground">A browser-provided key is saved.</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="mt-2 flex gap-2">
              {hasBrowserApiKey ? (
                <Button
                  disabled={isSaving || isRemoving}
                  onClick={() => void removeApiKey()}
                  type="button"
                  variant="outline"
                >
                  {isRemoving ? <SpinnerIcon className="size-4 animate-spin" /> : null}
                  {isRemoving ? 'Removing…' : 'Remove saved key'}
                </Button>
              ) : null}
              <Button disabled={!apiKey.trim() || isSaving || isRemoving} type="submit">
                {isSaving ? <SpinnerIcon className="size-4 animate-spin" /> : null}
                {isSaving ? 'Validating…' : hasBrowserApiKey ? 'Replace key' : 'Save key'}
              </Button>
            </div>
          </form>
        )}
      </section>

      <Separator />

      <section className="grid gap-2">
        <h2 className="text-sm font-medium text-foreground">Security</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Keys are stored in the browser and synced to the preview proxy. Never share keys in chat
          messages or code.
        </p>
      </section>
    </div>
  )
}
