<script setup lang="ts">
import type { Member } from '~/types'
import type { ChartData } from 'chart.js'

import { MEMBER_STATUSES } from '~/constants'
definePageMeta({ layout: 'admin', middleware: ['auth'] })
useSeoMeta({
  title: 'Jovens — ICFR Família Redimida',
  description: 'Gestão dos jovens da ICFR Família Redimida.',
})

const { setHeader } = usePageHeader()
const membersStore = useMembersStore()
const { exportCSV } = useExportCSV()

onMounted(() => {
  setHeader('Jovens', 'Gestão dos jovens com idades entre 13 e 35 anos')
})

// ─── Local filter state (independent from nominal-roll store filters) ────────
const search = ref('')
const activeTab = ref<'all' | 'boys' | 'girls' | 'active' | 'inactive'>('all')

const tabs = [
  { label: 'Todos os Jovens', value: 'all' },
  { label: 'Rapazes', value: 'boys' },
  { label: 'Raparigas', value: 'girls' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
]

// ─── Youth computed list ─────────────────────────────────────────────────────
const filteredYouth = computed(() => {
  let result = [...membersStore.youthMembers]

  if (activeTab.value === 'boys') result = result.filter((m) => m.gender === 'Male')
  else if (activeTab.value === 'girls') result = result.filter((m) => m.gender === 'Female')
  else if (activeTab.value === 'active') result = result.filter((m) => m.status === 'Active')
  else if (activeTab.value === 'inactive') result = result.filter((m) => m.status !== 'Active')

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q)
    )
  }

  return result
})

// ─── Stats cards ─────────────────────────────────────────────────────────────
const statCards = computed(() => [
  {
    label: 'Total de Jovens',
    value: membersStore.youthMembers.length,
    subtitle: 'Idades entre 13 e 35 anos',
    tab: 'all' as const,
  },
  {
    label: 'Raparigas',
    value: membersStore.youthGirlsCount,
    subtitle: `${membersStore.youthMembers.length - membersStore.youthGirlsCount} rapazes`,
    tab: 'girls' as const,
  },
  {
    label: 'Rapazes',
    value: membersStore.youthBoysCount,
    subtitle: `${membersStore.youthMembers.length - membersStore.youthBoysCount} raparigas`,
    tab: 'boys' as const,
  },
  {
    label: 'Jovens Ativos',
    value: membersStore.youthActiveCount,
    subtitle: `${membersStore.youthMembers.length - membersStore.youthActiveCount} inativos`,
    tab: 'active' as const,
  },
])

const tableRef = ref<HTMLElement | null>(null)

function viewList(tab: 'all' | 'boys' | 'girls' | 'active' | 'inactive') {
  activeTab.value = tab
  nextTick(() => {
    tableRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ─── Donut chart ─────────────────────────────────────────────────────────────
/**
 * Driven by `MEMBER_STATUSES` rather than a hand-written list: this chart previously named five
 * of the eight statuses, so any youth marked Disfellowshipped, Transfer or Late vanished from it.
 *
 * Plots counts, not percentages. Chart.js works out the arcs, tooltips then show real numbers,
 * and rounding each slice to a whole percent no longer makes them fail to add up to 100.
 */
const STATUS_LABELS: Record<string, string> = {
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

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Active: '#3b82f6',
  Inactive: '#94a3b8',
  Backslider: '#f59e0b',
  Weak: '#22c55e',
  Distant: '#6366f1',
  Withdrawal: '#ef4444',
  Disfellowshipped: '#dc2626',
  Transfer: '#0ea5e9',
  Late: '#a855f7',
}

/**
 * Youth membership is derived from date of birth, so a roll with no birthdays recorded looks
 * identical to one with no youth. Say which it is — "no youth members" sends someone hunting for
 * a bug when the answer is a missing field.
 */
const emptyYouthReason = computed(() => {
  const withDob = membersStore.members.filter((m) => m.dob).length
  if (!membersStore.members.length) return 'Ainda não existem membros cadastrados.'
  if (!withDob)
    return 'Ainda não existem datas de nascimento registadas para identificar jovens entre 13 e 35 anos.'
  return 'Não existem membros com idade entre 13 e 35 anos.'
})

const youthByStatus = computed(() =>
  MEMBER_STATUSES.map((status) => ({
    status,
    count: membersStore.youthMembers.filter((m) => m.status === status).length,
  })).filter((entry) => entry.count > 0)
)

const donutData = computed<ChartData<'doughnut'>>(() => {
  const entries = youthByStatus.value
  return {
    labels: entries.map((e) => STATUS_LABELS[e.status] ?? e.status),
    datasets: [
      {
        data: entries.map((e) => e.count),
        backgroundColor: entries.map((e) => STATUS_COLORS[e.status] ?? '#94a3b8'),
        borderWidth: 0,
      },
    ],
  }
})

// ─── Panel ───────────────────────────────────────────────────────────────────
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

// ─── Add modal ───────────────────────────────────────────────────────────────
const showAddModal = ref(false)

async function onMemberSaved(member: Omit<Member, 'id' | 'absenceCount'>) {
  await membersStore.addMember({ ...member, absenceCount: 0 }).catch(() => {})
}

// ─── Export ──────────────────────────────────────────────────────────────────
function doExport() {
  exportCSV(
    filteredYouth.value.map((m) => ({
      Nome: m.name,
      Sexo: m.gender === 'Male' ? 'Masculino' : 'Feminino',
      Telefone: m.phone,
      Email: m.email,
      'Data de Nascimento': m.dob ?? '',
      Estado: m.status,
      Escola: m.school ?? '',
      Departamento: m.department ?? '',
      Curso: m.courseOfStudy ?? '',
      Programa: m.program ?? '',
      Nível: m.level ?? '',
      Residência: m.hallOfResidence ?? '',
      'Ano de Entrada': m.yearOfEntry ?? '',
      'Ano de Saída': m.yearOfExit ?? '',
      Comentário: m.comment ?? '',
    })),
    'jovens-icfr'
  )
}

const showImport = ref(false)

async function onImport(members: Omit<Member, 'id' | 'absenceCount'>[]) {
  // Sequential so a mid-import failure stops rather than firing off dozens of
  // half-finished writes.
  for (const m of members) {
    await membersStore.addMember({ ...m, absenceCount: 0 }).catch(() => {})
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div></div>
      <Button @click="showAddModal = true">
        <template #icon-left><Icon icon="mdi:plus" /></template>
        Adicionar Jovem
      </Button>
    </div>

    <!-- Stats + Chart row -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Stats 2×2 grid -->
      <div class="xl:col-span-2 grid grid-cols-2 gap-4">
        <Card v-for="card in statCards" :key="card.label">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 font-medium">{{ card.label }}</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ card.value }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ card.subtitle }}</p>
            </div>
          </div>
          <button
            class="mt-3 text-xs text-blue-600 hover:underline cursor-pointer"
            @click="viewList(card.tab)"
          >
            Ver Lista
          </button>
        </Card>
      </div>

      <!-- Donut chart -->
      <div class="bg-slate-800 rounded-xl p-4 flex flex-col">
        <h3 class="text-sm font-semibold text-white mb-3">Resumo dos Jovens</h3>
        <DonutChart v-if="youthByStatus.length" :data="donutData" :height="180" />
        <p v-else class="py-10 text-center text-xs leading-relaxed text-slate-400">
          {{ emptyYouthReason }}
        </p>
      </div>
    </div>

    <!-- Filter bar -->
    <div ref="tableRef" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Tabs v-model="activeTab" :tabs="tabs" />
      <div class="flex gap-2 shrink-0">
        <Button variant="secondary" size="sm" @click="doExport">
          <template #icon-left><Icon icon="mdi:upload-outline" /></template>
          Exportar CSV
        </Button>
        <Button variant="secondary" size="sm" @click="showImport = true">
          <template #icon-left><Icon icon="mdi:download-outline" /></template>
          Importar CSV
        </Button>
      </div>
    </div>

    <!-- Search -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Icon
          icon="mdi:magnify"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Pesquisar jovens..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          aria-label="Pesquisar jovens"
        />
      </div>
      <Button variant="secondary" size="sm">
        <template #icon-left><Icon icon="mdi:filter-outline" /></template>
        Filter
      </Button>
    </div>

    <!-- With no youth at all, show only the page-level empty state — the table
         renders its own "no members found" row and the two would stack. -->
    <Card v-if="!membersStore.youthMembers.length">
      <EmptyState
        icon="mdi:account-star-outline"
        title="Ainda não existem jovens cadastrados"
        description="Os membros com idade entre 13 e 35 anos aparecem aqui automaticamente quando a data de nascimento está registada."
      >
        <template #action>
          <Button @click="showAddModal = true">
            <template #icon-left><Icon icon="mdi:plus" /></template>
            Adicionar Jovem
          </Button>
        </template>
      </EmptyState>
    </Card>

    <!-- Table — passes filtered youth as items prop -->
    <MemberTable v-else :items="filteredYouth" @select="openPanel" @edit="openPanelEdit" />

    <!-- Detail panel -->
    <MemberDetailPanel v-model="panelOpen" :member="selectedMember" :auto-edit="panelAutoEdit" />

    <AddMemberModal
      v-model="showAddModal"
      title="Adicionar Jovem"
      :youth-mode="true"
      @save="onMemberSaved"
    />

    <ImportCsvModal v-model="showImport" @import="onImport" />
  </div>
</template>
