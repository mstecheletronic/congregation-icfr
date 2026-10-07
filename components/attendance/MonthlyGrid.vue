<script setup lang="ts">
import { SERVICE_CONFIGS, serviceByName } from '~/constants'

const attendanceStore = useAttendanceStore()

const serviceOptions = SERVICE_CONFIGS.map((s) => s.name)

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

const selectedService = ref<string>(serviceOptions[0]!)
const selectedYear = ref(String(new Date().getFullYear()))

const congregationOptions = [
  'Todas as Congregações',
  'Muchatazina Sede',
  'Cerâmica',
  'Crespim',
  'Chimoio',
  'Tete',
]

const selectedCongregation = ref('Todas as Congregações')

// Build year options dynamically from the records that actually exist, so the
// dropdown surfaces years the user has data for (plus the current year).
const yearOptions = computed(() => {
  const years = new Set<string>()
  for (const r of attendanceStore.records) {
    if (r.date && r.date.length >= 4) years.add(r.date.slice(0, 4))
  }
  years.add(String(new Date().getFullYear()))
  return [...years].sort((a, b) => Number(b) - Number(a))
})

// A selected year that is not among the options renders as a blank select — which is what a
// hardcoded '2025' did once the 2025 records went away.
watch(
  yearOptions,
  (options) => {
    if (!options.includes(selectedYear.value)) selectedYear.value = options[0]!
  },
  { immediate: true }
)

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const monthlyData = computed(() =>
  attendanceStore.monthlyByService(selectedService.value, selectedYear.value).map((d, i) => ({
    ...d,
    label: months[i]!,
  }))
)

const serviceSlug = computed(
  () =>
    serviceByName(selectedService.value)?.slug ??
    selectedService.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
)

const hasRecordsForSelection = computed(() => monthlyData.value.some((m) => m.total > 0))

const headerText = computed(
  () =>
    `Mostrando 12 meses de presenças de ${serviceLabel(selectedService.value)} em ${selectedYear.value}`
)
</script>

<template>
  <Card>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <p class="text-sm font-medium text-gray-700">{{ headerText }}</p>
      <div class="flex flex-wrap gap-2">
        <select
          v-model="selectedCongregation"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Selecionar congregação"
        >
          <option
            v-for="congregation in congregationOptions"
            :key="congregation"
            :value="congregation"
          >
            {{ congregation }}
          </option>
        </select>

        <select
          v-model="selectedService"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Selecionar culto"
        >
          <option v-for="s in serviceOptions" :key="s" :value="s">{{ serviceLabel(s) }}</option>
        </select>
        <select
          v-model="selectedYear"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Selecionar ano"
        >
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <p
      v-if="!hasRecordsForSelection"
      class="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-900"
    >
      <Icon icon="mdi:information-outline" class="mt-0.5 shrink-0" />
      <span>
        Ainda não existem registos de {{ serviceLabel(selectedService) }} em {{ selectedYear }}.
        Abra um mês abaixo para marcar as presenças. Os resumos serão atualizados automaticamente.
      </span>
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="month in monthlyData"
        :key="month.month"
        class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-200 transition-colors"
      >
        <!-- Header: Month Year + menu -->
        <!-- The card's only action is "View Details" at the foot of it, so no
             overflow menu here — an empty one is worse than none. -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-900">
            {{ month.label }} de {{ selectedYear }}
          </h4>
        </div>

        <!-- Service + percentage + progress -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm mb-1.5">
            <span class="text-gray-700">{{ serviceLabel(selectedService) }}</span>
            <span class="font-semibold" style="color: #0ba5ec">{{ month.rate }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: `${month.rate}%` }"></div>
          </div>
        </div>

        <!-- Stat boxes -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="rounded-xl bg-blue-50/60 p-3">
            <p class="text-xs text-gray-500">Cultos</p>
            <p class="mt-1 text-lg font-bold text-gray-900">{{ month.sessions }}</p>
          </div>
          <div class="rounded-xl bg-blue-50/60 p-3">
            <p class="text-xs text-gray-500">Presentes</p>
            <p class="mt-1 text-lg font-bold text-gray-900">{{ month.present }}</p>
          </div>
        </div>

        <!-- View Details CTA -->
        <NuxtLink
          :to="`/admin/attendance/${serviceSlug}?month=${month.month}&congregation=${encodeURIComponent(selectedCongregation)}`"
          class="view-details-btn mt-auto inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          :aria-label="`${month.sessions ? 'Ver' : 'Marcar'} ${selectedService} presenças de ${month.label} ${selectedYear}`"
        >
          {{ month.sessions ? 'Ver detalhes' : 'Marcar presenças' }}
          <Icon icon="mdi:arrow-right" class="text-base" />
        </NuxtLink>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.view-details-btn {
  border-color: #0ba5ec;
  color: #0ba5ec;
}
.view-details-btn:hover {
  background-color: rgba(11, 165, 236, 0.08);
}
</style>
