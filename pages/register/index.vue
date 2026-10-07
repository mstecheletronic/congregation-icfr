<script setup lang="ts">
import type { EmergencyContact, Member } from '~/types'

definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})

useSeoMeta({
  title: 'Cadastro de Membro — ICFR Família Redimida',
  description:
    'Cadastre-se como membro da ICFR Família Redimida. Preencha os seus dados pessoais, contacto e informações da igreja.',
  ogTitle: 'Cadastro de Membro — ICFR Família Redimida',
  ogDescription: 'Faça o seu cadastro na ICFR Família Redimida — Resgatando vidas para Cristo.',
})

const membersStore = useMembersStore()
const toast = useToast()

type RegistrationForm = Omit<Member, 'id' | 'absenceCount' | 'status' | 'churchNumber'> & {
  ecName: string
  ecRelationship: string
  ecPhone: string
  ecAddress: string
}

const today = new Date().toISOString().slice(0, 10)

function emptyForm(): RegistrationForm {
  return {
    // Dados pessoais
    name: '',
    gender: 'Male',
    phone: '',
    email: '',
    dob: '',
    maritalStatus: '',
    occupation: '',
    avatar: '',

    // Igreja
    congregation: '',
    dateOfBaptism: '',
    dateJoined: today,

    // Origem
    country: 'Moçambique',
    state: '',
    localGovernment: '',
    village: '',

    // Residência
    address: '',

    // Congregação anterior
    previousCongregation: '',
    previousMinisterPhone: '',

    // Contacto de emergência
    ecName: '',
    ecRelationship: '',
    ecPhone: '',
    ecAddress: '',
  }
}

const form = reactive<RegistrationForm>(emptyForm())

/**
 * Mantemos os valores internos Male/Female para não quebrar
 * os tipos e dados existentes. Apenas os textos visíveis são traduzidos.
 */
const genderOptions: {
  label: string
  value: Member['gender']
}[] = [
  {
    label: 'Masculino',
    value: 'Male',
  },
  {
    label: 'Feminino',
    value: 'Female',
  },
]

const congregationOptions = ['Muchatazina Sede', 'Cerâmica', 'Crespim', 'Chimoio', 'Tete']

const maritalOptions = [
  {
    label: 'Solteiro(a)',
    value: 'Single',
  },
  {
    label: 'Casado(a)',
    value: 'Married',
  },
  {
    label: 'Viúvo(a)',
    value: 'Widowed',
  },
  {
    label: 'Divorciado(a)',
    value: 'Divorced',
  },
]

type FieldErrors = Partial<
  Record<
    | 'avatar'
    | 'name'
    | 'email'
    | 'phone'
    | 'dob'
    | 'congregation'
    | 'address'
    | 'previousMinisterPhone',
    string
  >
>

const errors = ref<FieldErrors>({})
const submitting = ref(false)
const submitted = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[\d\s-]{7,20}$/

function validate(): boolean {
  const next: FieldErrors = {}

  if (!form.avatar) {
    next.avatar = 'A fotografia é obrigatória'
  }

  if (!form.name.trim()) {
    next.name = 'O nome completo é obrigatório'
  }

  const email = form.email.trim().toLowerCase()

  if (email && !EMAIL_RE.test(email)) {
    next.email = 'Introduza um endereço de email válido'
  }

  if (!form.phone.trim()) {
    next.phone = 'O número de telefone é obrigatório'
  } else if (!PHONE_RE.test(form.phone.trim())) {
    next.phone = 'Introduza um número de telefone válido'
  }

  if (form.dob && form.dob > today) {
    next.dob = 'A data de nascimento não pode estar no futuro'
  }

  if (!form.address?.trim()) {
    next.address = 'O endereço de residência é obrigatório'
  }

  const ministerPhone = form.previousMinisterPhone?.trim()

  if (ministerPhone && !PHONE_RE.test(ministerPhone)) {
    next.previousMinisterPhone = 'Introduza um número de telefone válido'
  }

  errors.value = next

  return Object.keys(next).length === 0
}

const firstErrorField = computed(() => Object.keys(errors.value)[0])

async function submit() {
  if (!validate()) {
    toast.error('Corrija os campos destacados antes de continuar')

    const el = document.getElementById(`field-${firstErrorField.value}`)

    el?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    return
  }

  submitting.value = true

  const emergencyContact: EmergencyContact | undefined =
    form.ecName.trim() || form.ecPhone.trim()
      ? {
          name: form.ecName.trim(),
          relationship: form.ecRelationship.trim(),
          phone: form.ecPhone.trim(),
          address: form.ecAddress.trim(),
        }
      : undefined

  try {
    await membersStore.addMember({
      name: form.name.trim(),
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      dob: form.dob,

      // Cadastro público aguarda aprovação da administração.
      status: 'Pending',

      absenceCount: 0,
      avatar: form.avatar,
      congregation: form.congregation,
      maritalStatus: form.maritalStatus,
      dateOfBaptism: form.dateOfBaptism,
      dateJoined: form.dateJoined || today,
      occupation: form.occupation,

      country: form.country,
      state: form.state,
      localGovernment: form.localGovernment,
      village: form.village,

      address: form.address,

      previousCongregation: form.previousCongregation?.trim(),

      previousMinisterPhone: form.previousMinisterPhone?.trim(),

      emergencyContact,
    })

    submitted.value = true

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  } catch {
    // O store já apresenta o erro.
    // Mantemos o formulário preenchido.
  } finally {
    submitting.value = false
  }
}

function registerAnother() {
  Object.assign(form, emptyForm())

  errors.value = {}

  if (!form.congregation?.trim()) {
    errors.value.congregation = 'Selecione a sua congregação'
  }
  submitted.value = false
}

watch(
  () => form.avatar,
  (url) => {
    if (url && errors.value.avatar) {
      errors.value = {
        ...errors.value,
        avatar: undefined,
      }
    }
  }
)

const registeredName = ref('')

watch(submitted, (value) => {
  if (value) {
    registeredName.value = form.name.trim()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- Cabeçalho -->
    <div class="border-b border-gray-100 bg-white py-8">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="mb-1 flex items-center gap-2 text-xs font-medium text-gray-400">
          <NuxtLink to="/" class="transition-colors hover:text-blue-600"> Início </NuxtLink>

          <Icon icon="mdi:chevron-right" class="h-3.5 w-3.5" />

          <span class="text-gray-600"> Cadastro </span>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Cadastro de Membro</h1>

        <p class="mt-1 text-sm text-gray-500">
          Preencha os seus dados para fazer parte do registo de membros da ICFR Família Redimida. Os
          campos marcados com

          <span class="text-red-500"> * </span>

          são obrigatórios.
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
      <!-- Cadastro concluído -->
      <Card v-if="submitted" padding="lg">
        <div class="flex flex-col items-center py-8 text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <Icon icon="mdi:check-circle-outline" class="text-3xl text-green-600" />
          </div>

          <h2 class="mt-4 text-xl font-bold text-gray-900">Cadastro recebido com sucesso</h2>

          <p class="mt-1 max-w-md text-sm text-gray-500">
            Obrigado{{ registeredName ? `, ${registeredName}` : '' }}. Os seus dados foram enviados
            para a ICFR Família Redimida. A administração poderá analisar e confirmar o seu registo.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" @click="registerAnother">
              <template #icon-left>
                <Icon icon="mdi:account-plus-outline" />
              </template>

              Cadastrar outro membro
            </Button>

            <NuxtLink to="/">
              <Button> Voltar ao Início </Button>
            </NuxtLink>
          </div>
        </div>
      </Card>

      <!-- Formulário -->
      <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <!-- Informações pessoais -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:account-outline" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">Informações Pessoais</h2>

                <p class="text-xs text-gray-500">Dados básicos para identificação e contacto.</p>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Fotografia -->
              <div
                id="field-avatar"
                class="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
              >
                <div :class="errors.avatar ? 'rounded-full ring-2 ring-red-400' : ''">
                  <ImageUpload
                    v-model="form.avatar"
                    shape="circle"
                    folder="members"
                    :max-bytes="2 * 1024 * 1024"
                  />
                </div>

                <div>
                  <p class="text-xs text-gray-500">
                    Fotografia

                    <span class="text-red-500"> * </span>

                    <br />

                    JPG ou PNG. Fotografias grandes serão comprimidas automaticamente.
                  </p>

                  <p v-if="errors.avatar" class="mt-1 text-xs text-red-500">
                    {{ errors.avatar }}
                  </p>
                </div>
              </div>

              <!-- Nome + Email -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EditField id="field-name" label="Nome Completo *">
                  <input
                    v-model="form.name"
                    type="text"
                    autocomplete="name"
                    placeholder="Digite o seu nome completo"
                    :class="errors.name ? 'border-red-400 focus:border-red-400' : ''"
                  />

                  <p v-if="errors.name" class="mt-1 text-xs text-red-500">
                    {{ errors.name }}
                  </p>
                </EditField>

                <EditField id="field-email" label="Email">
                  <input
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    placeholder="exemplo@email.com (opcional)"
                    :class="errors.email ? 'border-red-400 focus:border-red-400' : ''"
                  />

                  <p v-if="errors.email" class="mt-1 text-xs text-red-500">
                    {{ errors.email }}
                  </p>
                </EditField>
              </div>

              <!-- Telefone / Sexo / Estado civil -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <EditField id="field-phone" label="Telefone *" class="sm:col-span-2">
                  <input
                    v-model="form.phone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="+258 84 000 0000"
                    :class="errors.phone ? 'border-red-400 focus:border-red-400' : ''"
                  />

                  <p v-if="errors.phone" class="mt-1 text-xs text-red-500">
                    {{ errors.phone }}
                  </p>
                </EditField>

                <EditField label="Sexo">
                  <select v-model="form.gender">
                    <option v-for="g in genderOptions" :key="g.value" :value="g.value">
                      {{ g.label }}
                    </option>
                  </select>
                </EditField>

                <EditField label="Estado Civil">
                  <select v-model="form.maritalStatus">
                    <option value="">— Selecionar —</option>

                    <option v-for="m in maritalOptions" :key="m.value" :value="m.value">
                      {{ m.label }}
                    </option>
                  </select>
                </EditField>
              </div>

              <!-- Nascimento / profissão -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EditField id="field-dob" label="Data de Nascimento">
                  <input
                    v-model="form.dob"
                    type="date"
                    :max="today"
                    :class="errors.dob ? 'border-red-400 focus:border-red-400' : ''"
                  />

                  <p v-if="errors.dob" class="mt-1 text-xs text-red-500">
                    {{ errors.dob }}
                  </p>
                </EditField>

                <EditField label="Ocupação">
                  <input
                    v-model="form.occupation"
                    type="text"
                    placeholder="Ex.: Professor, Estudante, Técnico"
                  />
                </EditField>
              </div>
            </div>
          </section>
        </Card>

        <!-- Informações da igreja -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:church" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">Informações da Igreja</h2>

                <p class="text-xs text-gray-500">
                  Se ainda não foi batizado, deixe a data de batismo em branco.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField id="field-congregation" label="Congregação Atual *">
                <select
                  v-model="form.congregation"
                  :class="errors.congregation ? 'border-red-400 focus:border-red-400' : ''"
                >
                  <option value="">— Selecionar congregação —</option>

                  <option
                    v-for="congregation in congregationOptions"
                    :key="congregation"
                    :value="congregation"
                  >
                    {{ congregation }}
                  </option>
                </select>

                <p v-if="errors.congregation" class="mt-1 text-xs text-red-500">
                  {{ errors.congregation }}
                </p>
              </EditField>

              <EditField label="Data do Batismo">
                <input v-model="form.dateOfBaptism" type="date" :max="today" />
              </EditField>

              <EditField label="Data do Cadastro">
                <input v-model="form.dateJoined" type="date" :max="today" />
              </EditField>
            </div>
          </section>
        </Card>

        <!-- Congregação anterior -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:account-switch-outline" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">
                  Congregação Anterior

                  <span class="text-xs font-normal text-gray-400"> (opcional) </span>
                </h2>

                <p class="text-xs text-gray-500">
                  Preencha apenas se veio transferido de outra igreja ou congregação.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField label="Congregação Anterior">
                <input
                  v-model="form.previousCongregation"
                  type="text"
                  placeholder="Ex.: Congregação Central"
                />
              </EditField>

              <EditField id="field-previousMinisterPhone" label="Telefone do Pastor / Líder">
                <input
                  v-model="form.previousMinisterPhone"
                  type="tel"
                  placeholder="+258 84 000 0000"
                  :class="errors.previousMinisterPhone ? 'border-red-400 focus:border-red-400' : ''"
                />

                <p v-if="errors.previousMinisterPhone" class="mt-1 text-xs text-red-500">
                  {{ errors.previousMinisterPhone }}
                </p>
              </EditField>
            </div>
          </section>
        </Card>

        <!-- Local de origem -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:map-marker-outline" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">Local de Origem</h2>

                <p class="text-xs text-gray-500">Informe a sua proveniência.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField label="País">
                <input v-model="form.country" type="text" placeholder="Moçambique" />
              </EditField>

              <EditField label="Província">
                <input v-model="form.state" type="text" placeholder="Ex.: Sofala" />
              </EditField>

              <EditField label="Distrito">
                <input v-model="form.localGovernment" type="text" placeholder="Ex.: Beira" />
              </EditField>

              <EditField label="Localidade / Bairro">
                <input v-model="form.village" type="text" placeholder="Ex.: Munhava" />
              </EditField>
            </div>
          </section>
        </Card>

        <!-- Endereço -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:home-outline" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">Endereço de Residência</h2>

                <p class="text-xs text-gray-500">Informe onde vive atualmente.</p>
              </div>
            </div>

            <EditField id="field-address" label="Endereço Completo *">
              <input
                v-model="form.address"
                type="text"
                autocomplete="street-address"
                placeholder="Ex.: Bairro da Munhava, Beira"
                :class="errors.address ? 'border-red-400 focus:border-red-400' : ''"
              />

              <p v-if="errors.address" class="mt-1 text-xs text-red-500">
                {{ errors.address }}
              </p>
            </EditField>
          </section>
        </Card>

        <!-- Contacto de emergência -->
        <Card padding="lg">
          <section>
            <div class="mb-5 flex items-start gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Icon icon="mdi:phone-alert-outline" class="text-lg text-accent" />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-gray-900">
                  Contacto de Emergência

                  <span class="text-xs font-normal text-gray-400"> (opcional) </span>
                </h2>

                <p class="text-xs text-gray-500">
                  Pessoa que poderá ser contactada em seu nome em caso de necessidade.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField label="Nome">
                <input v-model="form.ecName" type="text" placeholder="Nome completo" />
              </EditField>

              <EditField label="Relação">
                <input
                  v-model="form.ecRelationship"
                  type="text"
                  placeholder="Ex.: Pai, Mãe, Irmão, Esposa"
                />
              </EditField>

              <EditField label="Telefone">
                <input v-model="form.ecPhone" type="tel" placeholder="+258 84 000 0000" />
              </EditField>

              <EditField label="Endereço">
                <input v-model="form.ecAddress" type="text" placeholder="Endereço completo" />
              </EditField>
            </div>
          </section>
        </Card>

        <!-- Enviar -->
        <div
          class="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between sm:gap-4"
        >
          <p class="text-xs text-gray-400">
            Os seus dados serão utilizados apenas para os registos internos da ICFR Família
            Redimida.
          </p>

          <Button type="submit" size="lg" :loading="submitting" class="w-full sm:w-auto">
            <template #icon-left>
              <Icon icon="mdi:account-check-outline" />
            </template>

            Enviar Cadastro
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
