import { defineStore } from 'pinia'
import { recordAudit } from '~/utils/audit'
import { useMembersRepository } from '~/repositories/membersRepository'
import { churchNumberKey, normaliseChurchNumber } from '~/utils/churchNumber'
import { isYouth } from '~/utils/youth'
import {
  statusUpdatesForRoll,
  summariseStatusUpdates,
  type StatusUpdate,
} from '~/utils/attendanceStatus'
import type { AttendanceRecord, Member, MemberFilters } from '~/types'

export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  const filters = ref<MemberFilters>({
    search: '',
    gender: '',
    congregation: '',
    status: '',
    tab: 'all',
  })

  /**
   * Valores internos.
   * Não traduzir estes status porque outros módulos podem depender deles.
   */
  const HIDDEN_FROM_ALL: Member['status'][] = ['Late']

  const filteredMembers = computed(() => {
    let result = [...members.value]

    const { search, gender, congregation, status, tab } = filters.value

    // Filtros das abas
    if (tab === 'brothers') {
      result = result.filter(
        (m) =>
          m.gender === 'Male' &&
          !HIDDEN_FROM_ALL.includes(m.status)
      )
    } else if (tab === 'sisters') {
      result = result.filter(
        (m) =>
          m.gender === 'Female' &&
          !HIDDEN_FROM_ALL.includes(m.status)
      )
    } else if (tab === 'active') {
      result = result.filter(
        (m) => m.status === 'Active'
      )
    } else if (tab === 'inactive') {
      result = result.filter(
        (m) =>
          !['Active', 'Late'].includes(m.status)
      )
    } else if (tab === 'disfellowshipped') {
      result = result.filter(
        (m) => m.status === 'Disfellowshipped'
      )
    } else if (tab === 'transfer') {
      result = result.filter(
        (m) => m.status === 'Transfer'
      )
    } else if (tab === 'weak') {
      result = result.filter(
        (m) => m.status === 'Weak'
      )
    } else if (tab === 'late') {
      result = result.filter(
        (m) => m.status === 'Late'
      )
    } else {
      // Aba "todos"
      result = result.filter(
        (m) => !HIDDEN_FROM_ALL.includes(m.status)
      )
    }

    // Sexo
    if (gender) {
      result = result.filter(
        (m) => m.gender === gender
      )
    }

    // Congregação atual
    if (congregation) {
      result = result.filter(
        (m) => m.congregation === congregation
      )
    }

    // Estado
    if (status) {
      result = result.filter(
        (m) => m.status === status
      )
    }

    // Pesquisa
    if (search.trim()) {
      const q = search.trim().toLowerCase()

      result = result.filter((m) => {
        const name = m.name?.toLowerCase() ?? ''
        const email = m.email?.toLowerCase() ?? ''
        const phone = m.phone ?? ''
        const churchNumber =
          m.churchNumber?.toLowerCase() ?? ''

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          churchNumber.includes(q)
        )
      })
    }

    return result
  })

  /**
   * Verifica se um número de membro já pertence a outro membro.
   */
  function churchNumberHolder(
    churchNumber: string,
    exceptId?: string
  ): Member | undefined {
    const key = churchNumberKey(churchNumber)

    if (!key) return undefined

    return members.value.find(
      (m) =>
        m.id !== exceptId &&
        churchNumberKey(
          m.churchNumber ?? ''
        ) === key
    )
  }

  // ─────────────────────────────────────────────
  // Estatísticas
  // ─────────────────────────────────────────────

  const activeCount = computed(
    () =>
      members.value.filter(
        (m) => m.status === 'Active'
      ).length
  )

  const sisterCount = computed(
    () =>
      members.value.filter(
        (m) => m.gender === 'Female'
      ).length
  )

  const brotherCount = computed(
    () =>
      members.value.filter(
        (m) => m.gender === 'Male'
      ).length
  )

  const weakCount = computed(
    () =>
      members.value.filter(
        (m) =>
          m.status === 'Weak' ||
          m.status === 'Distant' ||
          m.status === 'Withdrawal'
      ).length
  )

  /**
   * Jovens: 13–35 anos.
   */
  const youthMembers = computed(() => {
    const now = new Date()

    return members.value.filter(
      (m) => isYouth(m, now)
    )
  })

  const youthActiveCount = computed(
    () =>
      youthMembers.value.filter(
        (m) => m.status === 'Active'
      ).length
  )

  const youthGirlsCount = computed(
    () =>
      youthMembers.value.filter(
        (m) => m.gender === 'Female'
      ).length
  )

  const youthBoysCount = computed(
    () =>
      youthMembers.value.filter(
        (m) => m.gender === 'Male'
      ).length
  )

  // ─────────────────────────────────────────────
  // Número de membro
  // ─────────────────────────────────────────────

  function withNormalisedNumber<
    T extends { churchNumber?: string }
  >(input: T): T {
    if (!('churchNumber' in input)) {
      return input
    }

    return {
      ...input,
      churchNumber: normaliseChurchNumber(
        input.churchNumber ?? ''
      ),
    }
  }

  // ─────────────────────────────────────────────
  // Tratamento de erros
  // ─────────────────────────────────────────────

  function fail(
    e: unknown,
    fallback: string
  ): never {
    error.value =
      e instanceof Error
        ? e.message
        : fallback

    useToast().error(error.value)

    throw e
  }

  // ─────────────────────────────────────────────
  // Carregar membros
  // ─────────────────────────────────────────────

  async function load(force = false) {
    if (loaded.value && !force) return

    const repo = useMembersRepository()

    loading.value = true
    error.value = null

    try {
      members.value =
        await repo.fetchMembers()

      loaded.value = true
    } catch (e: unknown) {
      error.value =
        e instanceof Error
          ? e.message
          : 'Erro ao carregar os membros'

      useToast().error(error.value)
    } finally {
      loading.value = false
    }
  }

  // ─────────────────────────────────────────────
  // Criar membro
  // ─────────────────────────────────────────────

  async function addMember(
    member: Omit<Member, 'id'>
  ): Promise<Member> {
    const repo = useMembersRepository()

    member =
      withNormalisedNumber(member)

    saving.value = true
    error.value = null

    try {
      const created =
        await repo.createMember(member)

      members.value.push(created)

      recordAudit({
        action: 'member.create',
        targetId: created.id,
        targetLabel: created.name,
      })

      useToast().success(
        `${created.name || 'Membro'} adicionado com sucesso`
      )

      return created
    } catch (e: unknown) {
      fail(
        e,
        'Erro ao adicionar o membro'
      )
    } finally {
      saving.value = false
    }
  }

  // ─────────────────────────────────────────────
  // Atualizar membro
  // ─────────────────────────────────────────────

  async function updateMember(
    id: string,
    updates: Partial<Member>
  ) {
    const idx =
      members.value.findIndex(
        (m) => m.id === id
      )

    if (idx === -1) return

    const repo = useMembersRepository()

    updates =
      withNormalisedNumber(updates)

    saving.value = true
    error.value = null

    try {
      await repo.updateMember(
        id,
        updates
      )

      members.value[idx] = {
        ...members.value[idx],
        ...updates,
      } as Member

      recordAudit({
        action: 'member.update',
        targetId: id,
        targetLabel:
          members.value[idx]!.name,
      })

      useToast().success(
        `${members.value[idx]!.name} atualizado com sucesso`
      )
    } catch (e: unknown) {
      fail(
        e,
        'Erro ao atualizar o membro'
      )
    } finally {
      saving.value = false
    }
  }

  // ─────────────────────────────────────────────
  // Sincronização automática de presença
  // ─────────────────────────────────────────────

  async function syncAttendanceStatuses(
    records: AttendanceRecord[]
  ): Promise<StatusUpdate[]> {
    const updates =
      statusUpdatesForRoll(
        members.value,
        records
      )

    if (!updates.length) return []

    const repo = useMembersRepository()

    const applied: StatusUpdate[] = []

    for (const update of updates) {
      try {
        await repo.updateMember(
          update.id,
          {
            status: update.to,
          }
        )

        const idx =
          members.value.findIndex(
            (m) =>
              m.id === update.id
          )

        if (idx !== -1) {
          members.value[idx] = {
            ...members.value[idx],
            status: update.to,
          } as Member
        }

        applied.push(update)

        recordAudit({
          action: 'member.autoStatus',
          targetId: update.id,
          targetLabel:
            `${update.name}: ${update.from} → ${update.to}`,
        })
      } catch {
        // Se um membro falhar, continua com os restantes.
      }
    }

    if (applied.length) {
      useToast().info(
        summariseStatusUpdates(
          applied
        )
      )
    }

    return applied
  }

  // ─────────────────────────────────────────────
  // Eliminar membro
  // ─────────────────────────────────────────────

  async function deleteMember(
    id: string
  ) {
    const member =
      members.value.find(
        (m) => m.id === id
      )

    const name = member?.name

    const repo =
      useMembersRepository()

    saving.value = true
    error.value = null

    try {
      await repo.deleteMember(id)

      members.value =
        members.value.filter(
          (m) => m.id !== id
        )

      recordAudit({
        action: 'member.delete',
        targetId: id,
        targetLabel: name,
      })

      if (name) {
        useToast().success(
          `${name} eliminado com sucesso`
        )
      }
    } catch (e: unknown) {
      fail(
        e,
        'Erro ao eliminar o membro'
      )
    } finally {
      saving.value = false
    }
  }

  // ─────────────────────────────────────────────
  // Filtros
  // ─────────────────────────────────────────────

  function setFilter(
    partial: Partial<MemberFilters>
  ) {
    filters.value = {
      ...filters.value,
      ...partial,
    }
  }

  return {
    members,

    loading,
    saving,
    error,
    loaded,

    filters,
    filteredMembers,

    churchNumberHolder,

    activeCount,
    sisterCount,
    brotherCount,
    weakCount,

    youthMembers,
    youthActiveCount,
    youthGirlsCount,
    youthBoysCount,

    load,
    addMember,
    updateMember,
    syncAttendanceStatuses,
    deleteMember,
    setFilter,
  }
})