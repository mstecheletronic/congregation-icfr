<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'ICFR Família Redimida — Resgatando vidas para Cristo',
  description:
    'Bem-vindo à ICFR Família Redimida. Acompanhe cultos, ensinamentos, eventos, congregações e atividades da igreja.',
  ogTitle: 'ICFR Família Redimida',
  ogDescription:
    'ICFR Família Redimida — Resgatando vidas para Cristo.',
  ogImage: '/images/heroImg.png',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ICFR Família Redimida',
        description:
          'Igreja cristã comprometida com a proclamação do Evangelho e com a transformação de vidas.',
        email: 'igrejafamiliaredmida@gmail.com',
        telephone: '+258845211814',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Beira',
          addressRegion: 'Sofala',
          addressCountry: 'MZ',
        },
      }),
    },
  ],
})
</script>

<template>
  <div>
    <HeroBanner />

    <MinisterWelcome />

    <LiveStreamTeaser />

    <CongregationSearch />

    <SermonsTeaser />

    <EventsList />

    <ContactForm />

    <PhotoGallery />
  </div>
</template>