'use client'

import type { FileUIPart } from 'ai'
import { nanoid } from 'nanoid'
import { useCallback, useState } from 'react'

export const PROMPT_QUEUE_LIMIT = 10

export type QueuedPrompt = {
  id: string
  text: string
  files: FileUIPart[]
}

export function usePromptQueue() {
  const [queue, setQueue] = useState<QueuedPrompt[]>([])

  const enqueue = useCallback((text: string, files: FileUIPart[] = []) => {
    setQueue((current) => {
      if (current.length >= PROMPT_QUEUE_LIMIT) {
        return current
      }
      return [...current, { id: nanoid(), text, files }]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setQueue((current) => current.filter((item) => item.id !== id))
  }, [])

  const clear = useCallback(() => setQueue([]), [])

  const dequeue = useCallback(() => {
    let next: QueuedPrompt | undefined
    setQueue((current) => {
      if (current.length === 0) return current
      ;[next] = current
      return current.slice(1)
    })
    return next
  }, [])

  return { queue, enqueue, remove, clear, dequeue }
}
