<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Estúdio ICFR — Transmissão ao Vivo',
})

const route = useRoute()
const store = usePublicLiveStreamStore()
const { setHeader } = usePageHeader()

const videoElement = ref<HTMLVideoElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)

const cameraEnabled = ref(true)
const microphoneEnabled = ref(true)

const mediaError = ref('')
const activating = ref(false)

const streamId = computed(() => String(route.params.id))

const live = computed(() => {
  if (store.currentStream?.id === streamId.value) {
    return store.currentStream
  }

  return null
})

onMounted(async () => {
  setHeader('Estúdio ICFR', 'Prepare a câmera e o microfone para a transmissão')

  await store.load(true)
})

async function enableCamera() {
  mediaError.value = ''
  activating.value = true

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    mediaStream.value = stream

    if (videoElement.value) {
      videoElement.value.srcObject = stream
    }

    cameraEnabled.value = true
    microphoneEnabled.value = true
  } catch (error) {
    console.error(error)

    mediaError.value =
      'Não foi possível acessar a câmera ou o microfone. Verifique as permissões do navegador.'
  } finally {
    activating.value = false
  }
}

function toggleCamera() {
  const track = mediaStream.value?.getVideoTracks()[0]

  if (!track) return

  track.enabled = !track.enabled
  cameraEnabled.value = track.enabled
}

function toggleMicrophone() {
  const track = mediaStream.value?.getAudioTracks()[0]

  if (!track) return

  track.enabled = !track.enabled
  microphoneEnabled.value = track.enabled
}

function stopMedia() {
  mediaStream.value?.getTracks().forEach((track) => track.stop())

  mediaStream.value = null

  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
}

onBeforeUnmount(() => {
  stopMedia()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card v-if="store.loading">
      <LoadingState title="Abrindo Estúdio ICFR..." />
    </Card>

    <Card v-else-if="!live">
      <EmptyState
        icon="mdi:video-off-outline"
        title="Transmissão não encontrada"
        description="Esta transmissão não está mais ativa."
      />
    </Card>

    <template v-else>
      <!-- Informações -->
      <Card>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div
              class="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600"
            >
              <span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>

              ESTÚDIO AO VIVO
            </div>

            <h1 class="text-xl font-bold text-gray-900">
              {{ live.title }}
            </h1>

            <p class="mt-1 text-sm text-gray-500">
              {{ live.preacher }}
              ·
              {{ live.congregation }}
            </p>

            <p v-if="live.roomName" class="mt-2 text-xs text-gray-400">Sala: {{ live.roomName }}</p>
          </div>

          <NuxtLink
            to="/admin/live-streams"
            class="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Voltar às transmissões
          </NuxtLink>
        </div>
      </Card>

      <!-- Estúdio -->
      <div class="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <div class="relative aspect-video overflow-hidden rounded-2xl bg-[#07111f]">
            <video
              ref="videoElement"
              autoplay
              muted
              playsinline
              class="h-full w-full object-cover"
            ></video>

            <div
              v-if="!mediaStream"
              class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <Icon icon="mdi:video-outline" class="h-10 w-10 text-white" />
              </div>

              <h2 class="text-xl font-bold text-white">Prepare sua transmissão</h2>

              <p class="mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Ative a câmera e o microfone para visualizar como o culto aparecerá na transmissão.
              </p>

              <button
                class="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                :disabled="activating"
                @click="enableCamera"
              >
                <Icon
                  :icon="activating ? 'mdi:loading' : 'mdi:camera-outline'"
                  :class="['h-5 w-5', activating && 'animate-spin']"
                />

                {{ activating ? 'Ativando...' : 'Ativar Câmera e Microfone' }}
              </button>
            </div>
          </div>

          <p v-if="mediaError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {{ mediaError }}
          </p>

          <!-- Controles -->
          <div v-if="mediaStream" class="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
              :title="microphoneEnabled ? 'Desligar microfone' : 'Ligar microfone'"
              @click="toggleMicrophone"
            >
              <Icon
                :icon="microphoneEnabled ? 'mdi:microphone' : 'mdi:microphone-off'"
                class="h-6 w-6"
              />
            </button>

            <button
              class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
              :title="cameraEnabled ? 'Desligar câmera' : 'Ligar câmera'"
              @click="toggleCamera"
            >
              <Icon :icon="cameraEnabled ? 'mdi:video' : 'mdi:video-off'" class="h-6 w-6" />
            </button>

            <button
              class="flex h-12 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
              @click="stopMedia"
            >
              <Icon icon="mdi:phone-hangup" class="h-5 w-5" />

              Parar câmera
            </button>
          </div>
        </Card>

        <!-- Painel lateral -->
        <Card>
          <h2 class="font-semibold text-gray-900">Estado da transmissão</h2>

          <div class="mt-5 space-y-4">
            <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <span class="text-sm text-gray-600"> Câmera </span>

              <span
                :class="cameraEnabled && mediaStream ? 'text-green-600' : 'text-gray-400'"
                class="text-xs font-semibold"
              >
                {{ cameraEnabled && mediaStream ? 'Ativa' : 'Desligada' }}
              </span>
            </div>

            <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <span class="text-sm text-gray-600"> Microfone </span>

              <span
                :class="microphoneEnabled && mediaStream ? 'text-green-600' : 'text-gray-400'"
                class="text-xs font-semibold"
              >
                {{ microphoneEnabled && mediaStream ? 'Ativo' : 'Desligado' }}
              </span>
            </div>

            <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <span class="text-sm text-gray-600"> Sala </span>

              <span class="text-xs font-semibold text-blue-600"> Criada </span>
            </div>
          </div>

          <div class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div class="flex gap-3">
              <Icon icon="mdi:information-outline" class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <p class="text-xs leading-relaxed text-amber-800">
                Esta fase mostra a pré-visualização da câmera. A próxima fase conecta esta sala ao
                servidor de transmissão para os membros assistirem em tempo real.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
