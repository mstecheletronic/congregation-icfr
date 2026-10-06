export function useLiveStreams() {
  const store = usePublicLiveStreamStore()

  return {
    isLive: computed(() => store.isLive),
    currentStream: computed(() => store.currentStream),
    recordedStreams: computed(() => store.recordedStreams),
    filteredRecorded: computed(() => store.filteredRecorded),
    activeTab: computed(() => store.activeTab),

    searchQuery: computed({
      get: () => store.searchQuery,
      set: (value: string) => store.setSearch(value),
    }),

    activityFilter: computed({
      get: () => store.activityFilter,
      set: (value: string) => store.setFilter(value),
    }),

    loading: computed(() => store.loading),
    saving: computed(() => store.saving),

    load: (force = false) => store.load(force),

    setTab: (tab: 'live' | 'recorded') =>
      store.setTab(tab),
  }
}
