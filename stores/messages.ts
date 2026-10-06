import { defineStore } from 'pinia'
import { recordAudit } from '~/utils/audit'
import { useMessagesRepository } from '~/repositories/messagesRepository'
import type { NewContactMessage } from '~/repositories/messagesRepository'
import type { ContactMessage } from '~/types'

/**
 * Gestão de mensagens da ICFR Família Redimida.
 *
 * As mensagens são enviadas pelo formulário público de contacto
 * e ficam disponíveis para a administração.
 *
 * O visitante pode enviar uma mensagem sem iniciar sessão,
 * mas não pode visualizar a caixa de entrada.
 */
export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<ContactMessage[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  /**
   * Total de mensagens ainda não lidas.
   */
  const unreadCount = computed(
    () => messages.value.filter((m) => !m.read).length
  )

  /**
   * Total de mensagens ainda pendentes de tratamento.
   */
  const openCount = computed(
    () => messages.value.filter((m) => !m.handled).length
  )

  /**
   * Carrega as mensagens da ICFR.
   *
   * Usa force = true quando for necessário atualizar
   * a caixa de entrada e procurar novas mensagens.
   */
  async function load(force = false) {
    if (loaded.value && !force) return

    const repo = useMessagesRepository()

    loading.value = true
    error.value = null

    try {
      messages.value = await repo.fetchMessages()
      loaded.value = true
    } catch (e: unknown) {
      error.value =
        e instanceof Error
          ? e.message
          : 'Erro ao carregar as mensagens da ICFR'

      useToast().error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Envia uma mensagem pelo formulário público
   * de contacto da ICFR Família Redimida.
   */
  async function submit(input: NewContactMessage) {
    const repo = useMessagesRepository()

    submitting.value = true
    error.value = null

    try {
      await repo.createMessage(input)

      useToast().success(
        'Mensagem enviada com sucesso para a ICFR Família Redimida'
      )
    } catch (e: unknown) {
      error.value =
        e instanceof Error
          ? e.message
          : 'Não foi possível enviar a mensagem'

      useToast().error(error.value)

      throw e
    } finally {
      submitting.value = false
    }
  }

  /**
   * Atualiza o estado de uma mensagem.
   *
   * O estado local só é alterado depois
   * de o Firestore confirmar a operação.
   */
  async function patch(
    id: string,
    updates: Partial<
      Pick<ContactMessage, 'read' | 'handled'>
    >
  ) {
    const idx = messages.value.findIndex(
      (m) => m.id === id
    )

    if (idx === -1) return

    const repo = useMessagesRepository()

    saving.value = true
    error.value = null

    try {
      await repo.updateMessage(id, updates)

      messages.value[idx] = {
        ...messages.value[idx],
        ...updates,
      } as ContactMessage
    } catch (e: unknown) {
      error.value =
        e instanceof Error
          ? e.message
          : 'Erro ao atualizar a mensagem'

      useToast().error(error.value)

      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Marca uma mensagem como lida.
   *
   * Se a mensagem já estiver lida,
   * nenhuma alteração é feita.
   */
  async function markRead(id: string) {
    const message = messages.value.find(
      (m) => m.id === id
    )

    if (!message || message.read) return

    await patch(id, {
      read: true,
    })

    recordAudit({
      action: 'message.read',
      targetId: id,
      targetLabel: message.name,
    })
  }

  /**
   * Marca uma mensagem como resolvida
   * ou reabre uma mensagem já tratada.
   */
  async function setHandled(
    id: string,
    handled: boolean
  ) {
    const message = messages.value.find(
      (m) => m.id === id
    )

    if (!message) return

    await patch(id, {
      handled,
    })

    recordAudit({
      action: 'message.handled',
      targetId: id,
      targetLabel: message.name,
    })

    useToast().success(
      handled
        ? 'Mensagem marcada como resolvida'
        : 'Mensagem reaberta com sucesso'
    )
  }

  /**
   * Elimina uma mensagem da caixa de entrada.
   */
  async function remove(id: string) {
    const message = messages.value.find(
      (m) => m.id === id
    )

    const repo = useMessagesRepository()

    saving.value = true
    error.value = null

    try {
      await repo.deleteMessage(id)

      messages.value = messages.value.filter(
        (m) => m.id !== id
      )

      recordAudit({
        action: 'message.delete',
        targetId: id,
        targetLabel: message?.name,
      })

      useToast().success(
        'Mensagem eliminada com sucesso'
      )
    } catch (e: unknown) {
      error.value =
        e instanceof Error
          ? e.message
          : 'Erro ao eliminar a mensagem'

      useToast().error(error.value)

      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    messages,

    loading,
    saving,
    submitting,
    error,
    loaded,

    unreadCount,
    openCount,

    load,
    submit,
    markRead,
    setHandled,
    remove,
  }
})