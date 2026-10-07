<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { SERVICE_CONFIGS, serviceByName } from '~/constants'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Presenças',
  description: 'Gestão e análise das presenças da ICFR Família Redimida.',
})

const { setHeader } = usePageHeader()
const attendanceStore = useAttendanceStore()
const { exportCSV } = useExportCSV()
const toast = useToast()

// ── Registo rápido de presenças ─────────────────────────────────────────────
const congregationOptions = ['Muchatazina Sede', 'Cerâmica', 'Crespim', 'Chimoio', 'Tete']

const serviceLabels: Record<string, string> = {
  'Sunday Worship': 'Culto de Celebração',
  'Sunday School': 'Escola Dominical',
  'Bible Class': 'Culto de Ensino',
  'Prayer Meeting': 'Culto de Oração',
  'Youth Class': 'Encontro de Jovens',
  'Singing Practice': 'Ensaio de Louvor',
  Evangelism: 'Evangelismo',
  "Leaders' Class": 'Encontro de Líderes',
}

function serviceLabel(service: string) {
  return serviceLabels[service] ?? service
}

const registerCongregation = ref('')
const registerService = ref('Sunday Worship')
const registerDate = ref(formatDate(new Date(), 'iso'))

function openAttendanceRegister() {
  if (!registerCongregation.value) {
    toast.error('Selecione a congregação.')
    return
  }

  if (!registerDate.value) {
    toast.error('Selecione a data do culto.')
    return
  }

  const config = serviceByName(registerService.value)

  const slug = config?.slug ?? registerService.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const month = registerDate.value.slice(0, 7)

  navigateTo({
    path: `/admin/attendance/${slug}`,
    query: {
      month,
      date: registerDate.value,
      congregation: registerCongregation.value,
    },
  })
}

/**
 * Mantemos este valor interno em inglês porque os registos existentes
 * e o store podem depender exatamente deste nome.
 */
const TREND_SERVICE = 'Sunday Worship'

useAbsenceTracking().autoSyncWhenReady()

onMounted(() => {
  attendanceStore.load()

  setHeader('Gestão de Presenças', 'Acompanhe as presenças dos membros nas atividades da igreja')
})

/**
 * Calcula a média de membros por culto/sessão.
 */
const rollingMonths = computed(() => attendanceStore.rollingMonthsByService(TREND_SERVICE))

const lineChartData = computed<ChartData<'line'>>(() => {
  const monthly = rollingMonths.value

  const perSession = (value: (m: (typeof monthly)[number]) => number) =>
    monthly.map((m) => (m.sessions ? Math.round(value(m) / m.sessions) : null))

  return {
    labels: monthly.map((m) => m.label),

    datasets: [
      {
        label: 'Membros registados por culto',
        data: perSession((m) => m.total),

        borderColor: '#2563eb',

        backgroundColor: 'rgba(37,99,235,0.08)',

        fill: true,

        tension: 0.4,

        pointRadius: 4,

        spanGaps: false,
      },

      {
        label: 'Presentes por culto',
        data: perSession((m) => m.present),

        borderColor: '#ef4444',

        backgroundColor: 'rgba(239,68,68,0.08)',

        fill: true,

        tension: 0.4,

        pointRadius: 4,

        spanGaps: false,
      },
    ],
  }
})

const hasAttendanceData = computed(() => rollingMonths.value.some((m) => m.sessions > 0))

const currentYear = String(new Date().getFullYear())

function doExport() {
  exportCSV(
    rollingMonths.value.map((m) => ({
      Mês: m.month,
      Sessões: m.sessions,
      Presentes: m.present,
      Registados: m.total,
      'Taxa %': m.rate,
    })),

    'resumo-presencas'
  )
}

function doImport() {
  const el = document.createElement('input')

  el.type = 'file'

  el.accept = '.csv'

  el.click()
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Registo rápido -->
    <Card>
      <div class="mb-5 flex items-start gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
        >
          <Icon icon="mdi:clipboard-check-outline" class="text-2xl" />
        </div>

        <div>
          <h2 class="text-base font-bold text-gray-900">Marcar Presenças</h2>

          <p class="mt-1 text-sm text-gray-500">
            Escolha a congregação, o culto ou atividade e a respetiva data.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700"> Congregação * </label>

          <select
            v-model="registerCongregation"
            class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Selecionar congregação —</option>

            <option
              v-for="congregation in congregationOptions"
              :key="congregation"
              :value="congregation"
            >
              {{ congregation }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            Culto / Atividade *
          </label>

          <select
            v-model="registerService"
            class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option v-for="service in SERVICE_CONFIGS" :key="service.name" :value="service.name">
              {{ serviceLabel(service.name) }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700"> Data * </label>

          <input
            v-model="registerDate"
            type="date"
            class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div class="mt-5 flex justify-end">
        <Button @click="openAttendanceRegister">
          <template #icon-left>
            <Icon icon="mdi:account-check-outline" />
          </template>

          Abrir Lista de Presença
        </Button>
      </div>
    </Card>

    <div class="flex items-center gap-3 pt-2">
      <div class="h-px flex-1 bg-gray-200"></div>

      <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Relatórios e Histórico
      </span>

      <div class="h-px flex-1 bg-gray-200"></div>
    </div>

    <!-- Ações -->
    <div class="flex justify-end gap-2">
      <Button variant="secondary" size="sm" @click="doExport">
        <template #icon-left>
          <Icon icon="mdi:upload-outline" />
        </template>

        Exportar CSV
      </Button>

      <Button variant="secondary" size="sm" @click="doImport">
        <template #icon-left>
          <Icon icon="mdi:download-outline" />
        </template>

        Importar CSV
      </Button>
    </div>

    <!-- Resumo anual -->
    <AttendanceSummary />

    <!-- Gráfico + desempenho -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card class="xl:col-span-2">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">Evolução Mensal das Presenças</h3>

        <p class="mb-4 text-xs text-gray-500">
          Culto de Celebração · média por culto registado nos últimos 12 meses
        </p>

        <LineChart v-if="hasAttendanceData" :data="lineChartData" :height="260" />

        <EmptyState
          v-else
          icon="mdi:chart-line"
          title="Nenhuma presença registada nos últimos 12 meses"
          description="Registe um culto para começar a visualizar a evolução mensal das presenças."
        />
      </Card>

      <AttendancePerformance :year="currentYear" />
    </div>

    <!-- Grelha mensal -->
    <MonthlyGrid />

    <!-- Visitantes e crianças -->
    <VisitorsAndChildren :service-type="TREND_SERVICE" />
  </div>
</template>
