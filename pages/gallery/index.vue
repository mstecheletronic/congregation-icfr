<script setup lang="ts">
useSeoMeta({
  title: 'Galeria — ICFR Família Redimida',
  description: 'Momentos de fé, comunhão e adoração da ICFR Família Redimida.',
})

const photos = Array.from(
  { length: 18 },
  (_, index) => `/images/gallery/icfr-${String(index + 1).padStart(2, '0')}.jpg`
)

const selectedPhoto = ref<string | null>(null)
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <section class="bg-[#1E3A5F] py-16 text-white">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">
          ICFR Família Redimida
        </p>

        <h1 class="mt-3 text-4xl font-bold sm:text-5xl">Nossa Galeria</h1>

        <p class="mx-auto mt-4 max-w-2xl text-blue-100">
          Momentos de fé, adoração, ensino, celebração e comunhão da nossa família.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="photo in photos"
          :key="photo"
          type="button"
          class="group overflow-hidden rounded-2xl bg-white shadow-sm"
          @click="selectedPhoto = photo"
        >
          <img
            :src="photo"
            alt="Momento da ICFR Família Redimida"
            class="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="selectedPhoto"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        @click.self="selectedPhoto = null"
      >
        <button
          type="button"
          class="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          aria-label="Fechar"
          @click="selectedPhoto = null"
        >
          <Icon icon="mdi:close" />
        </button>

        <img
          :src="selectedPhoto"
          alt="Fotografia ampliada da ICFR Família Redimida"
          class="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
        />
      </div>
    </Teleport>
  </main>
</template>
