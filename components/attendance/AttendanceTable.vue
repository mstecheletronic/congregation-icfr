<script setup lang="ts">
import type { WorshipDetails } from '~/types'

interface Props {
  serviceType?: string
  month?: string
  /** Day of the week this service meets (0 = Sunday … 6 = Saturday). */
  dayOfWeek?: number
}
const props = withDefaults(defineProps<Props>(), {
  serviceType: 'Sunday Worship',
  // Current month by default; a fixed one renders a register for a month nobody is in.
  month: () => new Date().toISOString().slice(0, 7),
  dayOfWeek: 0,
})

const attendanceStore = useAttendanceStore()
const membersStore = useMembersStore()
const route = useRoute()
const { exportCSV } = useExportCSV()

function dateFromIso(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function fullDatePt(date: string) {
  const formatted = new Intl.DateTimeFormat('pt-MZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateFromIso(date))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function shortDatePt(date: string) {
  const formatted = new Intl.DateTimeFormat('pt-MZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(dateFromIso(date))
    .replace(/\./g, '')

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const searchQuery = ref('')
const hasChanged = ref(false)

const congregationOptions = [
  'Todas as Congregações',
  'Muchatazina Sede',
  'Cerâmica',
  'Crespim',
  'Chimoio',
  'Tete',
]

const selectedCongregation = ref(
  typeof route.query.congregation === 'string' ? route.query.congregation : 'Todas as Congregações'
)

const focusDate = computed(() => (typeof route.query.date === 'string' ? route.query.date : ''))

// Get every meeting date for this service in this month. Combines:
// 1. The service's scheduled day-of-week (e.g. Wednesdays for Bible Class).
// 2. Any other dates that already have records for this month + service, so
//    off-schedule meetings the user already recorded still get a column.
const serviceDatesInMonth = computed(() => {
  const year = parseInt(props.month.substring(0, 4), 10)
  const mon = parseInt(props.month.substring(5, 7), 10)
  const dates = new Set<string>()
  const d = new Date(year, mon - 1, 1)
  while (d.getMonth() === mon - 1) {
    // formatDate(_, 'iso') uses local-time components, avoiding the UTC offset
    // bug that toISOString causes — critical so the date strings match the
    // (locally-formatted) dates already in records.
    if (d.getDay() === props.dayOfWeek) dates.add(formatDate(d, 'iso'))
    d.setDate(d.getDate() + 1)
  }
  for (const r of attendanceStore.records) {
    if (r.serviceType === props.serviceType && r.date.startsWith(props.month)) {
      dates.add(r.date)
    }
  }
  return [...dates].sort()
})

const filteredMembers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()

  return membersStore.members.filter((m) => {
    // Cadastros ainda aguardando aprovação não entram na folha de presenças.
    if (m.status === 'Pending') return false

    const matchesCongregation =
      selectedCongregation.value === 'Todas as Congregações' ||
      m.congregation === selectedCongregation.value

    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.phone ?? '').toLowerCase().includes(q) ||
      (m.churchNumber ?? '').toLowerCase().includes(q)

    return matchesCongregation && matchesSearch
  })
})

function isPresent(memberId: string, date: string) {
  return attendanceStore.findRecord(memberId, date, props.serviceType)?.present ?? false
}

// ─── Marking present asks where ──────────────────────────────────────────────
/**
 * What the open `WorshipPlaceModal` will apply its answer to.
 *
 * `dates` is a list because the row menu marks a whole month in one go — one answer covers all of
 * them rather than putting the same dialog in front of the user four times.
 *
 * `revert` puts the checkbox back if the dialog is declined. The box is bound with `:checked`
 * rather than `v-model`, so the browser has already drawn it ticked while the store still says
 * absent; without this it would sit there ticked and unsaved.
 */
const pendingMark = ref<{
  memberId: string
  dates: string[]
  subject: string
  scopeNote: string
  revert: () => void
} | null>(null)

const showWorshipModal = ref(false)

function memberNome(memberId: string) {
  return membersStore.members.find((m) => m.id === memberId)?.name ?? 'Este membro'
}

function toggle(memberId: string, date: string, event: Event) {
  const turningOn = !isPresent(memberId, date)

  if (!turningOn) {
    // Un-marking makes no claim about where anybody worshipped, so it needs no dialog.
    attendanceStore.setAttendance(memberId, date, props.serviceType, false)
    hasChanged.value = true
    return
  }

  const checkbox = event.target as HTMLInputElement
  pendingMark.value = {
    memberId,
    dates: [date],
    subject: `${memberNome(memberId)} · ${formatDate(date, 'full')}`,
    scopeNote: '',
    revert: () => {
      checkbox.checked = false
    },
  }
  showWorshipModal.value = true
}

// Both handlers close the dialog themselves rather than leaving it to the child's `v-model` emit.
// The parent owns `pendingMark`, so it owns whether the dialog is open — one of the two going
// stale is how you end up with a dialog that answers for the wrong row.
function onWorshipConfirmed(details: WorshipDetails) {
  const pending = pendingMark.value
  pendingMark.value = null
  showWorshipModal.value = false
  if (!pending) return
  for (const date of pending.dates) {
    attendanceStore.setAttendance(pending.memberId, date, props.serviceType, true, details)
  }
  hasChanged.value = true
}

function onWorshipCancelled() {
  pendingMark.value?.revert()
  pendingMark.value = null
  showWorshipModal.value = false
}

/** The record for a cell, so the sheet can show that a tick came from another congregation. */
function recordFor(memberId: string, date: string) {
  return attendanceStore.findRecord(memberId, date, props.serviceType)
}

function worshippedElsewhere(memberId: string, date: string) {
  const record = recordFor(memberId, date)
  return Boolean(record?.present && record.place === 'elsewhere')
}

/** Hover text naming the congregation, and whether the certificate was actually produced. */
function elsewhereTitle(memberId: string, date: string) {
  const record = recordFor(memberId, date)
  if (!record) return ''
  const where = record.congregation || 'outra congregação'
  const certificate = record.certificate
    ? 'comprovativo de culto apresentado'
    : 'comprovativo ainda não apresentado'
  return `Participou em ${where} — ${certificate}`
}

// Registers can run to hundreds of names; page them so the sheet stays usable.
const {
  page: attPage,
  total: attTotal,
  totalPages: attTotalPages,
  paginated: pagedMembers,
  rangeStart: attFrom,
  rangeEnd: attTo,
} = usePagination(filteredMembers, 25)

// ─── Per-member row menu ─────────────────────────────────────────────────────
const openRowMenu = ref<string | null>(null)

/**
 * Marks todas as datas da atividade in the displayed month for one member in a single go.
 *
 * Asks where once, not once per Sunday — a month of dialogs to record a month of attendance would
 * make the shortcut slower than ticking the boxes. The one answer applies to all of them, which the
 * dialog says plainly so nobody records four services abroad by accident.
 */
function markMonth(memberId: string, present: boolean) {
  openRowMenu.value = null
  const dates = serviceDatesInMonth.value

  if (!present) {
    for (const date of dates) {
      attendanceStore.setAttendance(memberId, date, props.serviceType, false)
    }
    hasChanged.value = true
    return
  }

  pendingMark.value = {
    memberId,
    dates: [...dates],
    subject: `${memberNome(memberId)} · ${dates.length} cultos de ${props.serviceType}`,
    scopeNote: `Esta informação será aplicada aos ${dates.length} cultos de ${formatDate(props.month + '-01', 'monthYear')}.`,
    revert: () => {},
  }
  showWorshipModal.value = true
}

onMounted(async () => {
  await membersStore.load()

  const dismiss = () => {
    openRowMenu.value = null
  }
  document.addEventListener('click', dismiss)
  onUnmounted(() => document.removeEventListener('click', dismiss))
})

function getMonthlySummary(memberId: string) {
  const dates = serviceDatesInMonth.value
  const sessionsTotal = dates.length
  const sessionsPresent = dates.reduce((n, d) => (isPresent(memberId, d) ? n + 1 : n), 0)
  const percentage = sessionsTotal ? Math.round((sessionsPresent / sessionsTotal) * 100) : 0
  return { sessionsTotal, sessionsPresent, percentage }
}

async function save() {
  try {
    await attendanceStore.saveChanges()
  } catch {
    return // Refused — keep the ticks pending so nothing looks saved that is not.
  }
  hasChanged.value = false
}

function cancel() {
  attendanceStore.cancelChanges()
  hasChanged.value = false
}

function doExport() {
  exportCSV(
    filteredMembers.value.map((m) => {
      const summary = getMonthlySummary(m.id)
      const row: Record<string, unknown> = {
        Nome: m.name,
        Phone: m.phone,
        'Total de Cultos': summary.sessionsTotal,
        'Cultos Presentes': summary.sessionsPresent,
        'Presença %': summary.percentage,
      }
      serviceDatesInMonth.value.forEach((d) => {
        // Nomes the congregation in the cell, so an exported register still shows which ticks were
        // earned elsewhere — a bare "Present" would flatten the two back together.
        if (!isPresent(m.id, d)) {
          row[d] = 'Ausente'
          return
        }
        const record = recordFor(m.id, d)
        if (record?.place !== 'elsewhere') {
          row[d] = 'Presente'
          return
        }
        const where = record.congregation || 'outra congregação'
        row[d] = `Presente (${where}${record.certificate ? '' : ', comprovativo pendente'})`
      })
      return row
    }),
    `presencas-${props.month}`
  )
}
</script>

<template>
  <div class="flex flex-col gap-0">
    <!-- Controls -->
    <div class="flex flex-col gap-3 mb-4">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr_auto]">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500"> Congregação </label>

          <select
            v-model="selectedCongregation"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option
              v-for="congregation in congregationOptions"
              :key="congregation"
              :value="congregation"
            >
              {{ congregation }}
            </option>
          </select>
        </div>

        <div class="relative self-end">
          <Icon
            icon="mdi:magnify"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Pesquisar membros..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            aria-label="Pesquisar presenças"
          />
        </div>

        <div class="flex items-end gap-2">
          <Button variant="secondary" size="sm" @click="doExport">
            <template #icon-left><Icon icon="mdi:upload-outline" /></template>
            Exportar CSV
          </Button>
          <Button variant="secondary" size="sm">
            <template #icon-left><Icon icon="mdi:download-outline" /></template>
            Importar CSV
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span class="rounded-lg bg-blue-50 px-2.5 py-1.5 font-medium text-blue-700">
          {{ filteredMembers.length }}
          membro{{ filteredMembers.length === 1 ? '' : 's' }}
        </span>

        <span v-if="selectedCongregation !== 'Todas as Congregações'">
          Congregação: <strong>{{ selectedCongregation }}</strong>
        </span>
      </div>
    </div>

    <Card padding="none">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" role="table">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th scope="col" class="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-10">
                N.º
              </th>
              <th
                scope="col"
                class="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[140px]"
              >
                Nome
              </th>
              <th
                scope="col"
                class="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[140px]"
              >
                Resumo Mensal do Membro
              </th>
              <th
                v-for="date in serviceDatesInMonth"
                :key="date"
                scope="col"
                :class="[
                  'text-center px-2 py-2.5 text-xs font-medium w-20',
                  date === focusDate ? 'bg-blue-50 text-blue-700' : 'text-gray-500',
                ]"
              >
                {{ shortDatePt(date) }}
              </th>
              <th scope="col" class="w-8 px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(member, idx) in pagedMembers"
              :key="member.id"
              :class="['border-b border-gray-50', idx % 2 === 0 ? '' : 'bg-gray-50/30']"
            >
              <td class="px-3 py-2.5 text-gray-500">{{ attFrom + idx }}</td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <Avatar :src="member.avatar" :name="member.name" size="sm" />
                  <span class="font-medium text-gray-900 text-xs">{{ member.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2.5 min-w-[140px]">
                <div>
                  <div class="flex items-center gap-2 mb-0.5">
                    <div class="progress-bar flex-1">
                      <div
                        class="progress-bar-fill"
                        :style="{ width: `${getMonthlySummary(member.id).percentage}%` }"
                      ></div>
                    </div>
                    <span class="text-[11px] font-medium text-gray-700 w-7 text-right">
                      {{ getMonthlySummary(member.id).percentage }}%
                    </span>
                  </div>
                  <p class="text-[10px] text-gray-400">
                    {{ getMonthlySummary(member.id).sessionsPresent }}/{{
                      getMonthlySummary(member.id).sessionsTotal
                    }}
                  </p>
                </div>
              </td>
              <td
                v-for="date in serviceDatesInMonth"
                :key="date"
                :class="['px-2 py-2.5 text-center', date === focusDate && 'bg-blue-50/50']"
              >
                <span class="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    class="attendance-check"
                    :checked="isPresent(member.id, date)"
                    :aria-label="`Presença de ${member.name} em ${fullDatePt(date)}`"
                    @change="toggle(member.id, date, $event)"
                  />
                  <!-- Marks a tick that came from another congregation. Without it the sheet shows
                       an ordinary present and the distinction is invisible once saved. -->
                  <Icon
                    v-if="worshippedElsewhere(member.id, date)"
                    icon="mdi:certificate-outline"
                    class="text-xs text-amber-500"
                    :class="!recordFor(member.id, date)?.certificate && 'opacity-50'"
                    :title="elsewhereTitle(member.id, date)"
                    :aria-label="elsewhereTitle(member.id, date)"
                  />
                </span>
              </td>
              <td class="px-2 py-2.5 relative">
                <button
                  class="text-gray-400 hover:text-gray-600 p-0.5"
                  :aria-label="`Mais ações para ${member.name}`"
                  :aria-expanded="openRowMenu === member.id"
                  @click.stop="openRowMenu = openRowMenu === member.id ? null : member.id"
                >
                  <Icon icon="mdi:dots-vertical" />
                </button>
                <div
                  v-if="openRowMenu === member.id"
                  class="absolute right-2 top-8 z-10 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  @click.stop
                >
                  <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                    @click="markMonth(member.id, true)"
                  >
                    <Icon icon="mdi:check-all" class="text-green-600" />
                    Marcar todos como presentes
                  </button>
                  <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                    @click="markMonth(member.id, false)"
                  >
                    <Icon icon="mdi:close-box-multiple-outline" class="text-red-500" />
                    Marcar todos como ausentes
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="membersStore.loading && !pagedMembers.length">
              <td :colspan="4 + serviceDatesInMonth.length" class="px-4">
                <LoadingState :rows="6" title="Carregando registo..." />
              </td>
            </tr>
            <tr v-else-if="!pagedMembers.length">
              <td :colspan="4 + serviceDatesInMonth.length" class="px-4">
                <EmptyState
                  icon="mdi:calendar-check-outline"
                  title="Nenhum membro para marcar"
                  description="As presenças poderão ser registadas quando existirem membros cadastrados."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        v-model:page="attPage"
        :total-pages="attTotalPages"
        :total="attTotal"
        :range-start="attFrom"
        :range-end="attTo"
        label="membros"
      />
    </Card>

    <!-- Sticky footer -->
    <Transition name="fade">
      <div
        v-if="hasChanged"
        class="sticky bottom-4 flex justify-end gap-2 mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3"
      >
        <Button :loading="attendanceStore.saving" @click="save">Guardar Alterações</Button>
        <Button variant="secondary" @click="cancel">Cancelar</Button>
      </div>
    </Transition>

    <WorshipPlaceModal
      v-model="showWorshipModal"
      :subject="pendingMark?.subject ?? ''"
      :scope-note="pendingMark?.scopeNote ?? ''"
      @confirm="onWorshipConfirmed"
      @cancel="onWorshipCancelled"
    />
  </div>
</template>
