<script setup lang="ts">
import type { Member } from '~/types'

const membersStore = useMembersStore()
const { exportCSV } = useExportCSV()

const tabs = [
  { label: 'Todos os Membros', value: 'all' },
  { label: 'Irmãos', value: 'brothers' },
  { label: 'Irmãs', value: 'sisters' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
  { label: 'Desligados', value: 'disfellowshipped' },
  { label: 'Transferidos', value: 'transfer' },
  { label: 'Em Acompanhamento', value: 'weak' },
  { label: 'Afastados', value: 'late' },
]

const activeTab = computed({
  get: () => membersStore.filters.tab,
  set: (v) => membersStore.setFilter({ tab: v as typeof membersStore.filters.tab }),
})

const congregations = [
  'Muchatazina Sede',
  'Cerâmica',
  'Crespim',
  'Chimoio',
  'Tete',
]

const showImport = ref(false)

async function onImport(members: Omit<Member, 'id' | 'absenceCount'>[]) {
  // Sequential so a mid-import failure stops rather than firing off dozens of
  // half-finished writes.
  for (const m of members) {
    await membersStore.addMember({ ...m, absenceCount: 0 }).catch(() => {})
  }
}

function doExport() {
  exportCSV(
    membersStore.filteredMembers.map((m) => ({
      Nome: m.name,
      Sexo: m.gender,
      Telefone: m.phone,
      Email: m.email,
      Congregação: m.congregation ?? '',
      'Date of Birth': m.dob ?? '',
      Estado: m.status,
      'Estado Civil': m.maritalStatus ?? '',
      'Date of Baptism': m.dateOfBaptism ?? '',
      'Date of Registration': m.dateJoined ?? '',
      Country: m.country ?? '',
      State: m.state ?? '',
      LGA: m.localGovernment ?? '',
      Village: m.village ?? '',
      'Endereço': m.address ?? '',
      Occupation: m.occupation ?? '',
    })),
    'membros-icfr'
  )
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
      <Tabs v-model="activeTab" :tabs="tabs" />
      <div class="flex gap-2 shrink-0">
        <Button variant="secondary" size="sm" @click="doExport">
          <template #icon-left><Icon icon="mdi:upload-outline" class="text-base" /></template>
          Exportar CSV
        </Button>
        <Button variant="secondary" size="sm" @click="showImport = true">
          <template #icon-left><Icon icon="mdi:download-outline" class="text-base" /></template>
          Importar CSV
        </Button>
      </div>
    </div>

    <div class="flex gap-2 mt-3">
      <div class="relative flex-1">
        <Icon
          icon="mdi:magnify"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"
        />
        <input
          :value="membersStore.filters.search"
          type="search"
          placeholder="Pesquisar membro..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          aria-label="Pesquisar membros"
          @input="membersStore.setFilter({ search: ($event.target as any).value })"
        />
      </div>
      <div class="w-full sm:w-64">
        <select
          :value="membersStore.filters.congregation"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          aria-label="Filtrar por congregação"
          @change="membersStore.setFilter({ congregation: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">Todas as Congregações</option>

          <option
            v-for="congregation in congregations"
            :key="congregation"
            :value="congregation"
          >
            {{ congregation }}
          </option>
        </select>
      </div>
    </div>

    <ImportCsvModal v-model="showImport" @import="onImport" />
  </div>
</template>
