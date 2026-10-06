<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const store = usePublicTeachingsStore()

const activeFilter = ref('All Sermons')
const searchQuery = ref('')

const filterTags = [
  'All Sermons',
  'Church',
  'Faith',
  'Foundation',
  'Baptism',
  'Salvation',
  'Scripture',
  'Gospel',
  'Grace',
]

const filterLabels: Record<string, string> = {
  'All Sermons': 'Todos os Sermões',
  Church: 'Igreja',
  Faith: 'Fé',
  Foundation: 'Fundamentos',
  Baptism: 'Batismo',
  Salvation: 'Salvação',
  Scripture: 'Escrituras',
  Gospel: 'Evangelho',
  Grace: 'Graça',
}

watch(activeFilter, (v) => {
  store.setFilter(v === 'All Sermons' ? 'All' : v)
})

watch(searchQuery, (v) => {
  store.setSearch(v)
})

const displayedCount = ref(9)

const paginated = computed(() =>
  store.filteredSermons.slice(0, displayedCount.value)
)

const hasMore = computed(
  () => store.filteredSermons.length > displayedCount.value
)

function loadMore() {
  displayedCount.value += 6
}

useSeoMeta({
  title: 'Sermões — ICFR Família Redimida',
  description:
    'Acompanhe sermões, mensagens e pregações bíblicas da ICFR Família Redimida.',
  ogTitle: 'Sermões — ICFR Família Redimida',
  ogDescription:
    'Mensagens bíblicas para edificação, crescimento espiritual e fortalecimento da fé.',
  ogImage: '/images/heroImg.png',
})
</script>

<template>
  <div class="pt-16">
    <!-- Banner -->
    <section
      class="relative overflow-hidden bg-[#1E3A5F] py-20"
    >
      <img
        src="https://picsum.photos/seed/sermons-banner/1920/600"
        alt="Sermões da ICFR Família Redimida"
        class="absolute inset-0 h-full w-full object-cover opacity-20"
        loading="lazy"
      />

      <div
        class="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
      >
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-200"
        >
          Ensinamentos
        </p>

        <h1
          class="font-serif text-5xl font-bold drop-shadow-lg md:text-6xl"
        >
          Sermões
        </h1>

        <p
          class="mx-auto mt-4 max-w-2xl text-lg text-white/70"
        >
          Mensagens bíblicas para edificação, fortalecimento da fé e crescimento espiritual.
        </p>
      </div>
    </section>

    <div
      class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <!-- Filtros -->
      <div class="mb-3">
        <TagFilterBar
          :tags="filterTags"
          :active="activeFilter"
          @update:active="activeFilter = $event"
        />
      </div>

      <!-- Legenda dos filtros -->
      <div class="mb-5 flex flex-wrap gap-2">
        <span
          v-for="tag in filterTags"
          :key="tag"
          class="text-xs text-gray-400"
        >
          {{ filterLabels[tag] ?? tag }}
        </span>
      </div>

      <!-- Pesquisa -->
      <div
        class="mb-8 flex max-w-md items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
      >
        <Icon
          icon="heroicons:magnifying-glass"
          class="h-5 w-5 shrink-0 text-gray-400"
        />

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Pesquisar sermões..."
          class="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          aria-label="Pesquisar sermões"
        />
      </div>

      <!-- Lista -->
      <div
        v-if="paginated.length"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ContentCard
          v-for="sermon in paginated"
          :key="sermon.id"
          :thumbnail="sermon.thumbnailSrc"
          :tags="sermon.tags"
          :title="sermon.title"
          :author="sermon.preacher"
          :date="sermon.date"
          :slug="sermon.slug"
          type="sermon"
        />
      </div>

      <EmptyState
        v-else-if="store.sermons.length"
        icon="heroicons:microphone-slash"
        title="Nenhum sermão encontrado"
        description="Tente outro termo de pesquisa ou outro filtro."
      />

      <EmptyState
        v-else
        icon="heroicons:microphone-slash"
        title="Ainda não existem sermões publicados"
        description="Os sermões aparecerão aqui depois de serem publicados no painel administrativo."
      />

      <!-- Carregar mais -->
      <div
        v-if="hasMore"
        class="mt-10 text-center"
      >
        <button
          class="rounded-full border border-[#2563EB] px-8 py-3 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-blue-50"
          aria-label="Carregar mais sermões"
          @click="loadMore"
        >
          Carregar Mais Sermões
        </button>
      </div>
    </div>

    <!-- CTA -->
    <section class="bg-[#1E3A5F] py-14">
      <div
        class="mx-auto max-w-4xl px-6 text-center text-white"
      >
        <h2
          class="mb-3 font-serif text-3xl font-bold"
        >
          Quer aprofundar o estudo da Bíblia?
        </h2>

        <p
          class="mx-auto mb-8 max-w-xl text-white/70"
        >
          Explore os nossos estudos bíblicos e conteúdos de ensino da Palavra de Deus.
        </p>

        <NuxtLink
          to="/teachings/sunday-school"
          class="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          aria-label="Ver estudos bíblicos"
        >
          Ver Estudos Bíblicos

          <Icon
            icon="heroicons:arrow-right"
            class="h-4 w-4"
          />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>