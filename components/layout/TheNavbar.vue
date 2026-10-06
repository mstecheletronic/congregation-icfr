<script setup lang="ts">
const { isHidden, visible } = useRouteVisibility()
const { isNavItemVisible } = useNavVisibility()

const route = useRoute()
const liveStore = usePublicLiveStreamStore()
const settingsStore = useChurchSettingsStore()

onMounted(() => settingsStore.load())

const teachingsOpen = ref(false)
const mobileOpen = ref(false)

let teachingsTimer: ReturnType<typeof setTimeout> | null = null

const scrolled = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, {
    passive: true,
  })
})

function openTeachings() {
  if (teachingsTimer) {
    clearTimeout(teachingsTimer)
  }

  teachingsOpen.value = true
}

function closeTeachings() {
  teachingsTimer = setTimeout(() => {
    teachingsOpen.value = false
  }, 150)
}

function closeMobileMenu() {
  mobileOpen.value = false
  teachingsOpen.value = false
}

watch(route, () => {
  mobileOpen.value = false
  teachingsOpen.value = false
})

const allTeachingLinks = [
  {
    icon: 'heroicons:microphone',
    label: 'Sermões',
    desc: 'Mensagens e pregações bíblicas',
    to: '/teachings/sermons',
  },
  {
    icon: 'heroicons:academic-cap',
    label: 'Estudos Bíblicos',
    desc: 'Lições e estudos da Palavra de Deus',
    to: '/teachings/sunday-school',
  },
]

const teachingLinks = computed(() =>
  isNavItemVisible('teachings')
    ? visible(allTeachingLinks)
    : []
)

onBeforeUnmount(() => {
  if (teachingsTimer) {
    clearTimeout(teachingsTimer)
  }

  window.removeEventListener(
    'scroll',
    handleScroll
  )
})
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full transition-[background-color,box-shadow,border-color] duration-300"
    :class="
      scrolled
        ? 'bg-white border-b border-gray-100 shadow-md'
        : 'bg-white/90 backdrop-blur-md border-b border-transparent shadow-sm'
    "
  >
    <nav
      class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
    >
      <!-- Logo / Identidade ICFR -->
      <component
        :is="
          isHidden('/')
            ? 'div'
            : resolveComponent('NuxtLink')
        "
        :to="isHidden('/') ? undefined : '/'"
        class="flex shrink-0 items-center gap-3"
        :aria-label="
          isHidden('/')
            ? undefined
            : 'Página inicial da ICFR Família Redimida'
        "
      >
        <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
  <img
    src="/images/icfr-logo.png"
    alt="Logo ICFR Família Redimida"
    class="h-full w-full object-contain"
  />
</div>

        <div class="hidden sm:block">
          <p
            class="text-sm font-bold leading-tight text-gray-900"
          >
            ICFR Família Redimida
          </p>

          <p
            class="text-[11px] text-blue-600"
          >
            Resgatando vidas para Cristo.
          </p>
        </div>
      </component>

      <!-- Menu desktop -->
      <ul
        class="hidden items-center gap-7 lg:flex"
      >
        <li
          v-if="
            !isHidden('/') &&
            isNavItemVisible('home')
          "
        >
          <NuxtLink
            to="/"
            class="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            active-class="text-blue-600"
            aria-label="Início"
          >
            Início
          </NuxtLink>
        </li>

        <li
          v-if="
            !isHidden('/live-streams') &&
            isNavItemVisible('liveStreams')
          "
        >
          <NuxtLink
            to="/live-streams"
            class="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-gray-900"
            :class="
              liveStore.isLive
                ? 'text-accent'
                : 'text-gray-700'
            "
            aria-label="Cultos ao vivo"
          >
            <span
              v-if="liveStore.isLive"
              class="relative flex h-2 w-2"
            >
              <span
                class="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping"
              ></span>

              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-live"
              ></span>
            </span>

            Cultos ao Vivo
          </NuxtLink>
        </li>

        <!-- Ensinamentos -->
        <li
          v-if="teachingLinks.length"
          class="relative"
          @mouseenter="openTeachings"
          @mouseleave="closeTeachings"
        >
          <button
            class="flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            :aria-expanded="teachingsOpen"
            aria-haspopup="true"
            @click="
              teachingsOpen
                ? (teachingsOpen = false)
                : openTeachings()
            "
          >
            Ensinamentos

            <Icon
              icon="heroicons:chevron-down"
              class="h-4 w-4 transition-transform duration-200"
              :class="
                teachingsOpen
                  ? 'rotate-180'
                  : ''
              "
            />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="teachingsOpen"
              class="absolute left-0 top-full mt-3 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"
              @mouseenter="openTeachings"
              @mouseleave="closeTeachings"
            >
              <NuxtLink
                v-for="link in teachingLinks"
                :key="link.label"
                :to="link.to"
                class="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                @click="teachingsOpen = false"
              >
                <div
                  class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50"
                >
                  <Icon
                    :icon="link.icon"
                    class="h-4 w-4 text-accent"
                  />
                </div>

                <div>
                  <p
                    class="text-sm font-semibold text-gray-900"
                  >
                    {{ link.label }}
                  </p>

                  <p
                    class="text-xs text-gray-500"
                  >
                    {{ link.desc }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </Transition>
        </li>

        <li
          v-if="
            !isHidden('/events') &&
            isNavItemVisible('events')
          "
        >
          <NuxtLink
            to="/events"
            class="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            active-class="text-blue-600"
            aria-label="Eventos"
          >
            Eventos
          </NuxtLink>
        </li>

        <li
          v-if="
            isNavItemVisible('gallery')
          "
        >
          <NuxtLink
            to="/gallery/sunday-service"
            class="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            active-class="text-blue-600"
            aria-label="Galeria"
          >
            Galeria
          </NuxtLink>
        </li>

        <li
          v-if="
            !isHidden('/about-us') &&
            isNavItemVisible('aboutUs')
          "
        >
          <NuxtLink
            to="/about-us"
            class="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            active-class="text-blue-600"
            aria-label="Sobre Nós"
          >
            Sobre Nós
          </NuxtLink>
        </li>

        <li
          v-if="
            isNavItemVisible('contactUs')
          "
        >
          <a
            href="/#contact"
            class="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            aria-label="Contactos"
          >
            Contactos
          </a>
        </li>

        <li
          v-if="
            isNavItemVisible('register')
          "
        >
          <NuxtLink
            to="/register"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            aria-label="Cadastro de membro"
          >
            Cadastrar
          </NuxtLink>
        </li>
      </ul>

      <!-- Botão mobile -->
      <button
        class="flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Abrir menu"
        @click="
          mobileOpen = !mobileOpen
        "
      >
        <Icon
          :icon="
            mobileOpen
              ? 'heroicons:x-mark'
              : 'heroicons:bars-3'
          "
          class="h-6 w-6"
        />
      </button>
    </nav>

    <!-- Menu mobile -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="mobileOpen"
        class="border-t border-gray-100 bg-white lg:hidden"
      >
        <div
          class="mx-auto max-w-7xl px-4 py-4 sm:px-6"
        >
          <ul
            class="flex flex-col gap-1"
          >
            <li
              v-if="
                !isHidden('/') &&
                isNavItemVisible('home')
              "
            >
              <NuxtLink
                to="/"
                class="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                Início
              </NuxtLink>
            </li>

            <li
              v-if="
                !isHidden('/live-streams') &&
                isNavItemVisible('liveStreams')
              "
            >
              <NuxtLink
                to="/live-streams"
                class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                <span
                  v-if="liveStore.isLive"
                  class="relative flex h-2 w-2"
                >
                  <span
                    class="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping"
                  ></span>

                  <span
                    class="relative inline-flex h-2 w-2 rounded-full bg-live"
                  ></span>
                </span>

                Cultos ao Vivo
              </NuxtLink>
            </li>

            <li
              v-if="
                teachingLinks.length
              "
            >
              <button
                class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  teachingsOpen =
                    !teachingsOpen
                "
              >
                Ensinamentos

                <Icon
                  icon="heroicons:chevron-down"
                  class="h-4 w-4 transition-transform"
                  :class="
                    teachingsOpen
                      ? 'rotate-180'
                      : ''
                  "
                />
              </button>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
              >
                <ul
                  v-if="teachingsOpen"
                  class="mt-1 flex flex-col gap-1 pl-4"
                >
                  <li
                    v-for="link in teachingLinks"
                    :key="link.label"
                  >
                    <NuxtLink
                      :to="link.to"
                      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      @click="
                        closeMobileMenu
                      "
                    >
                      <Icon
                        :icon="link.icon"
                        class="h-4 w-4 text-accent"
                      />

                      {{ link.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </Transition>
            </li>

            <li
              v-if="
                !isHidden('/events') &&
                isNavItemVisible('events')
              "
            >
              <NuxtLink
                to="/events"
                active-class="text-blue-600 bg-blue-50"
                class="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                Eventos
              </NuxtLink>
            </li>

            <li
              v-if="
                isNavItemVisible('gallery')
              "
            >
              <NuxtLink
                to="/gallery/sunday-service"
                active-class="text-blue-600 bg-blue-50"
                class="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                Galeria
              </NuxtLink>
            </li>

            <li
              v-if="
                !isHidden('/about-us') &&
                isNavItemVisible('aboutUs')
              "
            >
              <NuxtLink
                to="/about-us"
                active-class="text-blue-600 bg-blue-50"
                class="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                Sobre Nós
              </NuxtLink>
            </li>

            <li
              v-if="
                isNavItemVisible('contactUs')
              "
            >
              <a
                href="/#contact"
                class="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="
                  mobileOpen = false
                "
              >
                Contactos
              </a>
            </li>

            <li
              v-if="
                isNavItemVisible('register')
              "
              class="mt-1"
            >
              <NuxtLink
                to="/register"
                class="block rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                @click="
                  mobileOpen = false
                "
              >
                Cadastrar
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </header>
</template>