<script setup lang="ts">
import type { GroupChatMessage } from '~/types/groupChat'
import { useGroupChatRepository } from '~/repositories/groupChatRepository'
import { useUsersRepository } from '~/repositories/usersRepository'

const props = defineProps<{
  groupName: string
}>()

const authStore = useAuthStore()
const membersStore = useMembersStore()
const toast = useToast()

const repo = useGroupChatRepository()

const messages = ref<GroupChatMessage[]>([])
const draft = ref('')
const sending = ref(false)
const loading = ref(true)

const senderName = ref('Membro')
const senderMemberId = ref('')

const messagesBox = ref<HTMLElement | null>(null)

let unsubscribe: (() => void) | null = null

const currentUid = computed(() => authStore.user?.uid ?? '')

function formatTime(message: GroupChatMessage) {
  try {
    const date = message.createdAt?.toDate()

    if (!date) return ''

    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

function isMine(message: GroupChatMessage) {
  return !!currentUid.value && message.senderUid === currentUid.value
}

async function scrollToBottom() {
  await nextTick()

  if (!messagesBox.value) return

  messagesBox.value.scrollTop = messagesBox.value.scrollHeight
}

async function resolveSender() {
  const user = authStore.user

  if (!user) return

  try {
    const record = await useUsersRepository().fetchUserRecord(user.uid)

    senderMemberId.value = record?.memberId ?? ''

    if (record?.memberId) {
      const member = membersStore.members.find((item) => item.id === record.memberId)

      if (member?.name) {
        senderName.value = member.name
        return
      }
    }
  } catch {
    // Usa fallback abaixo.
  }

  senderName.value = user.displayName || user.email || 'Membro'
}

async function sendMessage() {
  const text = draft.value.trim()

  if (!text || !currentUid.value) return

  if (text.length > 3000) {
    toast.error('A mensagem deve ter no máximo 3000 caracteres.')
    return
  }

  sending.value = true

  try {
    await repo.sendTextMessage({
      groupName: props.groupName,
      senderUid: currentUid.value,
      senderName: senderName.value,
      senderMemberId: senderMemberId.value,
      text,
    })

    draft.value = ''
    await scrollToBottom()
  } catch (error) {
    console.error(error)

    toast.error('Não foi possível enviar a mensagem.')
  } finally {
    sending.value = false
  }
}

function handleEnter(event: KeyboardEvent) {
  if (event.shiftKey) return

  event.preventDefault()
  void sendMessage()
}

onMounted(async () => {
  await authStore.whenReady()
  await membersStore.load()

  await resolveSender()

  try {
    // Staff cria/prepara o documento do grupo.
    if (authStore.isStaff) {
      await repo.ensureGroup(props.groupName)
    }

    unsubscribe = repo.subscribeMessages(props.groupName, async (items) => {
      messages.value = items
      loading.value = false

      await scrollToBottom()
    })
  } catch (error) {
    console.error(error)
    loading.value = false
  }
})

onBeforeUnmount(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <!-- Cabeçalho -->
    <div class="flex items-center gap-3 border-b border-gray-200 bg-[#1E3A5F] px-5 py-4 text-white">
      <div class="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
        <Icon icon="mdi:account-group" class="h-6 w-6" />
      </div>

      <div>
        <h2 class="font-bold">
          {{ groupName }}
        </h2>

        <p class="text-xs text-white/70">Chat do grupo</p>
      </div>
    </div>

    <!-- Mensagens -->
    <div ref="messagesBox" class="h-[480px] overflow-y-auto bg-[#efeae2] px-3 py-5 sm:px-6">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />

          Carregando mensagens...
        </div>
      </div>

      <div
        v-else-if="!messages.length"
        class="flex h-full flex-col items-center justify-center text-center"
      >
        <div
          class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Icon icon="mdi:message-text-outline" class="h-7 w-7 text-gray-400" />
        </div>

        <p class="font-medium text-gray-700">Ainda não existem mensagens</p>

        <p class="mt-1 text-sm text-gray-500">
          Envie a primeira mensagem para
          {{ groupName }}.
        </p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['flex', isMine(message) ? 'justify-end' : 'justify-start']"
        >
          <div
            :class="[
              'max-w-[85%] rounded-xl px-3 py-2 shadow-sm sm:max-w-[70%]',
              isMine(message) ? 'rounded-br-sm bg-[#d9fdd3]' : 'rounded-bl-sm bg-white',
            ]"
          >
            <p v-if="!isMine(message)" class="mb-1 text-xs font-bold text-blue-700">
              {{ message.senderName }}
            </p>

            <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-900">
              {{ message.text }}
            </p>

            <div class="mt-1 flex justify-end gap-1">
              <span class="text-[10px] text-gray-500">
                {{ formatTime(message) }}
              </span>

              <Icon v-if="isMine(message)" icon="mdi:check-all" class="h-3.5 w-3.5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Caixa de envio -->
    <div class="flex items-end gap-2 border-t border-gray-200 bg-[#f0f2f5] p-3">
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200"
        title="Áudio será adicionado na próxima fase"
        disabled
      >
        <Icon icon="mdi:microphone-outline" class="h-6 w-6" />
      </button>

      <textarea
        v-model="draft"
        rows="1"
        maxlength="3000"
        placeholder="Escreva uma mensagem..."
        class="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-gray-200 focus:ring-blue-400"
        @keydown.enter="handleEnter"
      ></textarea>

      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!draft.trim() || sending || !currentUid"
        @click="sendMessage"
      >
        <Icon
          :icon="sending ? 'mdi:loading' : 'mdi:send'"
          :class="['h-5 w-5', sending && 'animate-spin']"
        />
      </button>
    </div>
  </div>
</template>
