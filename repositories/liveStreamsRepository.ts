import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'

import type { LiveStream, RecordedStream } from '~/types/public'

const COLLECTION = 'liveStreams'

type StoredLive = Omit<LiveStream, 'id'> & {
  status: 'live'
}

type StoredRecorded = Omit<RecordedStream, 'id'> & {
  status: 'recorded'
  startedAt?: string
}

function clean<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  )
}

export function useLiveStreamsRepository() {
  const nuxt = useNuxtApp()

  async function fetchStreams(): Promise<{
    current: LiveStream | null
    recorded: RecordedStream[]
  }> {
    const snap = await getDocs(
      query(
        collection(nuxt.$firestore, COLLECTION),
        orderBy('startedAt', 'desc')
      )
    )

    let current: LiveStream | null = null
    const recorded: RecordedStream[] = []

    for (const item of snap.docs) {
      const data = item.data() as Record<string, any>

      if (data.status === 'live' && !current) {
        const { status, ...rest } = data
        current = {
          ...rest,
          id: item.id,
        } as LiveStream
      }

      if (data.status === 'recorded') {
        const { status, startedAt, ...rest } = data
        recorded.push({
          ...rest,
          id: item.id,
        } as RecordedStream)
      }
    }

    return {
      current,
      recorded,
    }
  }

  async function createLive(
    data: Omit<LiveStream, 'id'>
  ): Promise<LiveStream> {
    const payload: StoredLive = {
      ...data,
      status: 'live',
    }

    const ref = await addDoc(
      collection(nuxt.$firestore, COLLECTION),
      clean(payload)
    )

    return {
      ...data,
      id: ref.id,
    }
  }

  async function finishLive(
    id: string,
    data: Omit<RecordedStream, 'id'>,
    startedAt: string
  ): Promise<void> {
    const payload: StoredRecorded = {
      ...data,
      startedAt,
      status: 'recorded',
    }

    await setDoc(
      doc(nuxt.$firestore, COLLECTION, id),
      clean(payload),
      { merge: false }
    )
  }

  async function deleteStream(id: string): Promise<void> {
    await deleteDoc(
      doc(nuxt.$firestore, COLLECTION, id)
    )
  }

  return {
    fetchStreams,
    createLive,
    finishLive,
    deleteStream,
  }
}
