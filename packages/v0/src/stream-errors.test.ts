import { afterEach, describe, expect, it } from 'bun:test'
import { createV0Client, V0StreamError } from './index'

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
})

function stubFetch(status: number, body: string) {
  globalThis.fetch = (async () =>
    new Response(body, {
      status,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch
}

const createStreamParams = {
  message: 'hi',
  modelConfiguration: { modelId: 'v0-mini', imageGenerations: false },
} as const

describe('stream endpoints surface HTTP errors', () => {
  it('createStream rejects when the API returns an error status instead of hanging', async () => {
    stubFetch(403, JSON.stringify({ message: 'daily limit reached' }))
    const v0 = createV0Client({ auth: 'test-key' })

    const result = await v0.chats.createStream(createStreamParams)
    await expect(result.final).rejects.toThrow(V0StreamError)
  })

  it('createStream iteration throws V0StreamError instead of hanging', async () => {
    stubFetch(429, JSON.stringify({ message: 'rate limited' }))
    const v0 = createV0Client({ auth: 'test-key' })

    const result = await v0.chats.createStream(createStreamParams)
    const iterator = result.stream[Symbol.asyncIterator]()
    await expect(iterator.next()).rejects.toThrow(V0StreamError)
  })

  it('sendStream rejects on error status', async () => {
    stubFetch(401, JSON.stringify({ message: 'unauthorized' }))
    const v0 = createV0Client({ auth: 'test-key' })

    const result = await v0.messages.sendStream({
      chatId: 'chat-1',
      message: 'hi',
    })
    await expect(result.final).rejects.toThrow(V0StreamError)
  })

  it('resume rejects on error status', async () => {
    stubFetch(500, JSON.stringify({ message: 'boom' }))
    const v0 = createV0Client({ auth: 'test-key' })

    const result = await v0.chats.resume({
      chatId: 'chat-1',
    })
    await expect(result.final).rejects.toThrow(V0StreamError)
  })
})
