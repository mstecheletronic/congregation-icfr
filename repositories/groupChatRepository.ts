import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'

import type { GroupChatMessage } from '~/types/groupChat'

function groupSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export function useGroupChatRepository() {
  const nuxt = useNuxtApp()

  function groupRef(groupName: string) {
    return doc(nuxt.$firestore, 'groupChats', groupSlug(groupName))
  }

  async function ensureGroup(groupName: string) {
    await setDoc(
      groupRef(groupName),
      {
        name: groupName,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  function subscribeMessages(
    groupName: string,
    callback: (messages: GroupChatMessage[]) => void
  ): Unsubscribe {
    const ref = collection(groupRef(groupName), 'messages')

    const q = query(ref, orderBy('createdAt', 'desc'), limit(100))

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as GroupChatMessage
        )
        .reverse()

      callback(messages)
    })
  }

  async function sendTextMessage(input: {
    groupName: string
    senderUid: string
    senderName: string
    senderMemberId: string
    text: string
  }) {
    const ref = collection(groupRef(input.groupName), 'messages')

    await addDoc(ref, {
      senderUid: input.senderUid,
      senderName: input.senderName,
      senderMemberId: input.senderMemberId,
      type: 'text',
      text: input.text.trim(),
      createdAt: serverTimestamp(),
    })
  }

  return {
    ensureGroup,
    subscribeMessages,
    sendTextMessage,
  }
}
