<script setup lang="ts">
import { SERVICE_CONFIGS } from '~/constants'

const attendanceStore = useAttendanceStore()

const SERVICE_ICONS: Record<string, string> = {
  'Sunday Worship': 'mdi:church',
  'Sunday School': 'mdi:book-open-variant',
  'Bible Class': 'mdi:book-education-outline',
  'Prayer Meeting': 'mdi:hands-pray',
  'Youth Class': 'mdi:account-group-outline',
  'Singing Practice': 'mdi:music-note-outline',
  Evangelism: 'mdi:bullhorn-outline',
  "Leaders' Class": 'mdi:account-tie-outline',
}

const SERVICE_LABELS: Record<string, string> = {
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
  return SERVICE_LABELS[service] ?? service
}

const selectedYear = ref(String(new Date().getFullYear()))

// Build year options from records (so users always see years they have data
// for) plus the current year as a default anchor.
const yearOptions = computed(() => {
  const years = new Set<string>()
  for (const r of attendanceStore.records) {
    if (r.date && r.date.length >= 4) years.add(r.date.slice(0, 4))
  }
  years.add(String(new Date().getFullYear()))
  return [...years].sort((a, b) => Number(b) - Number(a))
})

// Average attendance per session for a service in a given year.
// Returns 0 when there are no sessions in that year.
function averageForYear(serviceType: string, year: string): number {
  const recs = attendanceStore.records.filter(
    (r) => r.serviceType === serviceType && r.date.startsWith(year)
  )
  const sessions = new Set(recs.map((r) => r.date)).size
  if (!sessions) return 0
  const present = recs.filter((r) => r.present).length
  return Math.round(present / sessions)
}

const stats = computed(() => {
  const year = selectedYear.value
  const prevYear = String(Number(year) - 1)
  return SERVICE_CONFIGS.map((cfg) => {
    const count = averageForYear(cfg.name, year)
    const prev = averageForYear(cfg.name, prevYear)
    // If there's no prior-year baseline, treat change as 0 so we don't show a
    // misleading "+100% vs last year" for brand-new years of data.
    const change = prev > 0 ? Math.round(((count - prev) / prev) * 100) : 0
    return {
      serviceType: cfg.name,
      icon: SERVICE_ICONS[cfg.name] ?? 'mdi:calendar-check-outline',
      count,
      change,
    }
  })
})

function fmt(n: number) {
  return new Intl.NumberFormat('pt-MZ').format(n)
}
</script>

<template>
  <Card>
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-base font-semibold text-gray-900">Média Anual de Presenças</h3>
        <p class="text-xs text-gray-500 mt-0.5">Resumo anual de presenças por atividade</p>
      </div>
      <select
        v-model="selectedYear"
        class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Selecionar ano"
      >
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <EmptyState
      v-if="!attendanceStore.records.length"
      icon="mdi:calendar-check-outline"
      title="Ainda não existem presenças registadas"
      description="As médias por culto aparecerão depois de os registos serem preenchidos."
    />

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="svc in stats"
        :key="svc.serviceType"
        class="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4"
      >
        <!-- Top row: name + icon -->
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-medium text-gray-700 leading-snug">
            {{ serviceLabel(svc.serviceType) }}
          </p>
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50"
            aria-hidden="true"
          >
            <Icon :icon="svc.icon" class="text-lg" style="color: #0ba5ec" />
          </div>
        </div>

        <!-- Big number -->
        <p class="text-3xl font-bold text-gray-900 leading-none">{{ fmt(svc.count) }}</p>

        <!-- Bottom row: badge + comparison -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span
            :class="[
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
              svc.change > 0 && 'bg-green-50 text-green-600',
              svc.change < 0 && 'bg-red-50 text-red-600',
              svc.change === 0 && 'bg-gray-50 text-gray-500',
            ]"
          >
            <Icon
              :icon="
                svc.change > 0
                  ? 'mdi:trending-up'
                  : svc.change < 0
                    ? 'mdi:trending-down'
                    : 'mdi:minus'
              "
              class="text-[12px]"
            />
            {{ Math.abs(svc.change) }}%
          </span>
          <span>Comparado ao ano anterior</span>
        </div>
      </div>
    </div>
  </Card>
</template>
