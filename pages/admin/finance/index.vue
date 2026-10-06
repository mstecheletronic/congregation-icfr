<script setup lang="ts">
import type { ChartData } from 'chart.js'
import type { FinanceCollection, FinanceExpense, ExpenseCategory } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['auth'] })
useSeoMeta({ title: 'Finanças — ICFR Família Redimida', description: 'Gestão financeira da ICFR Família Redimida.' })

const { setHeader } = usePageHeader()
const financeStore = useFinanceStore()
const settingsStore = useChurchSettingsStore()
const { exportCSV } = useExportCSV()
const { download: downloadFinancePdf } = useFinancePdf()
const toast = useToast()

onMounted(() => {
  setHeader('Finanças e Tesouraria', 'Gestão de dízimos, ofertas, contribuições, despesas e relatórios financeiros')
  financeStore.load()
})

// ─── Active report period ─────────────────────────────────────────────────────
const activePeriod = ref<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
const periodTabs = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
]

// ─── Chart data (income vs expenses by period) ────────────────────────────────
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function labelFor(key: string, period: string) {
  if (period === 'monthly') {
    const [, m] = key.split('-')
    return MONTH_NAMES[parseInt(m ?? '1', 10) - 1] ?? key
  }
  if (period === 'weekly') return key.replace(/^\d{4}-/, '')
  return key
}

const chartData = computed<ChartData<'bar'>>(() => {
  let labels: string[]
  let incMap: Record<string, number>
  let expMap: Record<string, number>

  if (activePeriod.value === 'weekly') {
    labels = financeStore.last8WeeksLabels
    incMap = financeStore.weeklyIncomeMap
    expMap = financeStore.weeklyExpenseMap
  } else if (activePeriod.value === 'monthly') {
    labels = financeStore.last12MonthsLabels
    incMap = financeStore.monthlyIncomeMap
    expMap = financeStore.monthlyExpenseMap
  } else if (activePeriod.value === 'quarterly') {
    labels = financeStore.last8QuartersLabels
    incMap = financeStore.quarterlyIncomeMap
    expMap = financeStore.quarterlyExpenseMap
  } else {
    labels = financeStore.last4YearsLabels
    incMap = financeStore.yearlyIncomeMap
    expMap = financeStore.yearlyExpenseMap
  }

  return {
    labels: labels.map((l) => labelFor(l, activePeriod.value)),
    datasets: [
      {
        label: 'Entrada',
        data: labels.map((l) => incMap[l] ?? 0),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
      {
        label: 'Despesas',
        data: labels.map((l) => expMap[l] ?? 0),
        backgroundColor: '#f87171',
        borderRadius: 6,
      },
    ],
  }
})

// ─── Donut chart (expenses by category this month) ───────────────────────────
const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  Building: 'Construção',
  Evangelism: 'Evangelismo',
  Welfare: 'Assistência Social',
  Technical: 'Técnica',
  Youth: 'Jovens',
  Preacher: 'Pregador',
  Edification: 'Edificação',
  Media: 'Mídia',
  Others: 'Outros',
}

const categoryColors: Record<ExpenseCategory, string> = {
  Building: '#3b82f6',
  Evangelism: '#a855f7',
  Welfare: '#22c55e',
  Technical: '#0ba5ec',
  Youth: '#ec4899',
  Preacher: '#f59e0b',
  Edification: '#8b5cf6',
  Media: '#14b8a6',
  Others: '#94a3b8',
}

const donutData = computed<ChartData<'doughnut'>>(() => {
  const cat = financeStore.expenseByCategory
  const entries = Object.entries(cat) as [ExpenseCategory, number][]
  return {
    labels: entries.map(([k]) => k),
    datasets: [
      {
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([k]) => categoryColors[k]),
        borderWidth: 0,
      },
    ],
  }
})

// ─── Summary table rows ───────────────────────────────────────────────────────
// `reportRows` emits one row per period in the range whether or not anything was
// recorded, so its length says nothing about whether there is data. Ask the
// underlying records instead — otherwise the report shows a wall of zeroes.
const summaryRows = computed(() => financeStore.reportRows(activePeriod.value))
const hasFinanceData = computed(
  () => financeStore.collections.length > 0 || financeStore.expenses.length > 0
)

// ─── Recent transactions (combined, sorted desc) ──────────────────────────────
const recentActivity = computed(() => {
  const cols = financeStore.collections.map((c) => ({
    id: c.id,
    date: c.date,
    type: 'income' as const,
    description: c.description ?? '',
    amount: c.amount,
    memberName: c.memberName ?? '—',
    incomeType: c.type ?? 'Other',
    congregation: c.congregation ?? '—',
    paymentMethod: c.paymentMethod ?? '—',
  }))

  const exps = financeStore.expenses.map((e) => ({
    id: e.id,
    date: e.date,
    type: 'expense' as const,
    description: `${e.category} – ${e.description}`,
    amount: e.amount,
    memberName: '—',
    incomeType: '',
    congregation: '—',
    paymentMethod: '—',
  }))
  // No slice: the table pages instead, so older entries stay reachable.
  return [...cols, ...exps].sort((a, b) => b.date.localeCompare(a.date))
})

const {
  page: txPage,
  total: txAtétal,
  totalPages: txAtétalPages,
  paginated: pagedActivity,
  rangeStart: txDe,
  rangeEnd: txAté,
} = usePagination(recentActivity, 10)

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmt(n: number) {
  return `${n.toLocaleString('pt-MZ', { minimumFractionDigits: 0 })} MT`
}

function fmtDate(d: string) {
  return formatDate(d, 'short')
}

// ─── Export modal ─────────────────────────────────────────────────────────────
const showExport = ref(false)

const today = new Date().toISOString().slice(0, 10)
const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
  .toISOString()
  .slice(0, 10)

const exportRange = reactive({ from: oneYearAgo, to: today })
const exportRangeErrors = reactive({ from: '', to: '' })

const exportPreviewEntrada = computed(() => {
  if (!exportRange.from || !exportRange.to) return 0
  return financeStore.collections.filter(
    (c) => c.date >= exportRange.from && c.date <= exportRange.to
  ).length
})

const exportPreviewDespesas = computed(() => {
  if (!exportRange.from || !exportRange.to) return 0
  return financeStore.expenses.filter((e) => e.date >= exportRange.from && e.date <= exportRange.to)
    .length
})

const exportPreviewCount = computed(() => exportPreviewEntrada.value + exportPreviewDespesas.value)

function setPreset(preset: 'week' | 'month' | 'quarter' | 'year' | '6months' | 'all') {
  const now = new Date()
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  exportRange.to = toISO(now)
  Object.assign(exportRangeErrors, { from: '', to: '' })

  if (preset === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    exportRange.from = toISO(start)
  } else if (preset === 'month') {
    exportRange.from = toISO(new Date(now.getFullYear(), now.getMonth(), 1))
  } else if (preset === 'quarter') {
    const qStart = Math.floor(now.getMonth() / 3) * 3
    exportRange.from = toISO(new Date(now.getFullYear(), qStart, 1))
  } else if (preset === 'year') {
    exportRange.from = toISO(new Date(now.getFullYear(), 0, 1))
  } else if (preset === '6months') {
    const start = new Date(now)
    start.setMonth(now.getMonth() - 6)
    exportRange.from = toISO(start)
  } else {
    // all time — find earliest record
    const all = [
      ...financeStore.collections.map((c) => c.date),
      ...financeStore.expenses.map((e) => e.date),
    ]
    exportRange.from = all.length ? all.sort()[0]! : toISO(new Date(now.getFullYear(), 0, 1))
  }
}

function doExport() {
  exportRangeErrors.from = exportRange.from ? '' : 'Start date is required'
  exportRangeErrors.to = exportRange.to ? '' : 'End date is required'
  if (exportRangeErrors.from || exportRangeErrors.to) return
  if (exportRange.from > exportRange.to) {
    exportRangeErrors.to = 'End date must be after start date'
    return
  }

  const from = exportRange.from
  const to = exportRange.to

  // Build unified rows: income first, then expenses, each sorted by date asc
  const incomeRows = financeStore.collections
    .filter((c) => c.date >= from && c.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({
      Data: c.date,
      Type: 'Entrada',
      Categoria: 'Collection',
      Descrição: c.description ?? 'Collection',
      'Valor (MT)': c.amount,
      Collector: c.collector ?? '',
    }))

  const expenseRows = financeStore.expenses
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      Data: e.date,
      Type: 'Despesa',
      Categoria: e.category,
      Descrição: e.description,
      'Valor (MT)': e.amount,
      Collector: '',
    }))

  // All rows sorted by date
  const allRows = [...incomeRows, ...expenseRows].sort((a, b) => a.Data.localeCompare(b.Data))

  // Compute running balance
  let balance = 0
  const withBalance = allRows.map((r) => {
    balance += r.Type === 'Entrada' ? r['Valor (MT)'] : -r['Valor (MT)']
    return { ...r, 'Running Balance (₦)': balance }
  })

  // Summary footer rows
  const totalIncome = incomeRows.reduce((s, r) => s + r['Valor (MT)'], 0)
  const totalExpenses = expenseRows.reduce((s, r) => s + r['Valor (MT)'], 0)

  const rows: Record<string, unknown>[] = [
    ...withBalance,
    {
      Data: '',
      Type: '',
      Categoria: '',
      Descrição: '',
      'Valor (MT)': '',
      Collector: '',
      'Running Balance (₦)': '',
    },
    {
      Data: 'SUMMARY',
      Type: '',
      Categoria: '',
      Descrição: 'Total de Entradas',
      'Valor (MT)': totalIncome,
      Collector: '',
      'Running Balance (₦)': '',
    },
    {
      Data: '',
      Type: '',
      Categoria: '',
      Descrição: 'Atétal de Despesas',
      'Valor (MT)': totalExpenses,
      Collector: '',
      'Running Balance (₦)': '',
    },
    {
      Data: '',
      Type: '',
      Categoria: '',
      Descrição: 'Saldo Atual',
      'Valor (MT)': totalIncome - totalExpenses,
      Collector: '',
      'Running Balance (₦)': '',
    },
  ]

  exportCSV(rows, `finance-report-${from}-to-${to}`)
  showExport.value = false
}

function doExportPdf() {
  exportRangeErrors.from = exportRange.from ? '' : 'Start date is required'
  exportRangeErrors.to = exportRange.to ? '' : 'End date is required'
  if (exportRangeErrors.from || exportRangeErrors.to) return
  if (exportRange.from > exportRange.to) {
    exportRangeErrors.to = 'End date must be after start date'
    return
  }

  const from = exportRange.from
  const to = exportRange.to
  const collectionsInRange = financeStore.collections.filter((c) => c.date >= from && c.date <= to)
  const expensesInRange = financeStore.expenses.filter((e) => e.date >= from && e.date <= to)

  // Carry-forward: net of all entries strictly before the start of the range.
  const priorEntrada = financeStore.collections
    .filter((c) => c.date < from)
    .reduce((s, c) => s + c.amount, 0)
  const priorDespesas = financeStore.expenses
    .filter((e) => e.date < from)
    .reduce((s, e) => s + e.amount, 0)
  const balanceBroughtForward = priorEntrada - priorDespesas

  downloadFinancePdf(
    {
      churchName: settingsStore.settings.name,
      churchLocation: settingsStore.settings.address,
      from,
      to,
      collections: collectionsInRange,
      expenses: expensesInRange,
      balanceBroughtForward,
    },
    `finance-report-${from}-to-${to}.pdf`
  )
  toast.success('Financial report exported')
  showExport.value = false
}


const incomeTypeLabels: Record<string, string> = {
  Tithe: 'Dízimo',
  Offering: 'Oferta',
  Contribution: 'Contribuição',
  'Special Offering': 'Oferta Especial',
  Other: 'Outro',
}

const paymentMethodLabels: Record<string, string> = {
  Cash: 'Dinheiro',
  'M-Pesa': 'M-Pesa',
  'E-Mola': 'E-Mola',
  Bank: 'Banco',
  Other: 'Outro',
}

// ─── Registar Entrada modal ─────────────────────────────────────────────────────
const showAddCollection = ref(false)
const newCollection = reactive<Omit<FinanceCollection, 'id'>>({
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  memberName: '',
  type: 'Tithe',
  congregation: 'Beira Sede',
  paymentMethod: 'Cash',
  description: '',
  collector: '',
})

const collectionErrors = reactive({
  date: '',
  amount: '',
  memberName: '',
  congregation: '',
})

const { isPending, run } = usePendingAction()

const { confirm } = useConfirm()

async function removeEntry(tx: {
  id: string
  type: string
  description?: string
  amount?: number
}) {
  const kind = tx.type === 'income' ? 'collection' : 'expense'
  const ok = await confirm({
    title: `Delete this ${kind}?`,
    // Names the amount as well as the description: these are the books, and deleting the wrong
    // line is the kind of mistake that only shows up when the figures stop reconciling.
    message: [
      tx.description,
      typeof tx.amount === 'number' ? `₦${tx.amount.toLocaleString('pt-MZ')}` : null,
    ]
      .filter(Boolean)
      .join(' — ')
      .concat('. This cannot be undone.'),
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await run(tx.id, () =>
    (tx.type === 'income'
      ? financeStore.deleteCollection(tx.id)
      : financeStore.deleteExpense(tx.id)
    ).catch(() => {})
  )
}

async function saveCollection() {
  collectionErrors.date =
    newCollection.date ? '' : 'A data é obrigatória'

  collectionErrors.amount =
    newCollection.amount > 0 ? '' : 'Informe um valor válido'

  collectionErrors.memberName =
    newCollection.memberName?.trim()
      ? ''
      : 'Informe o nome do membro'

  collectionErrors.congregation =
    newCollection.congregation?.trim()
      ? ''
      : 'Selecione a congregação'

  if (
    collectionErrors.date ||
    collectionErrors.amount ||
    collectionErrors.memberName ||
    collectionErrors.congregation
  ) {
    return
  }

  try {
    await financeStore.addCollection({
      ...newCollection,
      memberName: newCollection.memberName?.trim(),
      description: newCollection.description?.trim(),
      collector: newCollection.collector?.trim(),
    })
  } catch {
    return
  }

  showAddCollection.value = false

  Object.assign(newCollection, {
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    memberName: '',
    type: 'Tithe',
    congregation: 'Beira Sede',
    paymentMethod: 'Cash',
    description: '',
    collector: '',
  })

  Object.assign(collectionErrors, {
    date: '',
    amount: '',
    memberName: '',
    congregation: '',
  })
}

// ─── Add Despesa modal ────────────────────────────────────────────────────────
const showAddExpense = ref(false)
const newExpense = reactive<Omit<FinanceExpense, 'id'>>({
  date: '',
  amount: 0,
  category: 'Building',
  description: '',
})
const expenseErrors = reactive({ date: '', amount: '', description: '' })

const expenseCategoriaOptions = [
  { label: 'Construção', value: 'Construção' },
  { label: 'Evangelismo', value: 'Evangelismo' },
  { label: 'Assistência Social', value: 'Assistência Social' },
  { label: 'Técnica', value: 'Técnica' },
  { label: 'Jovens', value: 'Jovens' },
  { label: 'Pregador', value: 'Pregador' },
  { label: 'Edificação', value: 'Edificação' },
  { label: 'Mídia', value: 'Mídia' },
  { label: 'Outros', value: 'Outros' },
]

async function saveDespesa() {
  expenseErrors.date = newExpense.date ? '' : 'Data is required'
  expenseErrors.amount = newExpense.amount > 0 ? '' : 'Valor must be > 0'
  expenseErrors.description = newExpense.description.trim() ? '' : 'Descrição is required'
  if (expenseErrors.date || expenseErrors.amount || expenseErrors.description) return
  try {
    await financeStore.addExpense({ ...newExpense })
  } catch {
    return // Store already surfaced the reason; keep the entry on screen.
  }
  showAddExpense.value = false
  Object.assign(newExpense, { date: '', amount: 0, category: 'Building', description: '' })
  Object.assign(expenseErrors, { date: '', amount: '', description: '' })
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Header actions -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div></div>
      <div class="flex gap-2">
        <Button variant="secondary" @click="showAddExpense = true">
          <template #icon-left><Icon icon="mdi:minus-circle-outline" /></template>
          Registar Despesa
        </Button>
        <Button @click="showAddCollection = true">
          <template #icon-left><Icon icon="mdi:plus-circle-outline" /></template>
          Registar Entrada
        </Button>
      </div>
    </div>

    <!-- Atép stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium">Total de Entradas</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ fmt(financeStore.totalIncome) }}</p>
            <p class="text-xs text-gray-400 mt-1">Desde o início</p>
          </div>
          <div
            class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"
          >
            <Icon icon="mdi:trending-up" class="text-blue-600 text-lg" />
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium">Atétal de Despesas</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ fmt(financeStore.totalExpenses) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">Desde o início</p>
          </div>
          <div class="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:trending-down" class="text-red-500 text-lg" />
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium">Saldo Atual</p>
            <p
              class="text-2xl font-bold mt-1"
              :class="financeStore.netBalance >= 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ fmt(financeStore.netBalance) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">Desde o início</p>
          </div>
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="financeStore.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'"
          >
            <Icon
              :icon="
                financeStore.netBalance >= 0
                  ? 'mdi:check-circle-outline'
                  : 'mdi:alert-circle-outline'
              "
              :class="financeStore.netBalance >= 0 ? 'text-green-600' : 'text-red-500'"
              class="text-lg"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium">Saldo deste Mês</p>
            <p
              class="text-2xl font-bold mt-1"
              :class="financeStore.thisMonthNet >= 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ fmt(financeStore.thisMonthNet) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Entradas: {{ fmt(financeStore.thisMonthIncome) }} / Saídas:
              {{ fmt(financeStore.thisMonthExpenses) }}
            </p>
          </div>
          <div
            class="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"
          >
            <Icon icon="mdi:calendar-month-outline" class="text-purple-600 text-lg" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Chart + Donut row -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Entradas vs Despesas bar chart -->
      <Card class="xl:col-span-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 class="text-sm font-semibold text-gray-800">Entradas vs Despesas</h3>
          <div class="flex gap-2 flex-wrap">
            <Tabs v-model="activePeriod" :tabs="periodTabs" />
          </div>
        </div>
        <BarChart v-if="hasFinanceData" :data="chartData" :height="240" />
        <EmptyState
          v-else
          icon="mdi:chart-bar"
          title="Ainda não existem dados"
          description="Entrada and expenses will be compared here once transactions are recorded."
        />
      </Card>

      <!-- Despesa category donut -->
      <div class="bg-slate-800 rounded-xl p-4 flex flex-col">
        <h3 class="text-sm font-semibold text-white mb-1">Despesas deste Mês</h3>
        <p class="text-xs text-slate-400 mb-3">Por categoria</p>
        <DonutChart
          v-if="Object.keys(financeStore.expenseByCategory).length"
          :data="donutData"
          :height="180"
        />
        <p v-else class="py-10 text-center text-xs text-slate-400">
          Nenhuma despesa registada neste mês.
        </p>
        <div class="mt-3 space-y-1.5">
          <div
            v-for="[cat, amount] in Object.entries(financeStore.expenseByCategory)"
            :key="cat"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :style="{ backgroundColor: categoryColors[cat as ExpenseCategory] }"
              ></span>
              <span class="text-xs text-slate-300">{{ expenseCategoryLabels[cat as ExpenseCategory] ?? cat }}</span>
            </div>
            <span class="text-xs text-white font-medium">{{ fmt(amount as number) }}</span>
          </div>
          <p
            v-if="!Object.keys(financeStore.expenseByCategory).length"
            class="py-3 text-center text-xs text-slate-400"
          >
            Nenhuma despesa registada neste mês.
          </p>
        </div>
      </div>
    </div>

    <!-- Report table -->
    <Card padding="none">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-800 capitalize">{{ activePeriod }} Report</h3>
        <!-- Nothing to export while the ledger is empty. -->
        <Button
          variant="secondary"
          size="sm"
          :disabled="!hasFinanceData"
          @click="showExport = true"
        >
          <template #icon-left><Icon icon="mdi:upload-outline" /></template>
          Exportar Relatório
        </Button>
      </div>

      <EmptyState
        v-if="!hasFinanceData"
        icon="mdi:chart-box-outline"
        title="Ainda não existem registos financeiros"
        description="Record a collection or an expense and the period report will build itself from there."
      />

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm" role="table">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Period</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Entrada (₦)</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Despesas (₦)</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Net (₦)</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Surplus %</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summaryRows"
              :key="row.Period"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-gray-700">{{ row.Period }}</td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ row.Income.toLocaleString('pt-MZ') }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ row.Expenses.toLocaleString('pt-MZ') }}
              </td>
              <td
                class="px-4 py-3 text-right font-semibold"
                :class="row.Net >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                {{ row.Net.toLocaleString('pt-MZ') }}
              </td>
              <td class="px-4 py-3 text-right">
                <Badge
                  :variant="row.Income === 0 ? 'neutral' : row.Net >= 0 ? 'success' : 'danger'"
                  size="sm"
                >
                  {{ row.Income === 0 ? '—' : Math.round((row.Net / row.Income) * 100) + '%' }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Recent activity -->
    <Card padding="none">
      <div class="px-4 py-3 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-800">Transações Recentes</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" role="table">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Membro</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Tipo</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Congregação</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Pagamento</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Observação</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
              <th class="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in pagedActivity"
              :key="tx.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">
                {{ fmtDate(tx.date) }}
              </td>

              <td class="px-4 py-3 font-medium text-gray-800">
                {{ tx.memberName }}
              </td>

              <td class="px-4 py-3">
                <Badge
                  :variant="tx.type === 'income' ? 'success' : 'danger'"
                  size="sm"
                >
                  {{
                    tx.type === 'income'
                      ? (incomeTypeLabels[tx.incomeType] ?? tx.incomeType)
                      : 'Despesa'
                  }}
                </Badge>
              </td>

              <td class="px-4 py-3 text-gray-600">
                {{ tx.congregation }}
              </td>

              <td class="px-4 py-3 text-gray-600">
                {{
                  tx.type === 'income'
                    ? (paymentMethodLabels[tx.paymentMethod] ?? tx.paymentMethod)
                    : '—'
                }}
              </td>

              <td class="px-4 py-3 text-gray-700">
                {{ tx.description || '—' }}
              </td>
              <td
                class="px-4 py-3 text-right font-medium"
                :class="tx.type === 'income' ? 'text-green-600' : 'text-red-500'"
              >
                {{ tx.type === 'income' ? '+' : '−' }}{{ fmt(tx.amount) }}
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  :aria-label="`Delete ${tx.description}`"
                  :disabled="isPending(tx.id)"
                  @click="removeEntry(tx)"
                >
                  <Icon
                    :icon="isPending(tx.id) ? 'mdi:loading' : 'mdi:trash-can-outline'"
                    :class="['text-base', isPending(tx.id) && 'animate-spin']"
                  />
                </button>
              </td>
            </tr>
            <tr v-if="!pagedActivity.length">
              <td colspan="8" class="px-4">
                <EmptyState
                  icon="mdi:cash-multiple"
                  title="Ainda não existem transações registadas"
                  description="Collections and expenses you record will appear here."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        v-model:page="txPage"
        :total-pages="txAtétalPages"
        :total="txAtétal"
        :range-start="txDe"
        :range-end="txAté"
        label="transactions"
      />
    </Card>

    <!-- ── Registar Entrada modal ─────────────────────────────────────────────── -->
    <Modal v-model="showAddCollection" title="Registar Entrada" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">
            Nome do membro <span class="text-red-500">*</span>
          </label>
          <input
            v-model="newCollection.memberName"
            type="text"
            placeholder="Ex.: João Manuel"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p v-if="collectionErrors.memberName" class="text-xs text-red-500">
            {{ collectionErrors.memberName }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Tipo de entrada</label>
          <select
            v-model="newCollection.type"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Tithe">Dízimo</option>
            <option value="Offering">Oferta</option>
            <option value="Contribution">Contribuição</option>
            <option value="Special Offering">Oferta Especial</option>
            <option value="Other">Outro</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">
            Valor (MT) <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="newCollection.amount"
            type="number"
            min="1"
            placeholder="Ex.: 1500"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p v-if="collectionErrors.amount" class="text-xs text-red-500">
            {{ collectionErrors.amount }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">
            Data <span class="text-red-500">*</span>
          </label>
          <input
            v-model="newCollection.date"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Congregação</label>
          <select
            v-model="newCollection.congregation"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Beira Sede">Beira Sede</option>
            <option value="Muchatazina">Muchatazina</option>
            <option value="Cerâmica">Cerâmica</option>
            <option value="Crespim">Crespim</option>
            <option value="Chimoio">Chimoio</option>
            <option value="Tete">Tete</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Método de pagamento</label>
          <select
            v-model="newCollection.paymentMethod"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Cash">Dinheiro</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="E-Mola">E-Mola</option>
            <option value="Bank">Banco</option>
            <option value="Other">Outro</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Registado por</label>
          <input
            v-model="newCollection.collector"
            type="text"
            placeholder="Ex.: Tesoureiro João"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Observação</label>
          <textarea
            v-model="newCollection.description"
            rows="3"
            placeholder="Ex.: Dízimo referente ao mês de outubro"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          ></textarea>
        </div>

      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showAddCollection = false">
            Cancelar
          </Button>

          <Button
            :loading="financeStore.saving"
            @click="saveCollection"
          >
            Guardar Entrada
          </Button>
        </div>
      </template>
    </Modal>

    <!-- ── Add Despesa modal ────────────────────────────────────────────────── -->
    <Modal v-model="showAddExpense" title="Registar Despesa" size="md">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700"
            >Data<span class="text-red-500 ml-0.5">*</span></label
          >
          <input
            v-model="newExpense.date"
            type="date"
            class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p v-if="expenseErrors.date" class="text-xs text-red-500">{{ expenseErrors.date }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700"
            >Valor (MT)<span class="text-red-500 ml-0.5">*</span></label
          >
          <input
            v-model.number="newExpense.amount"
            type="number"
            min="0"
            placeholder="e.g. 15000"
            class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p v-if="expenseErrors.amount" class="text-xs text-red-500">{{ expenseErrors.amount }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700"
            >Categoria<span class="text-red-500 ml-0.5">*</span></label
          >
          <select
            v-model="newExpense.category"
            class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option v-for="opt in expenseCategoriaOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700"
            >Descrição<span class="text-red-500 ml-0.5">*</span></label
          >
          <input
            v-model="newExpense.description"
            type="text"
            placeholder="Breve descrição"
            class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p v-if="expenseErrors.description" class="text-xs text-red-500">
            {{ expenseErrors.description }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button variant="secondary" @click="showAddExpense = false">Cancelar</Button>
          <Button :loading="financeStore.saving" @click="saveDespesa">
            <template #icon-left><Icon icon="mdi:check" /></template>
            Save Despesa
          </Button>
        </div>
      </template>
    </Modal>

    <!-- ── Export modal ─────────────────────────────────────────────────────── -->
    <Modal v-model="showExport" title="Export Relatório Financeiro" size="lg">
      <div class="flex flex-col gap-5">
        <!-- Data range -->
        <div>
          <p class="text-sm font-medium text-gray-700 mb-3">Select Data Range</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-500">De</label>
              <input
                v-model="exportRange.from"
                type="date"
                class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p v-if="exportRangeErrors.from" class="text-xs text-red-500">
                {{ exportRangeErrors.from }}
              </p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-500">Até</label>
              <input
                v-model="exportRange.to"
                type="date"
                class="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p v-if="exportRangeErrors.to" class="text-xs text-red-500">
                {{ exportRangeErrors.to }}
              </p>
            </div>
          </div>
        </div>

        <!-- Quick range shortcuts -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">Quick Select</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in [
                { label: 'This Week', fn: () => setPreset('week') },
                { label: 'This Month', fn: () => setPreset('month') },
                { label: 'This Quarter', fn: () => setPreset('quarter') },
                { label: 'This Year', fn: () => setPreset('year') },
                { label: 'Last 6 Months', fn: () => setPreset('6months') },
                { label: 'All Time', fn: () => setPreset('all') },
              ]"
              :key="preset.label"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
              @click="preset.fn()"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div class="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p class="text-xs font-medium text-gray-500 mb-2">Export Preview</p>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-lg font-bold text-blue-600">{{ exportPreviewEntrada }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Entrada entries</p>
            </div>
            <div>
              <p class="text-lg font-bold text-red-500">{{ exportPreviewDespesas }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Despesa entries</p>
            </div>
            <div>
              <p class="text-lg font-bold text-gray-800">{{ exportPreviewCount }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Atétal rows</p>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-3 text-center">
            CSV will include: Data, Type, Categoria, Descrição, Valor, Running Balance + Summary
            footer
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button variant="secondary" @click="showExport = false">Cancelar</Button>
          <Button variant="secondary" :disabled="exportPreviewCount === 0" @click="doExportPdf">
            <template #icon-left><Icon icon="mdi:file-pdf-box" /></template>
            Export PDF
          </Button>
          <Button :disabled="exportPreviewCount === 0" @click="doExport">
            <template #icon-left><Icon icon="mdi:download-outline" /></template>
            Download CSV ({{ exportPreviewCount }} rows)
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
