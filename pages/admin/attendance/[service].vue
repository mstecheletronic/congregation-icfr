<script setup lang="ts">
import { serviceBySlug } from '~/constants'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

const { setHeader } = usePageHeader()
const attendanceStore = useAttendanceStore()
const route = useRoute()

const slug = computed(() => String(route.params.service))

const month = computed(() =>
  String(
    route.query.month ??
      new Date().toISOString().slice(0, 7)
  )
)

const serviceConfig = computed(() =>
  serviceBySlug(slug.value)
)

const serviceLabel = computed(() => {
  const cfg = serviceConfig.value

  if (cfg) return cfg.name

  return slug.value
    .split('-')
    .map(
      (w) =>
        w.charAt(0).toUpperCase() +
        w.slice(1)
    )
    .join(' ')
})

const dayOfWeek = computed(
  () => serviceConfig.value?.dayOfWeek ?? 0
)

const monthLabel = computed(() => {
  const year = parseInt(
    month.value.substring(0, 4),
    10
  )

  const mon = parseInt(
    month.value.substring(5, 7),
    10
  )

  return formatDate(
    new Date(year, mon - 1),
    'monthYear'
  )
})

function applyHeader() {
  setHeader(
    `Presenças — ${serviceLabel.value} — ${monthLabel.value}`,
    `Resumo e registo de presenças de ${serviceLabel.value} em ${monthLabel.value}`
  )
}

onMounted(() => {
  attendanceStore.load()
  applyHeader()
})

watch(
  [serviceLabel, monthLabel],
  applyHeader
)

useSeoMeta({
  title: computed(
    () => `Presenças — ${serviceLabel.value}`
  ),

  description: computed(
    () =>
      `Registos de presenças de ${serviceLabel.value} — ${monthLabel.value}`
  ),
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink
      to="/admin/attendance"
      class="inline-flex w-fit items-center gap-1.5 rounded-lg py-1 text-sm text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      <Icon
        icon="mdi:arrow-left"
        class="text-base"
      />

      Voltar para Presenças
    </NuxtLink>

    <AttendanceTable
      :service-type="serviceLabel"
      :month="month"
      :day-of-week="dayOfWeek"
    />
  </div>
</template>