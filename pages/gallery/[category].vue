<script setup lang="ts">
definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})

const route = useRoute()
const slug = computed(() => route.params.category as string)

const { gallery } = useGalleryData(slug.value)

useSeoMeta({
  title: `${gallery?.title ?? 'Galeria'} — ICFR Família Redimida`,
  description:
    `Veja a galeria ${gallery?.title ?? ''} da ICFR Família Redimida.`,
})

const previewImages = computed(() =>
  (gallery?.images ?? [])
    .slice(0, 2)
    .map((i) => i.src)
)

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxImages = computed(() =>
  (gallery?.images ?? []).map((i) => i.src)
)

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div
    v-if="gallery"
    class="w-full bg-white"
  >
    <!-- Destaque -->
    <GalleryHero
      :category-title="gallery.title"
      :preview-images="previewImages"
    />

    <!-- Galeria -->
    <section class="px-8 py-10">
      <h2
        class="mb-5 text-[20px] font-bold text-gray-900"
      >
        {{ gallery.title }}
      </h2>

      <EmptyState
        v-if="!gallery.images.length"
        icon="mdi:image-multiple-outline"
        title="Ainda não existem fotografias nesta galeria"
        description="As fotografias desta categoria aparecerão aqui depois de serem carregadas."
      />

      <MasonryGrid
        v-else
        :images="gallery.images"
        @image-click="openLightbox"
      />
    </section>

    <!-- Fim da galeria -->
    <div class="the-end-divider">
      <hr />

      <span>— Fim —</span>

      <hr />
    </div>

    <!-- Explorar mais -->
    <ExploreMore />

    <!-- Visualização da imagem -->
    <GalleryLightbox
      :is-open="lightboxOpen"
      :images="lightboxImages"
      :start-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </div>

  <!-- Categoria inexistente -->
  <div
    v-else
    class="mx-auto max-w-3xl px-4 py-24"
  >
    <EmptyState
      icon="mdi:image-off-outline"
      title="Galeria não encontrada"
      description="Esta categoria de galeria não existe."
    >
      <template #action>
        <NuxtLink to="/">
          <Button
            variant="secondary"
            size="sm"
          >
            Voltar ao Início
          </Button>
        </NuxtLink>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.the-end-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 32px 32px;
  max-width: 500px;
  margin: 0 auto;
}

.the-end-divider hr {
  flex: 1;
  border: none;
  border-top: 1px solid #e5e7eb;
}

.the-end-divider span {
  font-size: 13px;
  color: #9ca3af;
  white-space: nowrap;
  font-style: italic;
}
</style>