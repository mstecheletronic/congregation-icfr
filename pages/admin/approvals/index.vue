<script setup lang="ts">
import type { Member } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Aprovações — ICFR Família Redimida',
})

const { setHeader } = usePageHeader()
const membersStore = useMembersStore()
const toast = useToast()

const busyId = ref('')

const selectedMember = ref<Member | null>(null)
const detailOpen = ref(false)

function viewRegistration(member: Member) {
  selectedMember.value = member
  detailOpen.value = true
}

onMounted(async () => {
  setHeader('Aprovações', 'Cadastros aguardando aprovação na ICFR Família Redimida')

  if (!membersStore.members.length) {
    await membersStore.load()
  }
})

const pendingMembers = computed(() =>
  membersStore.members.filter((member) => member.status === 'Pending')
)

async function approve(member: Member) {
  busyId.value = member.id

  try {
    await membersStore.updateMember(member.id, {
      status: 'Active',
    })

    toast.success(`${member.name} foi aprovado como membro ativo.`)
  } catch {
    toast.error('Não foi possível aprovar este cadastro.')
  } finally {
    busyId.value = ''
  }
}

async function reject(member: Member) {
  const confirmed = window.confirm(`Rejeitar o cadastro de ${member.name}?`)

  if (!confirmed) return

  busyId.value = member.id

  try {
    await membersStore.updateMember(member.id, {
      status: 'Inactive',
    })

    toast.success(`Cadastro de ${member.name} rejeitado.`)
  } catch {
    toast.error('Não foi possível rejeitar este cadastro.')
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Cadastros Pendentes</h2>

          <p class="mt-1 text-sm text-gray-500">
            Analise os novos cadastros antes de ativá-los como membros.
          </p>
        </div>

        <div class="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          {{ pendingMembers.length }} aguardando
        </div>
      </div>
    </div>

    <div
      v-if="!pendingMembers.length"
      class="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"
    >
      <Icon icon="mdi:account-check-outline" class="mx-auto mb-3 text-4xl text-gray-300" />

      <h3 class="font-semibold text-gray-800">Nenhum cadastro aguardando aprovação</h3>

      <p class="mt-1 text-sm text-gray-500">Novos cadastros públicos aparecerão aqui.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="member in pendingMembers"
        :key="member.id"
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <img
            v-if="member.avatar"
            :src="member.avatar"
            :alt="member.name"
            class="h-12 w-12 rounded-full object-cover"
          />

          <div
            v-else
            class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"
          >
            <Icon icon="mdi:account-outline" class="text-2xl" />
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="truncate font-bold text-gray-900">
              {{ member.name }}
            </h3>

            <p class="text-sm text-gray-500">
              {{ member.phone }}
            </p>
          </div>
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Email</span>
            <span class="truncate font-medium text-gray-800">
              {{ member.email || '—' }}
            </span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Congregação</span>
            <span class="font-medium text-gray-800">
              {{ member.congregation || '—' }}
            </span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Estado</span>
            <span class="font-semibold text-amber-600"> Aguardando </span>
          </div>
        </div>

        <div class="mt-5 space-y-2">
          <button
            type="button"
            class="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            @click="viewRegistration(member)"
          >
            Ver cadastro completo
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              :disabled="busyId === member.id"
              @click="reject(member)"
            >
              Rejeitar
            </button>

            <button
              type="button"
              class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              :disabled="busyId === member.id"
              @click="approve(member)"
            >
              Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>
    <MemberDetailPanel v-model="detailOpen" :member="selectedMember" />
  </div>
</template>
