<!--
  Congregation - Open Source Church Management System
  Copyright (c) 2025 Mfonido Mark

  This file is part of Congregation.

  Congregation is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Congregation is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with Congregation.  If not, see https://www.gnu.org/licenses/.
-->

<script setup lang="ts">
const authStore = useAuthStore()
authStore.init()

const showSplash = ref(true)

onMounted(() => {
  document.body.style.overflow = 'hidden'

  const timer = window.setTimeout(() => {
    showSplash.value = false
    document.body.style.overflow = ''
  }, 1800)

  onUnmounted(() => {
    window.clearTimeout(timer)
    document.body.style.overflow = ''
  })
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <ToastContainer />

  <!-- Host for `useConfirm()`. One instance for the whole app, like the toasts. -->
  <ConfirmDialog />

  <!-- Ecrã inicial ICFR -->
  <Transition name="icfr-splash">
    <div
      v-if="showSplash"
      class="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#102A43]"
    >
      <!-- Luz decorativa -->
      <div
        class="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl"
      ></div>

      <div class="relative z-10 flex flex-col items-center px-6 text-center">
        <!-- Logo -->
        <div class="icfr-logo-intro">
          <div
            class="flex h-28 w-28 items-center justify-center rounded-full bg-white p-2 shadow-2xl ring-4 ring-white/10"
          >
            <img
              src="/images/icfr-logo.png"
              alt="Logo ICFR Família Redimida"
              class="h-full w-full object-contain"
            />
          </div>
        </div>

        <!-- ICFR -->
        <h1
          class="icfr-title-intro mt-6 text-5xl font-black tracking-[0.18em] text-white sm:text-6xl"
        >
          ICFR
        </h1>

        <p
          class="icfr-name-intro mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-blue-200 sm:text-base"
        >
          Família Redimida
        </p>

        <p class="icfr-tagline-intro mt-5 text-sm italic text-white/75 sm:text-base">
          Resgatando vidas para Cristo.
        </p>

        <!-- Linha animada -->
        <div class="mt-7 h-[2px] w-44 overflow-hidden rounded-full bg-white/10">
          <div class="icfr-loading-line h-full bg-blue-400"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.icfr-splash-leave-active {
  transition:
    opacity 0.55s ease,
    visibility 0.55s ease;
}

.icfr-splash-leave-to {
  opacity: 0;
  visibility: hidden;
}

.icfr-logo-intro {
  opacity: 0;
  transform: scale(0.72);
  animation: icfrLogoIn 0.65s ease-out forwards;
}

.icfr-title-intro {
  opacity: 0;
  transform: translateY(14px);
  animation: icfrTextIn 0.5s ease-out 0.3s forwards;
}

.icfr-name-intro {
  opacity: 0;
  transform: translateY(10px);
  animation: icfrTextIn 0.5s ease-out 0.48s forwards;
}

.icfr-tagline-intro {
  opacity: 0;
  animation: icfrFadeIn 0.55s ease-out 0.72s forwards;
}

.icfr-loading-line {
  width: 0;
  animation: icfrLoad 1.4s ease-in-out 0.25s forwards;
}

@keyframes icfrLogoIn {
  from {
    opacity: 0;
    transform: scale(0.72) rotate(-4deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes icfrTextIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes icfrFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes icfrLoad {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}
</style>
