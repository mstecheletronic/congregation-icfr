<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Transmissões ao Vivo — ICFR Família Redimida',
})

const { setHeader } = usePageHeader()
const store = usePublicLiveStreamStore()

const form = reactive({
  title: '',
  serviceType: 'Sunday Worship',
  preacher: '',
  congregation: 'ICFR Família Redimida',
  city: 'Beira',
  videoUrl: '',
  thumbnailSrc: '',
})

const errors = reactive({
  title: '',
  preacher: '',
  videoUrl: '',
})

const serviceOptions = [
  {
    label: 'Culto de Celebração',
    value: 'Sunday Worship',
  },
  {
    label: 'Culto de Ensino',
    value: 'Bible Class',
  },
  {
    label: 'Escola Dominical',
    value: 'Sunday School',
  },
  {
    label: 'Evangelismo',
    value: 'Evangelism',
  },
]

onMounted(() => {
  store.load()

  setHeader(
    'Transmissões ao Vivo',
    'Publique e gerencie os cultos ao vivo da ICFR Família Redimida'
  )
})

async function publishLive() {
  errors.title = form.title.trim()
    ? ''
    : 'O título é obrigatório'

  errors.preacher = form.preacher.trim()
    ? ''
    : 'O nome do pregador é obrigatório'

  errors.videoUrl = form.videoUrl.trim()
    ? ''
    : 'O link da transmissão é obrigatório'

  if (
    errors.title ||
    errors.preacher ||
    errors.videoUrl
  ) {
    return
  }

  await store.startLive({
    title: form.title.trim(),
    serviceType: form.serviceType,
    preacher: form.preacher.trim(),
    congregation: form.congregation.trim(),
    city: form.city.trim(),
    videoUrl: form.videoUrl.trim(),
    thumbnailSrc: form.thumbnailSrc.trim(),
    viewerCount: 0,
    startedAt: new Date().toISOString(),
  })

  form.title = ''
  form.preacher = ''
  form.videoUrl = ''
  form.thumbnailSrc = ''
}

async function finishLive() {
  await store.endCurrentLive()
}

async function removeRecording(id: string) {
  await store.deleteRecordedStream(id)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card v-if="store.currentStream">
      <div
        class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600"
          >
            <span
              class="h-2 w-2 rounded-full bg-red-500 animate-pulse"
            />

            AO VIVO
          </div>

          <h2
            class="text-xl font-bold text-gray-900"
          >
            {{ store.currentStream.title }}
          </h2>

          <p
            class="mt-1 text-sm text-gray-500"
          >
            {{ store.currentStream.preacher }}
            ·
            {{ store.currentStream.congregation }}
          </p>

          <a
            :href="store.currentStream.videoUrl"
            target="_blank"
            rel="noopener"
            class="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            Abrir transmissão
          </a>
        </div>

        <Button
          :loading="store.saving"
          variant="secondary"
          @click="finishLive"
        >
          <template #icon-left>
            <Icon icon="mdi:stop-circle-outline" />
          </template>

          Encerrar e Arquivar
        </Button>
      </div>
    </Card>

    <Card v-else>
      <div class="mb-5">
        <h2
          class="text-base font-semibold text-gray-900"
        >
          Nova Transmissão
        </h2>

        <p
          class="mt-1 text-sm text-gray-500"
        >
          Cole o link da transmissão do YouTube, Facebook ou outra plataforma.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <Input
          v-model="form.title"
          label="Título"
          placeholder="Ex.: Culto de Celebração"
          :error="errors.title"
        />

        <Select
          v-model="form.serviceType"
          label="Tipo de Culto"
          :options="serviceOptions"
        />

        <Input
          v-model="form.preacher"
          label="Pregador"
          placeholder="Nome do pregador"
          :error="errors.preacher"
        />

        <Input
          v-model="form.congregation"
          label="Congregação"
          placeholder="ICFR Família Redimida"
        />

        <Input
          v-model="form.city"
          label="Cidade"
          placeholder="Beira"
        />

        <Input
          v-model="form.videoUrl"
          label="Link da Transmissão"
          placeholder="https://youtube.com/..."
          :error="errors.videoUrl"
        />

        <div class="md:col-span-2">
          <ImageUpload
            v-model="form.thumbnailSrc"
            label="Imagem da Transmissão"
            folder="congregation/live-streams"
          />
        </div>
      </div>

      <div
        class="mt-5 flex justify-end"
      >
        <Button
          :loading="store.saving"
          @click="publishLive"
        >
          <template #icon-left>
            <Icon icon="mdi:broadcast" />
          </template>

          Publicar Live
        </Button>
      </div>
    </Card>

    <Card>
      <div class="mb-4">
        <h2
          class="text-base font-semibold text-gray-900"
        >
          Transmissões Anteriores
        </h2>
      </div>

      <LoadingState
        v-if="store.loading"
        title="Carregando transmissões..."
      />

      <EmptyState
        v-else-if="!store.recordedStreams.length"
        icon="mdi:video-outline"
        title="Ainda não existem gravações"
        description="As transmissões encerradas aparecerão aqui automaticamente."
      />

      <div
        v-else
        class="divide-y divide-gray-100"
      >
        <div
          v-for="stream in store.recordedStreams"
          :key="stream.id"
          class="flex items-center justify-between gap-4 py-4"
        >
          <div class="min-w-0">
            <p
              class="truncate font-medium text-gray-900"
            >
              {{ stream.title }}
            </p>

            <p
              class="text-xs text-gray-500"
            >
              {{ stream.preacher }}
              ·
              {{ stream.date }}
            </p>
          </div>

          <div
            class="flex items-center gap-2"
          >
            <a
              v-if="stream.videoSrc"
              :href="stream.videoSrc"
              target="_blank"
              rel="noopener"
              class="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
              :aria-label="`Assistir ${stream.title}`"
            >
              <Icon icon="mdi:play-circle-outline" />
            </a>

            <button
              class="rounded-lg p-2 text-red-500 hover:bg-red-50"
              :disabled="store.saving"
              :aria-label="`Eliminar ${stream.title}`"
              @click="removeRecording(stream.id)"
            >
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
