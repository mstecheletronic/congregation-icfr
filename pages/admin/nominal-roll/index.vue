<script setup lang="ts">
import type { Member } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['auth'] })
useSeoMeta({ title: 'Membros — ICFR Família Redimida', description: 'Gestão dos membros da ICFR Família Redimida.' })

const { setHeader } = usePageHeader()
const membersStore = useMembersStore()

onMounted(() => {
  setHeader('Membros da ICFR Família Redimida', 'Resumo e gestão dos membros de todas as congregações da ICFR')
})

const showAddModal = ref(false)
const panelOpen = ref(false)
const panelAutoEdit = ref(false)
const selectedMember = ref<Member | null>(null)

function openPanel(member: Member) {
  panelAutoEdit.value = false
  selectedMember.value = member
  panelOpen.value = true
}

function openPanelEdit(member: Member) {
  selectedMember.value = member
  panelAutoEdit.value = true
  panelOpen.value = true
}

async function onMemberSaved(member: Omit<Member, 'id' | 'absenceCount'>) {
  await membersStore.addMember({ ...member, absenceCount: 0 }).catch(() => {})
}

// "Last year" baseline: count members who had joined on or before Dec 31 of the
// previous year. This isn't a true historical snapshot of status (we don't keep
// that), but it gives a useful trend signal off the dateJoined column.
const lastYearCutoff = `${new Date().getFullYear() - 1}-12-31`
const memberJoinedByLastYear = (m: { dateJoined?: string }) =>
  !!m.dateJoined && m.dateJoined <= lastYearCutoff

const lastYear = computed(() => {
  const ms = membersStore.members.filter(memberJoinedByLastYear)
  return {
    active: ms.filter((m) => m.status === 'Active').length,
    sisters: ms.filter((m) => m.gender === 'Female').length,
    brothers: ms.filter((m) => m.gender === 'Male').length,
    weak: ms.filter(
      (m) => m.status === 'Weak' || m.status === 'Distant' || m.status === 'Withdrawal'
    ).length,
  }
})

function pctChange(current: number, prior: number): number {
  if (!prior) return 0
  return Math.round(((current - prior) / prior) * 100)
}

const statCards = computed(() => [
  {
    label: 'Membros Ativos',
    value: membersStore.activeCount,
    priorValue: lastYear.value.active,
    change: pctChange(membersStore.activeCount, lastYear.value.active),
    tab: 'active' as const,
  },
  {
    label: 'Irmãs',
    value: membersStore.sisterCount,
    priorValue: lastYear.value.sisters,
    change: pctChange(membersStore.sisterCount, lastYear.value.sisters),
    tab: 'sisters' as const,
  },
  {
    label: 'Irmãos',
    value: membersStore.brotherCount,
    priorValue: lastYear.value.brothers,
    change: pctChange(membersStore.brotherCount, lastYear.value.brothers),
    tab: 'brothers' as const,
  },
  {
    label: 'Membros em Acompanhamento',
    value: membersStore.weakCount,
    priorValue: lastYear.value.weak,
    change: pctChange(membersStore.weakCount, lastYear.value.weak),
    tab: 'inactive' as const,
  },
])

const tableRef = ref<HTMLElement | null>(null)

function viewList(tab: 'active' | 'sisters' | 'brothers' | 'inactive') {
  membersStore.setFilter({ tab })
  nextTick(() => {
    tableRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const congregationCards = computed(() => {
  const names = [
    'Muchatazina Sede',
    'Cerâmica',
    'Crespim',
    'Chimoio',
    'Tete',
  ]

  return names.map((name) => ({
    name,
    count: membersStore.members.filter(
      (m) => m.congregation === name
    ).length,
  }))
})

function viewCongregation(congregation: string) {
  membersStore.setFilter({
    congregation,
    tab: 'all',
  })

  nextTick(() => {
    tableRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Adicionar Membro CTA lives in the admin topbar via teleport, alongside
         the page title rendered by the layout. -->
    <!-- `defer`: the admin layout is a separately async-loaded chunk, so its header (and this
         teleport's target) is not guaranteed to exist before this page's own chunk mounts.
         Without `defer`, that race intermittently throws "Failed to locate Teleport target". -->
    <Teleport defer to="#admin-header-actions">
      <Button @click="showAddModal = true">
        Adicionar Membro
        <template #icon-right><Icon icon="mdi:plus" /></template>
      </Button>
    </Teleport>

    <!-- Stats row + Donut chart -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card v-for="card in statCards" :key="card.label">
          <div class="flex flex-col gap-2">
            <!-- Top: title + trend badge -->
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm text-gray-600">{{ card.label }}</p>
              <span
                :class="[
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                  card.change > 0 && 'bg-green-50 text-green-600',
                  card.change < 0 && 'bg-red-50 text-red-600',
                  card.change === 0 && 'bg-gray-50 text-gray-500',
                ]"
              >
                <Icon
                  :icon="
                    card.change > 0
                      ? 'mdi:trending-up'
                      : card.change < 0
                        ? 'mdi:trending-down'
                        : 'mdi:minus'
                  "
                  class="text-[12px]"
                />
                {{ Math.abs(card.change) }}%
              </span>
            </div>

            <!-- Big number -->
            <p class="text-3xl font-bold text-gray-900">{{ card.value }}</p>

            <!-- Footer: no ano passado + view list -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">{{ card.priorValue }} no ano passado</span>
              <button
                class="font-medium text-gray-700 hover:text-blue-600 cursor-pointer"
                @click="viewList(card.tab)"
              >
                Ver Lista
              </button>
            </div>
          </div>
        </Card>
      </div>
      <RoleSummaryChart />
    </div>

    <!-- Congregações -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-base font-bold text-gray-900">
            Membros por Congregação
          </h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Distribuição atual dos membros da ICFR Família Redimida
          </p>
        </div>

        <button
          class="text-xs font-medium text-blue-600 hover:text-blue-700"
          @click="membersStore.setFilter({ congregation: '' })"
        >
          Ver todas
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <button
          v-for="congregation in congregationCards"
          :key="congregation.name"
          type="button"
          class="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          @click="viewCongregation(congregation.name)"
        >
          <div class="flex items-center justify-between gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
              <Icon icon="mdi:church-outline" class="text-xl" />
            </div>

            <span class="text-2xl font-bold text-gray-900">
              {{ congregation.count }}
            </span>
          </div>

          <p class="mt-3 text-sm font-semibold text-gray-800">
            {{ congregation.name }}
          </p>

          <p class="mt-1 text-xs text-gray-400">
            {{ congregation.count === 1 ? '1 membro' : `${congregation.count} membros` }}
          </p>
        </button>
      </div>
    </section>

    <!-- Filtros -->
    <div ref="tableRef">
      <MemberFilters />
    </div>

    <!-- Table -->
    <MemberTable @select="openPanel" @edit="openPanelEdit" />

    <!-- Member detail panel -->
    <MemberDetailPanel v-model="panelOpen" :member="selectedMember" :auto-edit="panelAutoEdit" />

    <AddMemberModal v-model="showAddModal" title="Adicionar Novo Membro" @save="onMemberSaved" />
  </div>
</template>
