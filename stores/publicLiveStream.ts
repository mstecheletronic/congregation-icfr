import { defineStore } from 'pinia'
import { useLiveStreamsRepository } from '~/repositories/liveStreamsRepository'

import type {
  LiveStream,
  RecordedStream,
} from '~/types/public'

export const usePublicLiveStreamStore = defineStore(
  'publicLiveStream',
  () => {
    const currentStream = ref<LiveStream | null>(null)
    const recordedStreams = ref<RecordedStream[]>([])

    const activeTab = ref<'live' | 'recorded'>('live')
    const searchQuery = ref('')
    const activityFilter = ref('All Church Activities')

    const loading = ref(false)
    const saving = ref(false)
    const loaded = ref(false)
    const error = ref<string | null>(null)

    const isLive = computed(
      () => currentStream.value !== null
    )

    const filteredRecorded = computed(() => {
      let items = [...recordedStreams.value]

      if (
        activityFilter.value !==
        'All Church Activities'
      ) {
        items = items.filter(
          (stream) =>
            stream.serviceType.toLowerCase() ===
            activityFilter.value.toLowerCase()
        )
      }

      if (searchQuery.value.trim()) {
        const q = searchQuery.value
          .trim()
          .toLowerCase()

        items = items.filter(
          (stream) =>
            stream.title.toLowerCase().includes(q) ||
            stream.preacher.toLowerCase().includes(q)
        )
      }

      return items
    })

    async function load(force = false) {
      if (loaded.value && !force) return

      loading.value = true
      error.value = null

      try {
        const repo = useLiveStreamsRepository()
        const data = await repo.fetchStreams()

        currentStream.value = data.current
        recordedStreams.value = data.recorded
        loaded.value = true
      } catch (e: unknown) {
        error.value =
          e instanceof Error
            ? e.message
            : 'Erro ao carregar transmissões'

        useToast().error(error.value)
      } finally {
        loading.value = false
      }
    }

    async function startLive(
      payload: Omit<LiveStream, 'id'>
    ) {
      if (currentStream.value) {
        useToast().error(
          'Já existe uma transmissão ao vivo ativa.'
        )
        return
      }

      saving.value = true
      error.value = null

      try {
        const created =
          await useLiveStreamsRepository().createLive(
            payload
          )

        currentStream.value = created

        useToast().success(
          'Transmissão publicada com sucesso.'
        )

        return created
      } catch (e: unknown) {
        error.value =
          e instanceof Error
            ? e.message
            : 'Erro ao iniciar transmissão'

        useToast().error(error.value)
        throw e
      } finally {
        saving.value = false
      }
    }

    async function endCurrentLive() {
      const live = currentStream.value

      if (!live) return

      saving.value = true
      error.value = null

      try {
        const today = new Date()
          .toISOString()
          .slice(0, 10)

        const slug =
          live.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') +
          '-' +
          Date.now()

        const recorded: Omit<
          RecordedStream,
          'id'
        > = {
          title: live.title,
          serviceType: live.serviceType,
          preacher: live.preacher,
          date: today,
          duration: '—',
          views: live.viewerCount || 0,
          thumbnailSrc: live.thumbnailSrc,
          slug,
          videoSrc: live.videoUrl,
          congregation: live.congregation,
          city: live.city,
        }

        await useLiveStreamsRepository().finishLive(
          live.id,
          recorded,
          live.startedAt
        )

        recordedStreams.value.unshift({
          ...recorded,
          id: live.id,
        })

        currentStream.value = null

        useToast().success(
          'Transmissão encerrada e enviada para as gravações.'
        )

      } catch (e: unknown) {
        error.value =
          e instanceof Error
            ? e.message
            : 'Erro ao encerrar transmissão'

        useToast().error(error.value)
        throw e
      } finally {
        saving.value = false
      }
    }

    async function deleteRecordedStream(id: string) {
      saving.value = true

      try {
        await useLiveStreamsRepository().deleteStream(id)

        recordedStreams.value =
          recordedStreams.value.filter(
            (stream) => stream.id !== id
          )

        useToast().success(
          'Gravação eliminada.'
        )
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : 'Erro ao eliminar gravação'

        useToast().error(message)
        throw e
      } finally {
        saving.value = false
      }
    }

    function setTab(tab: 'live' | 'recorded') {
      activeTab.value = tab
    }

    function setFilter(filter: string) {
      activityFilter.value = filter
    }

    function setSearch(q: string) {
      searchQuery.value = q
    }

    return {
      currentStream,
      recordedStreams,
      filteredRecorded,
      activeTab,
      searchQuery,
      activityFilter,
      loading,
      saving,
      loaded,
      error,
      isLive,
      load,
      startLive,
      endCurrentLive,
      deleteRecordedStream,
      setTab,
      setFilter,
      setSearch,
    }
  }
)
