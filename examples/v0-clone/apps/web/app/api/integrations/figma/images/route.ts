import { NextResponse } from 'next/server'
import { figmaRequest } from '@/lib/figma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const ids = searchParams.get('ids')
  const format = searchParams.get('format') ?? 'png'

  if (!key || !ids) {
    return NextResponse.json({ message: 'Missing Figma key or ids.' }, { status: 400 })
  }

  try {
    const images = await figmaRequest<{
      err: string | null
      images: Record<string, string>
      scale?: number
    }>(`/images/${key}?ids=${ids}&format=${format}`)

    return NextResponse.json(images)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export Figma images.'
    return NextResponse.json({ message }, { status: 400 })
  }
}
