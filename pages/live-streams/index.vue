<script setup lang="ts">
import type { RecordedStream } from '~/types/public'

definePageMeta({
  layout: 'default',
})

const store = usePublicLiveStreamStore()

const { isLive, currentStream, filteredRecorded, activeTab, setTab } = useLiveStreams()

const searchQuery = ref('')
const activityFilter = ref('All Church Activities')

const activityOptions = [
  'All Church Activities',
  'Sunday Worship',
  'Bible Class',
  'Sunday School',
  'Evangelism',
]

const activityLabels: Record<string, string> = {
  'All Church Activities': 'Todas as Atividades',
  'Sunday Worship': 'Culto de Celebração',
  'Bible Class': 'Culto de Ensino',
  'Sunday School': 'Escola Dominical',
  Evangelism: 'Evangelismo',
}

watch(searchQuery, (v) => {
  store.setSearch(v)
})

watch(activityFilter, (v) => {
  store.setFilter(v)
})

function onWatchRecorded() {
  setTab('recorded')

  nextTick(() => {
    document.getElementById('streams-grid')?.scrollIntoView({
      behavior: 'smooth',
    })
  })
}

// Player das gravações
const playing = ref<RecordedStream | null>(null)

const playerOpen = computed({
  get: () => playing.value !== null,

  set: (open: boolean) => {
    if (!open) {
      playing.value = null
    }
  },
})

const {
  page: streamPage,
  total: streamTotal,
  totalPages: streamTotalPages,
  paginated: pagedStreams,
  rangeStart: streamFrom,
  rangeEnd: streamTo,
} = usePagination(filteredRecorded, 9)

function watchReplay(stream: RecordedStream) {
  playing.value = stream
}

const howToSteps = [
  {
    number: 1,
    title: 'Escolha a transmissão',
    description: 'Quando houver um culto em direto, ele aparecerá automaticamente nesta página.',
  },
  {
    number: 2,
    title: 'Clique para assistir',
    description: 'Use o botão Assistir Agora para entrar na transmissão do culto.',
  },
  {
    number: 3,
    title: 'Participe connosco',
    description: 'Acompanhe a mensagem, louvor, oração e comunhão da ICFR Família Redimida.',
  },
]

useSeoMeta({
  title: 'Cultos ao Vivo — ICFR Família Redimida',

  description: 'Assista aos cultos ao vivo e às transmissões gravadas da ICFR Família Redimida.',

  ogTitle: 'Cultos ao Vivo — ICFR Família Redimida',

  ogDescription:
    'Acompanhe os cultos, ensinamentos e transmissões da ICFR Família Redimida — Resgatando vidas para Cristo.',

  ogImage: '/images/heroImg.png',
})
</script>

<template>
  <div class="bg-white pt-16">
    <!-- Banner -->
    <section
      class="relative min-h-[500px] overflow-hidden bg-cover bg-center py-24"
      style="background-image: url('/images/gallery/icfr-14.jpg')"
    >
      <!-- Overlay azul escuro -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#102A43]/95 via-[#1E3A5F]/82 to-[#102A43]/90"
      ></div>
      <div class="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <div
          class="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EF4444]/20 px-4 py-1.5 border border-[#EF4444]/30"
        >
          <span class="relative flex h-2.5 w-2.5">
            <span
              class="absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75 animate-ping"
            ></span>

            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
          </span>

          <span class="text-xs font-bold text-[#EF4444] tracking-widest uppercase">
            Cultos ao Vivo
          </span>
        </div>

        <h1 class="font-serif text-5xl font-bold drop-shadow-lg md:text-6xl">Cultos ao Vivo</h1>

        <p class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
          Acompanhe os cultos da ICFR Família Redimida ao vivo ou assista às transmissões gravadas.
        </p>

        <!-- Horários -->
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div class="rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
            <p class="text-sm font-semibold">Culto de Ensino</p>

            <p class="text-xs text-white/70">Quinta-feira · 17:30 – 19:30</p>
          </div>

          <div class="rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
            <p class="text-sm font-semibold">Culto de Celebração</p>

            <p class="text-xs text-white/70">Domingo · 09:30 – 12:00</p>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <!-- Pesquisa e filtro -->
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          class="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <Icon icon="heroicons:magnifying-glass" class="h-5 w-5 shrink-0 text-gray-400" />

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquisar transmissões..."
            class="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            aria-label="Pesquisar transmissões"
          />
        </div>

        <select
          v-model="activityFilter"
          class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          aria-label="Filtrar por atividade"
        >
          <option v-for="opt in activityOptions" :key="opt" :value="opt">
            {{ activityLabels[opt] ?? opt }}
          </option>
        </select>
      </div>

      <!-- Abas -->
      <div class="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          :class="[
            'rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            activeTab === 'live'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          aria-label="Ao vivo agora"
          @click="setTab('live')"
        >
          <span class="flex items-center gap-2">
            <span v-if="isLive" class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75 animate-ping"
              ></span>

              <span class="relative inline-flex h-2 w-2 rounded-full bg-[#EF4444]"></span>
            </span>

            Ao Vivo
          </span>
        </button>

        <button
          :class="[
            'rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
            activeTab === 'recorded'
              ? 'bg-white text-[#1E3A5F] shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          aria-label="Gravações"
          @click="setTab('recorded')"
        >
          Gravações
        </button>
      </div>

      <!-- Ao vivo -->
      <div v-if="activeTab === 'live'">
        <div v-if="isLive && currentStream">
          <LiveNowCard :stream="currentStream" />

          <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="font-serif text-xl font-bold text-[#1E3A5F]">
                {{ currentStream.title }}
              </h2>

              <div class="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:calendar" class="h-4 w-4" />

                  {{ formatDate(new Date(), 'full') }}
                </span>
              </div>
            </div>

            <a
              href="#"
              target="_blank"
              rel="noopener"
              class="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              aria-label="Assistir transmissão agora"
            >
              Assistir Agora

              <Icon icon="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
            </a>
          </div>

          <!-- Como assistir -->
          <div class="mt-12">
            <h2 class="font-serif text-2xl font-bold text-[#1E3A5F] mb-8 text-center">
              Como Participar de um Culto ao Vivo
            </h2>

            <HowToSteps :steps="howToSteps" />
          </div>
        </div>

        <EmptyStreamState v-else @watch-recorded="onWatchRecorded" />
      </div>

      <!-- Gravações -->
      <div v-if="activeTab === 'recorded'" id="streams-grid">
        <div v-if="pagedStreams.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StreamCard
            v-for="stream in pagedStreams"
            :key="stream.id"
            :stream="stream"
            @watch="watchReplay"
          />
        </div>

        <Pagination
          v-if="pagedStreams.length"
          v-model:page="streamPage"
          :total-pages="streamTotalPages"
          :total="streamTotal"
          :range-start="streamFrom"
          :range-end="streamTo"
          label="transmissões"
        />

        <EmptyState
          v-else-if="store.recordedStreams.length"
          icon="heroicons:video-camera-slash"
          title="Nenhuma transmissão encontrada"
          description="Tente pesquisar outro termo ou alterar o filtro."
        />

        <EmptyState
          v-else
          icon="heroicons:video-camera-slash"
          title="Ainda não existem transmissões gravadas"
          description="Os cultos gravados aparecerão aqui depois de serem publicados."
        />
      </div>
    </div>

    <!-- Player -->
    <Modal v-model="playerOpen" :title="playing?.title" size="xl">
      <VideoPlayer
        v-if="playing?.videoSrc"
        :src="playing.videoSrc"
        :thumbnail="playing.thumbnailSrc"
        :title="playing.title"
      />

      <p class="mt-3 text-xs text-gray-500">
        {{ activityLabels[playing?.serviceType ?? ''] ?? playing?.serviceType }}
        ·
        {{ playing?.preacher }}
        ·
        {{ playing?.duration }}
      </p>
    </Modal>
  </div>
</template>
