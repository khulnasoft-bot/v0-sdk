import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FIGMA_TOKEN_URL = 'https://api.figma.com/v1/oauth/token'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const _state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.json({ message: `Figma OAuth error: ${error}` }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ message: 'Missing authorization code.' }, { status: 400 })
  }

  const clientId = process.env.FIGMA_CLIENT_ID
  const clientSecret = process.env.FIGMA_CLIENT_SECRET
  const redirectUri = process.env.FIGMA_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ message: 'Figma OAuth not configured.' }, { status: 400 })
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const response = await fetch(FIGMA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      { message: (json as { message?: string } | null)?.message ?? 'Failed to exchange code.' },
      { status: response.status },
    )
  }

  const token = (await response.json()) as { access_token?: string }
  const accessToken = token.access_token

  if (!accessToken) {
    return NextResponse.json({ message: 'No access token returned.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('v0-clone-figma-token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.redirect(new URL('/', request.url), 302)
}
