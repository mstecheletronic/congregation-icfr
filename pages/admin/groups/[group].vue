<script setup lang="ts">
import type { Member } from '~/types'
import { ICFR_CHURCH_GROUPS, ICFR_CHURCH_POSITIONS } from '~/constants'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

const route = useRoute()
const { setHeader } = usePageHeader()
const membersStore = useMembersStore()
const toast = useToast()

function groupSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const groupName = computed(() => {
  const slug = String(route.params.group ?? '')

  return ICFR_CHURCH_GROUPS.find((name) => groupSlug(name) === slug) ?? ''
})

const validGroup = computed(() => Boolean(groupName.value))

const groupMembers = computed(() =>
  membersStore.members.filter(
    (member) => member.status !== 'Pending' && member.churchGroups?.includes(groupName.value)
  )
)

const availableMembers = computed(() =>
  membersStore.members
    .filter(
      (member) => member.status === 'Active' && !member.churchGroups?.includes(groupName.value)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
)

const addMemberId = ref('')
const addPosition = ref('Membro')
const saving = ref(false)

const selectedMember = ref<Member | null>(null)
const panelOpen = ref(false)

function openMember(member: Member) {
  selectedMember.value = member
  panelOpen.value = true
}

async function addMemberToGroup() {
  if (!addMemberId.value || !groupName.value) {
    toast.error('Selecione um membro.')
    return
  }

  const member = membersStore.members.find((m) => m.id === addMemberId.value)

  if (!member) return

  saving.value = true

  try {
    const groups = Array.from(new Set([...(member.churchGroups ?? []), groupName.value]))

    await membersStore.updateMember(member.id, {
      churchGroups: groups,
      churchPosition: addPosition.value,
    })

    toast.success(`${member.name} foi adicionado a ${groupName.value}.`)

    addMemberId.value = ''
    addPosition.value = 'Membro'
  } catch {
    toast.error('Não foi possível adicionar o membro.')
  } finally {
    saving.value = false
  }
}

async function removeMemberFromGroup(member: Member) {
  if (!groupName.value) return

  const confirmed = window.confirm(`Remover ${member.name} de ${groupName.value}?`)

  if (!confirmed) return

  saving.value = true

  try {
    const groups = (member.churchGroups ?? []).filter((group) => group !== groupName.value)

    await membersStore.updateMember(member.id, {
      churchGroups: groups,
    })

    toast.success(`${member.name} foi removido do grupo.`)
  } catch {
    toast.error('Não foi possível remover o membro.')
  } finally {
    saving.value = false
  }
}

const statusLabels: Record<string, string> = {
  Pending: 'Aguardando',
  Active: 'Ativo',
  Inactive: 'Inativo',
  Backslider: 'Desviado',
  Weak: 'Em Acompanhamento',
  Distant: 'Distante',
  Withdrawal: 'Afastamento',
  Disfellowshipped: 'Desligado',
  Transfer: 'Transferido',
  Late: 'Afastado',
}

onMounted(async () => {
  await membersStore.load()

  setHeader(
    groupName.value || 'Departamento / Grupo',
    groupName.value
      ? `Gestão dos membros de ${groupName.value}`
      : 'Departamento ou grupo não encontrado'
  )
})

useSeoMeta({
  title: () =>
    groupName.value
      ? `${groupName.value} — ICFR Família Redimida`
      : 'Grupo — ICFR Família Redimida',
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="!validGroup" class="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h2 class="font-bold text-red-700">Grupo não encontrado</h2>

      <NuxtLink
        to="/admin/groups"
        class="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Voltar para Departamentos e Grupos
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Resumo -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p class="text-xs font-medium text-gray-500">Total de membros</p>
          <p class="mt-1 text-3xl font-bold text-gray-900">
            {{ groupMembers.length }}
          </p>
        </Card>

        <Card>
          <p class="text-xs font-medium text-gray-500">Membros ativos</p>
          <p class="mt-1 text-3xl font-bold text-gray-900">
            {{ groupMembers.filter((member) => member.status === 'Active').length }}
          </p>
        </Card>

        <Card>
          <p class="text-xs font-medium text-gray-500">Congregações representadas</p>
          <p class="mt-1 text-3xl font-bold text-gray-900">
            {{ new Set(groupMembers.map((member) => member.congregation).filter(Boolean)).size }}
          </p>
        </Card>
      </div>

      <!-- Adicionar membro -->
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4">
          <h2 class="font-bold text-gray-900">Adicionar membro</h2>
          <p class="mt-1 text-sm text-gray-500">Associe um membro ativo a {{ groupName }}.</p>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px_auto]">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"> Membro </label>

            <select
              v-model="addMemberId"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">— Selecionar membro —</option>

              <option v-for="member in availableMembers" :key="member.id" :value="member.id">
                {{ member.name }}
                {{ member.congregation ? `— ${member.congregation}` : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Cargo / Função principal
            </label>

            <select
              v-model="addPosition"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option v-for="position in ICFR_CHURCH_POSITIONS" :key="position" :value="position">
                {{ position }}
              </option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              type="button"
              class="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!addMemberId || saving"
              @click="addMemberToGroup"
            >
              <span v-if="saving">A guardar...</span>
              <span v-else>Adicionar ao grupo</span>
            </button>
          </div>
        </div>

        <p v-if="!availableMembers.length" class="mt-3 text-xs text-gray-400">
          Todos os membros ativos disponíveis já pertencem a este grupo.
        </p>
      </div>

      <!-- Sem membros -->
      <div
        v-if="!groupMembers.length"
        class="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"
      >
        <Icon icon="mdi:account-group-outline" class="mx-auto mb-3 text-4xl text-gray-300" />

        <h3 class="font-semibold text-gray-800">Ainda não existem membros neste grupo</h3>

        <p class="mt-1 text-sm text-gray-500">
          Use o formulário acima para adicionar o primeiro membro.
        </p>
      </div>

      <!-- Tabela -->
      <div v-else class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-5 py-4">
          <h2 class="font-bold text-gray-900">Membros de {{ groupName }}</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="text-left text-xs font-semibold text-gray-500">
                <th class="px-4 py-3">Membro</th>
                <th class="px-4 py-3">Congregação</th>
                <th class="px-4 py-3">Cargo / Função</th>
                <th class="px-4 py-3">Telefone</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              <tr v-for="member in groupMembers" :key="member.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="member.avatar"
                      :src="member.avatar"
                      :alt="member.name"
                      class="h-9 w-9 rounded-full object-cover"
                    />

                    <div
                      v-else
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"
                    >
                      <Icon icon="mdi:account-outline" />
                    </div>

                    <span class="font-semibold text-gray-900">
                      {{ member.name }}
                    </span>
                  </div>
                </td>

                <td class="px-4 py-3 text-gray-600">
                  {{ member.congregation || '—' }}
                </td>

                <td class="px-4 py-3 text-gray-600">
                  {{ member.churchPosition || 'Membro' }}
                </td>

                <td class="px-4 py-3 text-gray-600">
                  {{ member.phone || '—' }}
                </td>

                <td class="px-4 py-3">
                  <Badge :variant="member.status === 'Active' ? 'success' : 'neutral'">
                    {{ statusLabels[member.status] ?? member.status }}
                  </Badge>
                </td>

                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="font-medium text-blue-600 hover:underline"
                      @click="openMember(member)"
                    >
                      Ver
                    </button>

                    <button
                      type="button"
                      class="font-medium text-red-500 hover:underline"
                      :disabled="saving"
                      @click="removeMemberFromGroup(member)"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <MemberDetailPanel v-model="panelOpen" :member="selectedMember" />

      <!-- Chat do grupo -->
      <GroupChat v-if="validGroup" :group-name="groupName" />
    </template>
  </div>
</template>
