<script setup lang="ts">
definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})

useSeoMeta({
  title: 'Plano de Deus para a Salvação — ICFR Família Redimida',
  description:
    'Conheça os passos apresentados nesta página sobre o plano de Deus para a salvação: ouvir o Evangelho, crer, arrepender-se, confessar Cristo e ser batizado.',
  ogTitle: 'Plano de Deus para a Salvação — ICFR Família Redimida',
  ogDescription:
    'ICFR Família Redimida — Resgatando vidas para Cristo.',
})

interface Step {
  id: string
  order: string
  number: number
  title: string
  scripture: string
  body: string
}

/*
 * Mantemos os mesmos IDs porque outras partes do site
 * podem apontar diretamente para estas secções:
 *
 * /salvation#hear
 * /salvation#believe
 * /salvation#repent
 * /salvation#confess
 * /salvation#baptized
 */

const steps: Step[] = [
  {
    id: 'hear',
    order: 'Primeiro',
    number: 1,
    title: 'Ouvir o Evangelho',
    scripture: 'Romanos 10:17',
    body:
      'A caminhada começa ao ouvir a mensagem do Evangelho e conhecer aquilo que a Palavra de Deus ensina sobre Jesus Cristo.',
  },
  {
    id: 'believe',
    order: 'Segundo',
    number: 2,
    title: 'Crer no Evangelho',
    scripture: 'Marcos 16:16',
    body:
      'Depois de ouvir a mensagem, somos chamados a crer em Jesus Cristo e confiar na mensagem do Evangelho.',
  },
  {
    id: 'repent',
    order: 'Terceiro',
    number: 3,
    title: 'Arrepender-se',
    scripture: 'Atos 2:38',
    body:
      'O arrependimento envolve reconhecer o pecado e decidir abandonar caminhos contrários à vontade de Deus.',
  },
  {
    id: 'confess',
    order: 'Quarto',
    number: 4,
    title: 'Confessar Cristo',
    scripture: 'Romanos 10:9-10',
    body:
      'A fé em Jesus Cristo também é expressa através da confissão, reconhecendo publicamente a nossa fé nele.',
  },
  {
    id: 'baptized',
    order: 'Quinto',
    number: 5,
    title: 'Ser Batizado',
    scripture: 'Atos 22:16',
    body:
      'O batismo é apresentado nesta caminhada de fé como um passo de obediência e compromisso com Cristo.',
  },
]

const settingsStore = useChurchSettingsStore()

onMounted(() => {
  settingsStore.load()
})
</script>

<template>
  <div>
    <!-- Destaque -->
    <div
      class="relative h-[220px] w-full overflow-hidden bg-[#1E3A5F] md:h-[300px]"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#1E3A5F] to-[#026AA2]"
      ></div>

      <div
        class="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
      >
        <p
          class="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-200"
        >
          Atos 2:36-38
        </p>

        <h1
          class="font-serif text-4xl font-bold text-white md:text-5xl"
        >
          Plano de Deus para a Salvação
        </h1>

        <p
          class="mt-3 max-w-2xl text-base font-light text-white/80 md:text-lg"
        >
          Conheça os passos apresentados nesta página sobre a caminhada de fé em Jesus Cristo.
        </p>
      </div>
    </div>

    <!-- Introdução -->
    <section class="border-b border-gray-100 bg-white py-10">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p
          class="text-sm leading-relaxed text-gray-600 md:text-base"
        >
          Na ICFR Família Redimida acreditamos na importância de conhecer a Palavra de Deus
          e compreender a mensagem do Evangelho de Jesus Cristo.
        </p>
      </div>
    </section>

    <!-- Passos -->
    <section class="bg-gray-50 py-16">
      <div
        class="mx-auto max-w-3xl px-4 sm:px-6"
      >
        <div class="mb-10 text-center">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-blue-600"
          >
            Caminho da Fé
          </p>

          <h2
            class="mt-2 font-serif text-3xl font-bold text-[#1E3A5F]"
          >
            Cinco passos apresentados nesta página
          </h2>
        </div>

        <ol class="flex flex-col gap-6">
          <li
            v-for="step in steps"
            :id="step.id"
            :key="step.id"
            class="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"
          >
            <div
              class="flex items-start gap-4"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700"
                aria-hidden="true"
              >
                {{ step.number }}
              </span>

              <div class="min-w-0">
                <p
                  class="text-xs font-semibold uppercase tracking-widest text-blue-600"
                >
                  {{ step.order }} · {{ step.scripture }}
                </p>

                <h2
                  class="mt-1 font-serif text-2xl font-bold text-[#1E3A5F]"
                >
                  {{ step.title }}
                </h2>

                <p
                  class="mt-3 leading-relaxed text-gray-600"
                >
                  {{ step.body }}
                </p>
              </div>
            </div>
          </li>
        </ol>

        <!-- Contacto -->
        <div
          class="mt-10 rounded-2xl bg-[#F8FAFC] p-6 text-center md:p-8"
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50"
          >
            <Icon
              icon="mdi:bible"
              class="text-2xl text-blue-700"
            />
          </div>

          <h2
            class="font-serif text-2xl font-bold text-[#1E3A5F]"
          >
            Deseja conversar sobre a sua fé?
          </h2>

          <p
            class="mx-auto mt-2 max-w-xl text-gray-600"
          >
            Entre em contacto com a ICFR Família Redimida pelo telefone
            {{ settingsStore.settings.phone }}
            ou pelo email
            {{ settingsStore.settings.email }}.
          </p>

          <p
            class="mx-auto mt-2 max-w-xl text-sm text-gray-500"
          >
            Também será bem-vindo aos nossos cultos em
            {{ settingsStore.settings.address }}.
          </p>

          <div
            class="mt-5 flex flex-wrap justify-center gap-3"
          >
            <NuxtLink
              to="/#contact"
              class="inline-flex items-center gap-2 rounded-full bg-[#026AA2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Icon icon="mdi:email-outline" />
              Contacte-nos
            </NuxtLink>

            <NuxtLink
              to="/about-us"
              class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Icon icon="mdi:church-outline" />
              Conheça a ICFR
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>