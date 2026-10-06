/**
 * Acesso ao Firestore para as mensagens enviadas
 * através do formulário público de contacto da ICFR Família Redimida.
 *
 * Esta é a única coleção onde um visitante anónimo pode criar registos.
 *
 * A segurança é controlada pelas regras do Firestore:
 *
 * - Apenas os campos esperados podem ser enviados.
 * - Existem limites de tamanho para os campos.
 * - As mensagens novas são sempre criadas com:
 *   read = false
 *   handled = false
 * - O visitante pode apenas enviar mensagens.
 * - O visitante não pode listar, ler, editar ou eliminar mensagens.
 *
 * A leitura e gestão das mensagens ficam reservadas
 * aos utilizadores autorizados da administração da ICFR.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import type { ContactMessage } from '~/types'
import { toIsoString } from '~/utils/firestoreDates'

/**
 * Nome interno da coleção no Firestore.
 *
 * Não traduzir este valor sem também migrar
 * os dados e as regras do Firestore.
 */
const COLLECTION = 'messages'

/**
 * Dados enviados pelo formulário público de contacto.
 *
 * Os restantes campos são definidos automaticamente
 * pelo sistema.
 */
export type NewContactMessage = Pick<
  ContactMessage,
  'name' | 'email' | 'phone' | 'message'
>

export function useMessagesRepository() {
  const nuxt = useNuxtApp()

  /**
   * Carrega as mensagens da ICFR.
   *
   * As mensagens mais recentes aparecem primeiro
   * na caixa de entrada.
   */
  async function fetchMessages(): Promise<ContactMessage[]> {
    const snap = await getDocs(
      query(
        collection(nuxt.$firestore, COLLECTION),
        orderBy('submittedAt', 'desc')
      )
    )

    return snap.docs.map((d) => {
      const data = d.data() as Omit<ContactMessage, 'id'>

      return {
        ...data,
        id: d.id,
        submittedAt: toIsoString(data.submittedAt),
      }
    })
  }

  /**
   * Cria uma nova mensagem enviada
   * pelo formulário público da ICFR.
   */
  async function createMessage(
    input: NewContactMessage
  ): Promise<void> {
    await addDoc(
      collection(nuxt.$firestore, COLLECTION),
      {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        message: input.message.trim(),

        /**
         * A data e hora são geradas pelo servidor
         * para evitar depender do relógio do dispositivo do visitante.
         */
        submittedAt: serverTimestamp(),

        /**
         * Toda mensagem nova começa como:
         * não lida e não resolvida.
         */
        read: false,
        handled: false,
      }
    )
  }

  /**
   * Atualiza o estado de uma mensagem.
   *
   * Pode marcar como:
   * - lida
   * - resolvida
   */
  async function updateMessage(
    id: string,
    updates: Partial<
      Pick<ContactMessage, 'read' | 'handled'>
    >
  ): Promise<void> {
    await setDoc(
      doc(
        nuxt.$firestore,
        COLLECTION,
        id
      ),
      updates,
      {
        merge: true,
      }
    )
  }

  /**
   * Elimina uma mensagem da caixa
   * de entrada da ICFR.
   */
  async function deleteMessage(
    id: string
  ): Promise<void> {
    await deleteDoc(
      doc(
        nuxt.$firestore,
        COLLECTION,
        id
      )
    )
  }

  return {
    fetchMessages,
    createMessage,
    updateMessage,
    deleteMessage,
  }
}