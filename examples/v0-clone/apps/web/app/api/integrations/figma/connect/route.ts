import { NextResponse } from 'next/server'

const FIGMA_AUTHORIZE_URL = 'https://www.figma.com/oauth/authorize'

export async function GET(_request: Request) {
  const clientId = process.env.FIGMA_CLIENT_ID
  const redirectUri = process.env.FIGMA_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ message: 'Figma OAuth not configured.' }, { status: 400 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'files:read',
    response_type: 'code',
    state: crypto.randomUUID(),
  })

  const url = `${FIGMA_AUTHORIZE_URL}?${params.toString()}`
  return NextResponse.redirect(url, 302)
}
