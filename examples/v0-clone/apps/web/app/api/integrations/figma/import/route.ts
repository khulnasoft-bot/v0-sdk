import { NextResponse } from 'next/server'
import { figmaRequest } from '@/lib/figma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ message: 'Missing Figma file key.' }, { status: 400 })
  }

  try {
    const file = await figmaRequest<{
      name: string
      document: { id: string; name: string; type: string; children?: unknown[] }
      pages: Array<{ id: string; name: string }>
    }>(`/files/${key}`)

    return NextResponse.json(file)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Figma file.'
    return NextResponse.json({ message }, { status: 400 })
  }
}
