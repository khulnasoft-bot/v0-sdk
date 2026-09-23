import 'server-only'

import { cookies } from 'next/headers'

export const FIGMA_TOKEN_COOKIE = 'v0-clone-figma-token'

export async function getFigmaToken() {
  if (process.env.FIGMA_CLIENT_ID && process.env.FIGMA_CLIENT_SECRET) {
    const cookieStore = await cookies()
    return cookieStore.get(FIGMA_TOKEN_COOKIE)?.value
  }
  return null
}

export async function setFigmaToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(FIGMA_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearFigmaToken() {
  const cookieStore = await cookies()
  cookieStore.delete(FIGMA_TOKEN_COOKIE)
}

export async function figmaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getFigmaToken()
  if (!token) throw new Error('Figma token not configured.')

  const url = `https://api.figma.com/v1${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Figma-Token': token,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    const message = body?.message ?? `Figma API error ${response.status}`
    if (response.status === 429) {
      throw new Error(`Figma rate limit exceeded: ${message}`)
    }
    throw new Error(message)
  }

  return response.json()
}
