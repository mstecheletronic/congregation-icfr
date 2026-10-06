<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth'] })
useSeoMeta({
  title: 'Publicar Ensinamento',
  description: 'Adicione novos estudos bíblicos e sermões à biblioteca.',
})

const { setHeader } = usePageHeader()
const teachingsStore = useTeachingsStore()

onMounted(() => {
  teachingsStore.load()
  setHeader('Publicar Ensinamento', 'Adicione novos estudos bíblicos e sermões à biblioteca')
})

const tips = [
  'Use clear, descriptive titles',
  'Adicione descrições detalhadas',
  'Escolha imagens de boa qualidade',
  'Tag content appropriately',
  'Inclua informações da série de sermões',
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink
      to="/admin/teachings"
      class="inline-flex w-fit items-center gap-1.5 rounded-lg py-1 text-sm text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      <Icon icon="mdi:arrow-left" class="text-base" />
      Back to teachings
    </NuxtLink>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Left: Upload form -->
      <div class="xl:col-span-2">
        <Card>
          <UploadForm />
        </Card>
      </div>

      <!-- Right: Recent uploads + Tips -->
      <div class="flex flex-col gap-4">
        <!-- Publicações Recentes -->
        <Card>
          <h3 class="font-serif text-lg font-bold text-gray-900 mb-4">Publicações Recentes</h3>

          <div
            v-if="teachingsStore.recentSermons.length"
            class="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1"
          >
            <article
              v-for="sermon in teachingsStore.recentSermons"
              :key="sermon.id"
              class="rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-100 transition-colors"
            >
              <div v-if="sermon.categories.length" class="flex flex-wrap gap-1.5 mb-2">
                <span
                  v-for="cat in sermon.categories.slice(0, 3)"
                  :key="cat"
                  class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium"
                  style="color: #0ba5ec"
                >
                  {{ cat }}
                </span>
              </div>
              <p class="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                {{ sermon.topic }}
              </p>
              <NuxtLink
                to="/admin/teachings"
                class="mt-2 inline-flex items-center gap-1 text-sm font-medium"
                style="color: #0ba5ec"
                :aria-label="`Ver ${sermon.topic}`"
              >
                Read more
                <Icon icon="mdi:arrow-right" class="text-sm" />
              </NuxtLink>
            </article>
          </div>

          <div v-else class="text-center py-6 text-gray-400 text-sm">Ainda não existem publicações</div>
        </Card>

        <!-- Dicas de Publicação -->
        <Card>
          <h3 class="font-serif text-lg font-bold text-gray-900 mb-3">Dicas de Publicação</h3>
          <ul class="space-y-2.5">
            <li v-for="tip in tips" :key="tip" class="flex items-start gap-2 text-sm text-gray-600">
              <span
                class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"
                aria-hidden="true"
              ></span>
              {{ tip }}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  </div>
</template>
