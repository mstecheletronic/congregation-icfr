<script setup lang="ts">
import type { ChartData } from 'chart.js'

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

/**
 * Mantemos este valor interno em inglês porque os registos existentes
 * e o store podem depender exatamente deste nome.
 */
const TREND_SERVICE = 'Sunday Worship'

useAbsenceTracking().autoSyncWhenReady()

onMounted(() => {
  attendanceStore.load()

  setHeader(
    'Gestão de Presenças',
    'Acompanhe as presenças dos membros nas atividades da igreja'
  )
})

/**
 * Calcula a média de membros por culto/sessão.
 */
const rollingMonths = computed(() =>
  attendanceStore.rollingMonthsByService(TREND_SERVICE)
)

const lineChartData = computed<ChartData<'line'>>(() => {
  const monthly = rollingMonths.value

  const perSession = (
    value: (m: (typeof monthly)[number]) => number
  ) =>
    monthly.map((m) =>
      m.sessions
        ? Math.round(value(m) / m.sessions)
        : null
    )

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

const hasAttendanceData = computed(() =>
  rollingMonths.value.some((m) => m.sessions > 0)
)

const currentYear = String(
  new Date().getFullYear()
)

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
    <!-- Ações -->
    <div class="flex justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        @click="doExport"
      >
        <template #icon-left>
          <Icon icon="mdi:upload-outline" />
        </template>

        Exportar CSV
      </Button>

      <Button
        variant="secondary"
        size="sm"
        @click="doImport"
      >
        <template #icon-left>
          <Icon icon="mdi:download-outline" />
        </template>

        Importar CSV
      </Button>
    </div>

    <!-- Resumo anual -->
    <AttendanceSummary />

    <!-- Gráfico + desempenho -->
    <div
      class="grid grid-cols-1 xl:grid-cols-3 gap-4"
    >
      <Card class="xl:col-span-2">
        <h3
          class="text-sm font-semibold text-gray-900 mb-1"
        >
          Evolução Mensal das Presenças
        </h3>

        <p
          class="mb-4 text-xs text-gray-500"
        >
          Culto de Domingo · média por culto registado nos últimos 12 meses
        </p>

        <LineChart
          v-if="hasAttendanceData"
          :data="lineChartData"
          :height="260"
        />

        <EmptyState
          v-else
          icon="mdi:chart-line"
          title="Nenhuma presença registada nos últimos 12 meses"
          description="Registe um culto para começar a visualizar a evolução mensal das presenças."
        />
      </Card>

      <AttendancePerformance
        :year="currentYear"
      />
    </div>

    <!-- Métodos de check-in -->
    <div class="flex gap-3">
      <Button variant="secondary">
        <template #icon-left>
          <Icon icon="mdi:qrcode-scan" />
        </template>

        Check-in por QR
      </Button>

      <Button variant="secondary">
        <template #icon-left>
          <Icon icon="mdi:fingerprint" />
        </template>

        Sincronizar Biometria
      </Button>
    </div>

    <!-- Grelha mensal -->
    <MonthlyGrid />

    <!-- Visitantes e crianças -->
    <VisitorsAndChildren
      :service-type="TREND_SERVICE"
    />
  </div>
</template>