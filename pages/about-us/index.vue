<script setup lang="ts">
definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})

useSeoMeta({
  title: 'Sobre Nós — ICFR Família Redimida',

  description:
    'Conheça a história, a missão, a liderança, as atividades e as congregações da ICFR Família Redimida.',

  ogTitle: 'Sobre Nós — ICFR Família Redimida',

  ogDescription:
    'ICFR Família Redimida — Resgatando vidas para Cristo.',

  ogImage: '',
})
</script>

<template>
  <div>
    <AboutHero />

    <ChurchHistoryCard />

    <WorshipActivities />

    <ChurchLeaders />

    <ActivityCalendar />

    <WorshipThisSunday />
  </div>
</template>