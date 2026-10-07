<script setup lang="ts">
import { ICFR_CHURCH_GROUPS } from '~/constants'

definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Departamentos e Grupos — ICFR Família Redimida',
})

const { setHeader } = usePageHeader()
const membersStore = useMembersStore()

function groupSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

onMounted(async () => {
  setHeader(
    'Departamentos e Grupos',
    'Gestão dos departamentos, grupos e ministérios da ICFR Família Redimida'
  )

  await membersStore.load()
})

const groupCards = computed(() =>
  ICFR_CHURCH_GROUPS.map((name) => ({
    name,
    slug: groupSlug(name),
    count: membersStore.members.filter(
      (m) => m.churchGroups?.includes(name) && m.status !== 'Pending'
    ).length,
  }))
)
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="group in groupCards"
        :key="group.name"
        :to="`/admin/groups/${group.slug}`"
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-gray-900">
              {{ group.name }}
            </h3>

            <p class="mt-1 text-sm text-gray-500">
              {{ group.count }} membro{{ group.count === 1 ? '' : 's' }}
            </p>
          </div>

          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Icon icon="mdi:account-group-outline" class="text-xl text-blue-600" />
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
