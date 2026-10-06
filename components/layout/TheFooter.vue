<script setup lang="ts">
const { el: footerRef, isVisible } = useScrollReveal({ threshold: 0.05 })

const settingsStore = useChurchSettingsStore()

onMounted(() => settingsStore.load())

interface FooterLink {
  label: string
  href: string
  external?: boolean
  icon?: 'github'
}

const { isHidden } = useRouteVisibility()

function keep(links: FooterLink[]) {
  return links.filter((link) => link.external || !isHidden(link.href))
}

const allQuickLinks: FooterLink[] = [
  {
    label: 'Encontrar uma Congregação',
    href: '/#congregations',
  },
  {
    label: 'Assistir Cultos',
    href: '/live-streams',
  },
  {
    label: 'Sermões e Ensinamentos',
    href: '/teachings/sermons',
  },
  {
    label: 'Estudos Bíblicos',
    href: '/teachings/sunday-school',
  },
  {
    label: 'Sobre a ICFR',
    href: '/about-us',
  },
]

const allSalvationLinks: FooterLink[] = [
  {
    label: 'Ouvir o Evangelho',
    href: '/salvation#hear',
  },
  {
    label: 'Crer no Evangelho',
    href: '/salvation#believe',
  },
  {
    label: 'Arrependimento',
    href: '/salvation#repent',
  },
  {
    label: 'Confessar Cristo',
    href: '/salvation#confess',
  },
  {
    label: 'Batismo',
    href: '/salvation#baptized',
  },
]

const allResourceLinks: FooterLink[] = [
  {
    label: 'Ensinamentos Bíblicos',
    href: '/teachings/sermons',
  },
  {
    label: 'Contacte-nos',
    href: '/#contact',
  },
]

const quickLinks = computed(() => keep(allQuickLinks))
const salvationLinks = computed(() => keep(allSalvationLinks))
const resourceLinks = computed(() => keep(allResourceLinks))

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer
    ref="footerRef"
    class="relative overflow-hidden bg-[#0F172A] text-white"
  >
    <!-- Marca de fundo -->
    <span
      class="footer-watermark"
      aria-hidden="true"
    >
      ICFR
    </span>

    <div
      class="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:px-8"
    >
      <div
        class="grid gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12"
      >
        <!-- Identidade -->
        <div
          :class="[
            'reveal-left',
            isVisible && 'is-visible',
          ]"
        >
          <div class="mb-2 flex items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-800 text-[10px] font-bold text-white"
            >
              ICFR
            </div>

            <div>
              <p
                class="text-[18px] font-bold leading-tight text-white"
              >
                {{ settingsStore.settings.name }}
              </p>

              <p class="mt-0.5 text-xs text-blue-300">
                Resgatando vidas para Cristo.
              </p>
            </div>
          </div>

          <p
            class="mb-5 text-[13px] text-slate-400"
          >
            {{ settingsStore.settings.address }}
          </p>

          <p
            class="mb-6 max-w-[300px] text-[13px] leading-[1.6] text-slate-400"
          >
            Uma família de fé comprometida com a Palavra de Deus,
            a comunhão e a transformação de vidas através de Jesus Cristo.
          </p>

          <!-- Redes sociais -->
          <div class="flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white transition-opacity hover:opacity-85"
            >
              <svg
                class="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                />
              </svg>
            </a>

            <a
              href="#"
              aria-label="YouTube"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF0000] text-white transition-opacity hover:opacity-85"
            >
              <svg
                class="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
                />
              </svg>
            </a>

            <a
              href="#"
              aria-label="Instagram"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1306C] text-white transition-opacity hover:opacity-85"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  ry="5"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="4"
                />

                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Links rápidos -->
        <div
          v-if="quickLinks.length"
          :class="[
            'reveal',
            'delay-100',
            isVisible && 'is-visible',
          ]"
        >
          <h4
            class="mb-5 text-[15px] font-semibold text-white"
          >
            Links Rápidos
          </h4>

          <ul>
            <li
              v-for="link in quickLinks"
              :key="link.href"
            >
              <NuxtLink
                :to="link.href"
                class="block text-[14px] leading-[2] text-slate-400 transition-colors duration-150 hover:text-white"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Salvação -->
        <div
          v-if="salvationLinks.length"
          :class="[
            'reveal',
            'delay-200',
            isVisible && 'is-visible',
          ]"
        >
          <h4
            class="mb-5 text-[15px] font-semibold text-white"
          >
            Caminho da Salvação
          </h4>

          <ul>
            <li
              v-for="link in salvationLinks"
              :key="link.href"
            >
              <NuxtLink
                :to="link.href"
                class="block text-[14px] leading-[2] text-slate-400 transition-colors duration-150 hover:text-white"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Recursos -->
        <div
          v-if="resourceLinks.length"
          :class="[
            'reveal',
            'delay-300',
            isVisible && 'is-visible',
          ]"
        >
          <h4
            class="mb-5 text-[15px] font-semibold text-white"
          >
            Recursos
          </h4>

          <ul>
            <li
              v-for="link in resourceLinks"
              :key="link.href"
            >
              <NuxtLink
                :to="link.href"
                class="block text-[14px] leading-[2] text-slate-400 transition-colors duration-150 hover:text-white"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-12 border-t border-white/10"
      ></div>

      <!-- Rodapé inferior -->
      <div
        class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <p class="text-[13px] text-white">
            © {{ currentYear }} ICFR Família Redimida
          </p>

          <p
            class="mt-1 max-w-[520px] text-[12px] text-slate-500"
          >
            Resgatando vidas para Cristo.
          </p>
        </div>

        <div
          class="flex items-center gap-1 text-[13px] text-slate-400"
        >
          <a
            href="#"
            class="transition-colors hover:text-white"
          >
            Política de Privacidade
          </a>

          <span class="mx-1 text-slate-600">
            &bull;
          </span>

          <a
            href="#"
            class="transition-colors hover:text-white"
          >
            Termos de Uso
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(80px, 15vw, 180px);
  font-weight: 900;
  color: white;
  opacity: 0.05;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  z-index: 0;
  letter-spacing: 0.1em;
}
</style>