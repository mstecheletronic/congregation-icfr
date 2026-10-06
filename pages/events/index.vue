<script setup lang="ts">
definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})

useSeoMeta({
  title: 'Eventos — ICFR Família Redimida',
  description:
    'Acompanhe os próximos eventos, cultos e atividades da ICFR Família Redimida.',
  ogTitle: 'Eventos — ICFR Família Redimida',
  ogDescription:
    'Veja os próximos eventos e atividades da ICFR Família Redimida — Resgatando vidas para Cristo.',
})

const route = useRoute()
const eventsStore = useEventsStore()

onMounted(() => {
  eventsStore.load()

  const tab = route.query.tab as string

  if (tab === 'past' || tab === 'upcoming') {
    eventsStore.setTab(tab)
  }
})

watch(
  () => eventsStore.activeTab,
  async (tab) => {
    await navigateTo(
      {
        query: {
          tab,
        },
      },
      {
        replace: true,
      }
    )
  }
)

const activeTab = computed({
  get: () => eventsStore.activeTab,

  set: (v: 'upcoming' | 'past') =>
    eventsStore.setTab(v),
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- Cabeçalho -->
    <div
      class="bg-white border-b border-gray-100 py-8"
    >
      <div
        class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div
          class="mb-1 flex items-center gap-2 text-xs font-medium text-gray-400"
        >
          <NuxtLink
            to="/"
            class="hover:text-blue-600 transition-colors"
          >
            Início
          </NuxtLink>

          <Icon
            icon="mdi:chevron-right"
            class="h-3.5 w-3.5"
          />

          <span class="text-gray-600">
            Eventos
          </span>
        </div>

        <h1
          class="text-2xl font-bold text-gray-900 sm:text-3xl"
        >
          Eventos
        </h1>

        <p
          class="mt-1 text-sm text-gray-500"
        >
          Acompanhe os próximos cultos, programas e atividades da ICFR Família Redimida.
        </p>

        <!-- Programação regular -->
        <div
          class="mt-5 grid gap-3 sm:grid-cols-2"
        >
          <div
            class="rounded-xl border border-blue-100 bg-blue-50 p-4"
          >
            <div
              class="flex items-center gap-2"
            >
              <Icon
                icon="mdi:book-open-page-variant-outline"
                class="text-blue-600"
              />

              <p
                class="font-semibold text-gray-900"
              >
                Culto de Ensino
              </p>
            </div>

            <p
              class="mt-1 text-sm text-gray-600"
            >
              Quinta-feira · 17:30 – 19:30
            </p>
          </div>

          <div
            class="rounded-xl border border-blue-100 bg-blue-50 p-4"
          >
            <div
              class="flex items-center gap-2"
            >
              <Icon
                icon="mdi:church-outline"
                class="text-blue-600"
              />

              <p
                class="font-semibold text-gray-900"
              >
                Culto de Celebração
              </p>
            </div>

            <p
              class="mt-1 text-sm text-gray-600"
            >
              Domingo · 09:30 – 12:00
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <!-- Alternar entre próximos e passados -->
      <div
        class="flex justify-center py-6 md:justify-start"
      >
        <EventTabToggle
          v-model="activeTab"
        />
      </div>

      <Transition
        name="tab-switch"
        mode="out-in"
      >
        <!-- Próximos eventos -->
        <div
          v-if="activeTab === 'upcoming'"
          key="upcoming"
          class="flex flex-col gap-4 md:flex-row md:gap-0"
        >
          <div
            class="w-full md:w-[45%] md:pr-6"
          >
            <UpcomingPreviewPanel />
          </div>

          <div
            class="w-full md:w-[55%] md:border-l md:border-gray-100 md:pl-6"
          >
            <UpcomingEventList />
          </div>
        </div>

        <!-- Eventos passados -->
        <div
          v-else
          key="past"
          class="flex flex-col gap-4 md:flex-row md:gap-0"
        >
          <div
            class="w-full md:w-[45%] md:pr-6"
          >
            <PastEventFeatured />
          </div>

          <div
            class="w-full md:w-[55%] md:border-l md:border-gray-100 md:pl-6"
          >
            <PastEventList />
          </div>
        </div>
      </Transition>
    </div>

    <GalleryLightbox
      :is-open="eventsStore.galleryOpen"
      :images="eventsStore.galleryImages"
      :start-index="eventsStore.galleryStartIndex"
      @close="eventsStore.closeGallery()"
    />
  </div>
</template>

<style scoped>
.tab-switch-enter-active,
.tab-switch-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tab-switch-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>