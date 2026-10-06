<script setup lang="ts">
const eventsStore = useEventsStore()

onMounted(() => {
  eventsStore.load()
})

const events = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return [...eventsStore.upcomingEvents]
    .filter((event) => {
      const date = new Date(event.date)
      date.setHours(0, 0, 0, 0)
      return date >= now
    })
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    .slice(0, 4)
})

function dayOf(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
  })
}

function monthOf(date: string) {
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString('pt-PT', {
      month: 'short',
    })
    .replace('.', '')
    .toUpperCase()
}

const { el: sectionRef, isVisible } = useScrollReveal()
</script>

<template>
  <section
    id="events"
    ref="sectionRef"
    class="bg-[#F8F9FA] py-20"
  >
    <div
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div
        :class="[
          'mb-10 flex items-end justify-between',
          'reveal',
          isVisible && 'is-visible',
        ]"
      >
        <SectionHeader
          title="Próximos Eventos"
          subtitle="Acompanhe os próximos cultos, programas e atividades da ICFR Família Redimida."
        />

        <NuxtLink
          to="/events"
          class="hidden shrink-0 items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline sm:flex"
          aria-label="Ver todos os eventos"
        >
          Ver Todos os Eventos

          <Icon
            icon="heroicons:arrow-right"
            class="h-4 w-4"
          />
        </NuxtLink>
      </div>

      <LoadingState
        v-if="eventsStore.loading"
        title="Carregando eventos..."
      />

      <EmptyState
        v-else-if="!events.length"
        icon="mdi:calendar-blank-outline"
        title="Nenhum evento próximo"
        description="Os próximos eventos publicados pela administração aparecerão aqui."
      />

      <div
        v-else
        class="flex flex-col gap-4"
      >
        <div
          v-for="(event, i) in events"
          :key="event.id"
          :class="[
            'reveal',
            isVisible && 'is-visible',
          ]"
          :style="{
            transitionDelay: `${100 + i * 90}ms`,
          }"
        >
          <div
            class="flex items-center gap-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <!-- Data -->
            <div
              class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#2563EB] text-white"
            >
              <span
                class="text-xl font-bold leading-none"
              >
                {{ dayOf(event.date) }}
              </span>

              <span
                class="text-xs font-semibold tracking-wider"
              >
                {{ monthOf(event.date) }}
              </span>
            </div>

            <!-- Informações -->
            <div
              class="min-w-0 flex-1"
            >
              <h3
                class="font-semibold leading-snug text-[#1E3A5F]"
              >
                {{ event.title }}
              </h3>

              <div
                class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
              >
                <span
                  class="flex items-center gap-1"
                >
                  <Icon
                    icon="heroicons:map-pin"
                    class="h-3.5 w-3.5 shrink-0"
                  />

                  {{ event.venue }}
                </span>

                <span
                  class="flex items-center gap-1"
                >
                  <Icon
                    icon="heroicons:clock"
                    class="h-3.5 w-3.5 shrink-0"
                  />

                  {{ event.time }}
                </span>
              </div>
            </div>

            <!-- Detalhes -->
            <NuxtLink
              to="/events"
              class="shrink-0 rounded-full border border-[#2563EB] px-4 py-1.5 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-blue-50"
              :aria-label="`Ver detalhes de ${event.title}`"
            >
              Detalhes
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Botão mobile -->
      <div
        v-if="events.length"
        class="mt-6 sm:hidden"
      >
        <NuxtLink
          to="/events"
          class="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB]"
        >
          Ver Todos os Eventos

          <Icon
            icon="heroicons:arrow-right"
            class="h-4 w-4"
          />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>