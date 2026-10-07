<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Painel Administrativo — ICFR Família Redimida',
  description: 'Visão geral administrativa da ICFR Família Redimida.',
})

const { setHeader } = usePageHeader()
const attendanceStore = useAttendanceStore()
const membersStore = useMembersStore()
const liveStore = usePublicLiveStreamStore()

const liveForm = reactive({
  title: '',
  preacher: '',
  serviceType: 'Sunday Worship',
})

async function createLiveFromDashboard() {
  if (!liveForm.title.trim()) {
    useToast().error('Digite o título da Live.')
    return
  }

  const roomName = `icfr-live-${Date.now()}`

  const created = await liveStore.startLive({
    title: liveForm.title.trim(),
    preacher: liveForm.preacher.trim() || 'ICFR Família Redimida',
    videoUrl: '',
    serviceType: liveForm.serviceType,
    congregation: 'ICFR Família Redimida',
    city: 'Beira',
    thumbnailSrc: '',
    viewerCount: 0,
    startedAt: new Date().toISOString(),

    streamMode: 'internal',
    roomName,
  })

  liveForm.title = ''
  liveForm.preacher = ''

  if (created?.id) {
    await navigateTo(`/admin/live-streams/studio/${created.id}`)
  }
}

const chartMode = ref<'weekly' | 'monthly'>('monthly')

/**
 * Mantemos estes nomes internos em inglês porque os registos existentes
 * podem depender exatamente destes valores.
 */
const chartService = ref('Sunday Worship')

const serviceOptions = ['Sunday Worship', 'Sunday School', 'Bible Class', 'Prayer Meeting']

const serviceLabels: Record<string, string> = {
  'Sunday Worship': 'Culto de Domingo',
  'Sunday School': 'Escola Dominical',
  'Bible Class': 'Estudo Bíblico',
  'Prayer Meeting': 'Reunião de Oração',
}

const chartTitle = computed(() =>
  chartMode.value === 'monthly' ? 'Evolução Mensal das Presenças' : 'Evolução Semanal das Presenças'
)

const greeting = computed(() => {
  const h = new Date().getHours()

  if (h < 12) return 'Bom dia'
  if (h < 17) return 'Boa tarde'

  return 'Boa noite'
})

const SUMMARY_SERVICE = 'Sunday Worship'

const summary = useAttendanceSummary(SUMMARY_SERVICE)

const noAttendanceYet = computed(() => !summary.hasData.value)

const teachingsStore = useTeachingsStore()

useAbsenceTracking().autoSyncWhenReady()

onMounted(() => {
  attendanceStore.load()
  teachingsStore.load()
  liveStore.load()

  setHeader(
    `${greeting.value} — ICFR Família Redimida`,
    'Resumo de membros, presenças e atividades da igreja'
  )
})

const statsCards = computed(() => [
  {
    title: 'Total de membros',
    value: membersStore.members.length,
    subtitle: `${membersStore.activeCount} ativos`,
    sparkColor: '#93c5fd',
  },

  {
    title: 'Presença este mês',
    value: summary.thisMonthRate.value === null ? '—' : `${summary.thisMonthRate.value}%`,

    subtitle:
      summary.thisMonthRate.value === null
        ? `Sem registos em ${summary.monthLabel}`
        : summary.monthLabel,

    change: summary.monthOnMonthChange.value,
    changeLabel: 'Comparado com o mês anterior',

    sparkValues: summary.rateTrend.value,
    sparkColor: '#6ee7b7',
  },

  {
    title: 'Média semanal',
    value: summary.averageWeekly.value === null ? '—' : summary.averageWeekly.value,

    subtitle:
      summary.averageWeekly.value === null ? 'Nenhuma sessão registada' : 'Pessoas por sessão',

    sparkColor: '#a5b4fc',
  },

  {
    title: 'Taxa de presença anual',
    value: summary.annualRate.value === null ? '—' : `${summary.annualRate.value}%`,

    subtitle:
      summary.annualRate.value === null
        ? `Sem registos em ${summary.year}`
        : `Durante ${summary.year}`,

    sparkValues: summary.rateTrend.value,
    sparkColor: '#fca5a5',
  },
])

const barChartData = computed<ChartData<'bar'>>(() => {
  if (chartMode.value === 'monthly') {
    const data = attendanceStore.rollingMonthsByService(chartService.value)

    return {
      labels: data.map((d) => d.label),

      datasets: [
        {
          label: 'Presentes',

          data: data.map((d) => d.present),

          backgroundColor: data.map((_, i) => (i === data.length - 1 ? '#2563eb' : '#bfdbfe')),

          borderRadius: 4,
        },

        {
          label: 'Ausentes',

          data: data.map((d) => d.total - d.present),

          backgroundColor: data.map((_, i) => (i === data.length - 1 ? '#f87171' : '#fecaca')),

          borderRadius: 4,
        },
      ],
    }
  }

  const data = attendanceStore.weeklyByService(chartService.value)

  return {
    labels: data.map((d) => d.label),

    datasets: [
      {
        label: 'Presentes',

        data: data.map((d) => d.present),

        backgroundColor: data.map((_, i) => (i === data.length - 1 ? '#2563eb' : '#bfdbfe')),

        borderRadius: 4,
      },

      {
        label: 'Ausentes',

        data: data.map((d) => d.total - d.present),

        backgroundColor: data.map((_, i) => (i === data.length - 1 ? '#f87171' : '#fecaca')),

        borderRadius: 4,
      },
    ],
  }
})

const barOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: true,
      position: 'top',

      labels: {
        usePointStyle: true,
        boxWidth: 8,

        font: {
          size: 11,
        },
      },
    },

    tooltip: {
      mode: 'index',
      intersect: false,

      callbacks: {
        afterBody(items) {
          const present = items.find((i) => i.dataset.label === 'Presentes')?.parsed.y ?? 0

          const absent = items.find((i) => i.dataset.label === 'Ausentes')?.parsed.y ?? 0

          const total = present + absent

          return total ? [`Taxa: ${Math.round((present / total) * 100)}%`] : []
        },
      },
    },
  },

  scales: {
    x: {
      stacked: false,

      grid: {
        display: false,
      },

      ticks: {
        font: {
          size: 11,
        },
      },
    },

    y: {
      grid: {
        color: '#f3f4f6',
      },

      ticks: {
        font: {
          size: 11,
        },
      },

      beginAtZero: true,
    },
  },
}))
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Estatísticas principais -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard v-for="card in statsCards" :key="card.title" v-bind="card" />
    </div>

    <!-- Aviso caso ainda não existam presenças -->
    <NuxtLink
      v-if="noAttendanceYet"
      to="/admin/attendance"
      class="flex items-start gap-2.5 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-700"
    >
      <Icon icon="mdi:calendar-plus-outline" class="mt-0.5 shrink-0 text-gray-400" />

      <span>
        Ainda não existem presenças registadas para
        {{ serviceLabels[SUMMARY_SERVICE] }}.

        <span class="font-medium"> Registe um culto </span>

        para começar a visualizar as estatísticas.
      </span>
    </NuxtLink>

    <!-- Transmissão ao Vivo -->
    <Card>
      <div class="flex flex-col gap-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Transmissão ao Vivo</h3>

            <p class="mt-1 text-sm text-gray-500">
              Crie e gerencie a Live diretamente pelo Dashboard.
            </p>
          </div>

          <span
            v-if="liveStore.isLive"
            class="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600"
          >
            <span class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            AO VIVO
          </span>

          <span
            v-else
            class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
          >
            OFFLINE
          </span>
        </div>

        <!-- Live ativa -->
        <div
          v-if="liveStore.currentStream"
          class="rounded-xl border border-red-100 bg-red-50/40 p-4"
        >
          <h4 class="font-semibold text-gray-900">
            {{ liveStore.currentStream.title }}
          </h4>

          <p class="mt-1 text-sm text-gray-500">
            {{ liveStore.currentStream.preacher }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              v-if="
                liveStore.currentStream.streamMode === 'internal' &&
                liveStore.currentStream.roomName
              "
              :to="`/admin/live-streams/studio/${liveStore.currentStream.id}`"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Abrir Estúdio ICFR
            </NuxtLink>

            <a
              v-else-if="liveStore.currentStream.videoUrl"
              :href="liveStore.currentStream.videoUrl"
              target="_blank"
              rel="noopener"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Abrir Live
            </a>

            <button
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              :disabled="liveStore.saving"
              @click="liveStore.endCurrentLive()"
            >
              Encerrar Live
            </button>
          </div>
        </div>

        <!-- Criar nova Live -->
        <div v-else class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"> Título </label>

            <input
              v-model="liveForm.title"
              type="text"
              placeholder="Ex.: Culto de Celebração"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"> Pregador </label>

            <input
              v-model="liveForm.preacher"
              type="text"
              placeholder="Nome do pregador"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"> Tipo de Culto </label>

            <select
              v-model="liveForm.serviceType"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="Sunday Worship">Culto de Celebração</option>

              <option value="Bible Class">Culto de Ensino</option>

              <option value="Sunday School">Escola Dominical</option>

              <option value="Evangelism">Evangelismo</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              :disabled="liveStore.saving"
              @click="createLiveFromDashboard"
            >
              <Icon icon="mdi:broadcast" class="h-5 w-5" />

              Criar Live ICFR
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Gráfico + vídeos -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card class="xl:col-span-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              {{ chartTitle }}
            </h3>

            <div class="flex items-center gap-4 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input v-model="chartMode" type="radio" value="weekly" class="accent-blue-600" />

                Semanal
              </label>

              <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input v-model="chartMode" type="radio" value="monthly" class="accent-blue-600" />

                Mensal
              </label>
            </div>
          </div>

          <select
            v-model="chartService"
            class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-shrink-0"
            aria-label="Selecionar atividade"
          >
            <option v-for="s in serviceOptions" :key="s" :value="s">
              {{ serviceLabels[s] ?? s }}
            </option>
          </select>
        </div>

        <BarChart
          v-if="attendanceStore.records.length"
          :key="`${chartMode}-${chartService}`"
          :data="barChartData"
          :options="barOptions"
          :height="240"
        />

        <EmptyState
          v-else
          icon="mdi:chart-bar"
          title="Nenhuma presença registada"
          description="O gráfico será preenchido à medida que as presenças forem registadas."
        />
      </Card>

      <RecentVideoUploads />
    </div>

    <!-- Acompanhamento de membros + ensinamentos -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2">
        <BacksliderTable />
      </div>

      <RecentUploads />
    </div>
  </div>
</template>
