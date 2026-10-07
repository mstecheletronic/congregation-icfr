<script setup lang="ts">
const photos = [
  '/images/gallery/icfr-01.jpg',
  '/images/gallery/icfr-02.jpg',
  '/images/gallery/icfr-03.jpg',
  '/images/gallery/icfr-04.jpg',
  '/images/gallery/icfr-05.jpg',
  '/images/gallery/icfr-06.jpg',
]
</script>

<template>
  <section class="bg-white py-16 lg:py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
          Nossa Comunidade
        </p>

        <h2 class="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">Nossa Família em Comunhão</h2>

        <p class="mt-4 text-gray-600">
          Momentos de fé, adoração, ensino e comunhão na ICFR Família Redimida.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
        <div
          v-for="(photo, index) in photos"
          :key="photo"
          :class="[
            'overflow-hidden rounded-2xl bg-gray-100',
            index === 0 || index === 5 ? 'md:row-span-2' : '',
          ]"
        >
          <img
            :src="photo"
            alt="Momento da ICFR Família Redimida"
            class="h-full min-h-[220px] w-full object-cover transition duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink
          to="/gallery"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Ver Galeria Completa
          <Icon icon="mdi:arrow-right" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
