<script setup lang="ts">
import type { Member, EmergencyContact } from '~/types'
import { MEMBER_STATUSES, YOUTH_LEVELS, YOUTH_PROGRAMS } from '~/constants'

// The parent handles the actual write, but the button that triggers it lives here — so it
// reads the store's pending flag directly rather than threading a prop through.
const membersStore = useMembersStore()

interface Props {
  modelValue: boolean
  title?: string
  /** Show the DOB age hint and the schooling section, which only youth are asked for. */
  youthMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Adicionar Membro',
  youthMode: false,
})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  save: [member: Omit<Member, 'id' | 'absenceCount'>]
}>()

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive<
  Omit<Member, 'id' | 'absenceCount'> & {
    ecNome: string
    ecRelationship: string
    ecPhone: string
    ecAddress: string
  }
>({
  // Personal
  name: '',
  gender: 'Male',
  phone: '',
  email: '',
  dob: '',
  churchNumber: '',
  congregation: '',
  status: 'Active',
  maritalStatus: '',
  dateOfBaptism: '',
  dateJoined: '',
  occupation: '',
  // Place of origin
  country: '',
  state: '',
  localGovernment: '',
  village: '',
  // Residential
  address: '',
  // Previous congregation
  previousCongregation: '',
  previousMinisterPhone: '',
  // Schooling (youth only)
  school: '',
  department: '',
  courseOfStudy: '',
  program: '',
  level: '',
  hallOfResidence: '',
  yearOfEntry: '',
  yearOfExit: '',
  comment: '',
  // Emergency contact (flat)
  ecNome: '',
  ecRelationship: '',
  ecPhone: '',
  ecAddress: '',
})

const errors = reactive({ name: '', email: '', phone: '' })

/**
 * Leaving in a year before you arrived is a typo, not a record worth keeping. Advisory in the
 * same way as `churchNumberError` — it blocks the save, but only while both years are filled in,
 * so a student with no exit year yet is never nagged.
 */
const yearRangeError = computed(() => {
  const from = Number(form.yearOfEntry)
  const to = Number(form.yearOfExit)
  if (!from || !to) return ''
  return to < from ? 'Year of exit cannot be before year of entry.' : ''
})

/**
 * A church number nobody else holds. Advisory only — `membersRepository` claims the number in a
 * transaction, which is what stops two people assigning it at the same moment. This just shows
 * the clash before the save is attempted.
 */
const churchNumberError = computed(() => {
  const typed = form.churchNumber?.trim()
  if (!typed) return ''
  const holder = membersStore.churchNumberHolder(typed)
  return holder ? `Already assigned to ${holder.name}.` : ''
})

const genderOptions = [
  { label: 'Masculino', value: 'Male' },
  { label: 'Feminino', value: 'Female' },
]

const congregationOptions = [
  'Muchatazina Sede',
  'Cerâmica',
  'Crespim',
  'Chimoio',
  'Tete',
]

// Derived from MEMBER_STATUSES rather than hand-listed, so adding a status cannot leave it
// missing from the dropdown that sets it.
const statusLabels: Record<Member['status'], string> = {
  Active: 'Ativo',
  Inactive: 'Inativo',
  Backslider: 'Desviado',
  Weak: 'Em Acompanhamento',
  Distant: 'Distante',
  Withdrawal: 'Afastamento',
  Disfellowshipped: 'Desligado',
  Transfer: 'Transferido',
  Late: 'Afastado',
}

const statusOptions = MEMBER_STATUSES.map((s) => ({
  label: statusLabels[s],
  value: s,
}))

const maritalOptions = [
  { label: 'Solteiro(a)', value: 'Single' },
  { label: 'Casado(a)', value: 'Married' },
  { label: 'Viúvo(a)', value: 'Widowed' },
  { label: 'Divorciado(a)', value: 'Divorced' },
]

// ─── Save ─────────────────────────────────────────────────────────────────────
function save() {
  errors.name = form.name.trim() ? '' : 'Nome is required'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : 'Informe um email válido'
  errors.phone = form.phone.trim() ? '' : 'O telefone é obrigatório'

  if (errors.name || errors.email || errors.phone || churchNumberError.value) return
  if (yearRangeError.value) return

  const emergencyContact: EmergencyContact | undefined =
    form.ecNome || form.ecPhone
      ? {
          name: form.ecNome,
          relationship: form.ecRelationship,
          phone: form.ecPhone,
          address: form.ecAddress,
        }
      : undefined

  emit('save', {
    name: form.name,
    gender: form.gender,
    phone: form.phone,
    email: form.email,
    dob: form.dob,
    churchNumber: form.churchNumber,
    congregation: form.congregation,
    status: form.status,
    maritalStatus: form.maritalStatus,
    dateOfBaptism: form.dateOfBaptism,
    dateJoined: form.dateJoined,
    occupation: form.occupation,
    country: form.country,
    state: form.state,
    localGovernment: form.localGovernment,
    village: form.village,
    address: form.address,
    previousCongregation: form.previousCongregation,
    previousMinisterPhone: form.previousMinisterPhone,
    // Only sent in youth mode — the section is hidden otherwise, so anything sitting in these
    // fields would be stale state the user never saw, not something they chose to record.
    ...(props.youthMode
      ? {
          school: form.school,
          department: form.department,
          courseOfStudy: form.courseOfStudy,
          program: form.program,
          level: form.level,
          hallOfResidence: form.hallOfResidence,
          // Coerced because `v-model` on an `<input type="number">` casts through `parseFloat`
          // and stores a number, whatever the declared type says. Without this, `yearOfEntry`
          // reaches Firestore as a number on some records and a string on others.
          yearOfEntry: yearAsString(form.yearOfEntry),
          yearOfExit: yearAsString(form.yearOfExit),
          comment: form.comment,
        }
      : {}),
    emergencyContact,
  })
  close()
}

function close() {
  emit('update:modelValue', false)
  // reset after transition
  setTimeout(reset, 300)
}

function reset() {
  Object.assign(form, {
    name: '',
    gender: 'Male',
    phone: '',
    email: '',
    dob: '',
    churchNumber: '',
    congregation: '',
    status: 'Active',
    maritalStatus: '',
    dateOfBaptism: '',
    dateJoined: '',
    occupation: '',
    country: '',
    state: '',
    localGovernment: '',
    village: '',
    address: '',
    previousCongregation: '',
    previousMinisterPhone: '',
    school: '',
    department: '',
    courseOfStudy: '',
    program: '',
    level: '',
    hallOfResidence: '',
    yearOfEntry: '',
    yearOfExit: '',
    comment: '',
    ecNome: '',
    ecRelationship: '',
    ecPhone: '',
    ecAddress: '',
  })
  Object.assign(errors, { name: '', email: '', phone: '' })
}

// Reset when closed externally
watch(
  () => props.modelValue,
  (v) => {
    if (!v) setTimeout(reset, 300)
  }
)
</script>

<template>
  <Modal :model-value="modelValue" :title="title" size="xl" @update:model-value="close">
    <div class="flex flex-col gap-6">
      <!-- ── Personal Information ──────────────────────────────────────────── -->
      <section>
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Informações Pessoais</h3>
        <div class="space-y-4">
          <!-- Nome | Email -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditField label="Nome Completo *">
              <input
                v-model="form.name"
                type="text"
                placeholder="Digite o nome completo"
                :class="errors.name ? 'border-red-400 focus:border-red-400' : ''"
              />
              <p v-if="errors.name" class="text-xs text-red-500 mt-1">{{ errors.name }}</p>
            </EditField>
            <EditField label="Email *">
              <input
                v-model="form.email"
                type="email"
                placeholder="exemplo@email.com"
                :class="errors.email ? 'border-red-400 focus:border-red-400' : ''"
              />
              <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
            </EditField>
          </div>

          <!-- Church Number | Date of Baptism -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditField
              label="Código de Membro"
              :error="churchNumberError"
              hint="O código deve ser único. Pode deixar vazio para atribuir depois."
            >
              <input
                v-model="form.churchNumber"
                type="text"
                placeholder="Ex.: MEM-0001"
                :aria-invalid="Boolean(churchNumberError)"
              />
            </EditField>
            <EditField label="Data do Batismo">
              <input v-model="form.dateOfBaptism" type="date" />
            </EditField>
          </div>

          <!-- Data de Registo | Congregação Atual -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditField label="Data de Registo">
              <input v-model="form.dateJoined" type="date" />
            </EditField>

            <EditField label="Congregação Atual *">
              <select v-model="form.congregation">
                <option value="">— Selecionar congregação —</option>
                <option
                  v-for="congregation in congregationOptions"
                  :key="congregation"
                  :value="congregation"
                >
                  {{ congregation }}
                </option>
              </select>
            </EditField>
          </div>

          <!-- Phone (wide) | Sexo | Marital Status -->
          <div class="grid grid-cols-4 gap-3">
            <EditField label="Telefone *" class="col-span-2">
              <input
                v-model="form.phone"
                type="tel"
                placeholder="+234 800 000 0000"
                :class="errors.phone ? 'border-red-400 focus:border-red-400' : ''"
              />
              <p v-if="errors.phone" class="text-xs text-red-500 mt-1">{{ errors.phone }}</p>
            </EditField>
            <EditField label="Sexo" class="col-span-1">
              <select v-model="form.gender">
                <option v-for="o in genderOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </EditField>
            <EditField label="Estado Civil" class="col-span-1">
              <select v-model="form.maritalStatus">
                <option value="">— Selecionar —</option>
                <option v-for="o in maritalOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </EditField>
          </div>

          <!-- Date of Birth | Status | Occupation -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <EditField label="Data de Nascimento">
              <input v-model="form.dob" type="date" />
              <p v-if="youthMode" class="text-xs text-gray-400 mt-1">
                Deve ter entre 13 e 35 anos para aparecer em Jovens
              </p>
            </EditField>
            <EditField label="Estado do Membro">
              <select v-model="form.status">
                <option v-for="o in statusOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </EditField>
            <EditField label="Ocupação">
              <input v-model="form.occupation" type="text" placeholder="Ex.: Professor" />
            </EditField>
          </div>
        </div>
      </section>

      <hr class="border-gray-100" />

      <!-- ── Place of Origin ───────────────────────────────────────────────── -->
      <section>
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Local de Origem</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditField label="País">
            <input v-model="form.country" type="text" placeholder="Moçambique" />
          </EditField>
          <EditField label="Província de Origem">
            <input v-model="form.state" type="text" placeholder="Ex.: Sofala" />
          </EditField>
          <EditField label="Distrito">
            <input v-model="form.localGovernment" type="text" placeholder="Ex.: Beira" />
          </EditField>
          <EditField label="Localidade">
            <input v-model="form.village" type="text" placeholder="Ex.: Inhamízua" />
          </EditField>
        </div>
      </section>

      <hr class="border-gray-100" />

      <!-- ── Residential Address ───────────────────────────────────────────── -->
      <section>
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Endereço Residencial</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditField label="País">
            <input v-model="form.country" type="text" placeholder="Moçambique" />
          </EditField>
          <EditField label="State">
            <input v-model="form.state" type="text" placeholder="Ex.: Sofala" />
          </EditField>
          <EditField label="Endereço Completo" class="sm:col-span-2">
            <input
              v-model="form.address"
              type="text"
              placeholder="Ex.: Munhava, Beira"
            />
          </EditField>
        </div>
      </section>

      <!-- ── School / Education (youth only) ───────────────────────────────── -->
      <template v-if="youthMode">
        <hr class="border-gray-100" />

        <section>
          <h3 class="text-sm font-semibold text-gray-800 mb-4">
            School &amp; Education
            <span class="text-gray-400 font-normal text-xs">(optional)</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditField label="School / Institution">
              <input v-model="form.school" type="text" placeholder="e.g. University of Uyo" />
            </EditField>
            <EditField label="Department">
              <input v-model="form.department" type="text" placeholder="e.g. Microbiology" />
            </EditField>
            <EditField label="Course of Study">
              <input
                v-model="form.courseOfStudy"
                type="text"
                placeholder="e.g. Industrial Microbiology"
              />
            </EditField>
            <EditField label="Programme">
              <select v-model="form.program">
                <option value="">— Selecionar —</option>
                <option v-for="p in YOUTH_PROGRAMS" :key="p" :value="p">{{ p }}</option>
              </select>
            </EditField>
            <EditField label="Level">
              <select v-model="form.level">
                <option value="">— Selecionar —</option>
                <option v-for="l in YOUTH_LEVELS" :key="l" :value="l">{{ l }}</option>
              </select>
            </EditField>
            <EditField label="Hall of Residence">
              <input
                v-model="form.hallOfResidence"
                type="text"
                placeholder="e.g. Akpan Isemin Hall"
              />
            </EditField>
            <EditField label="Year of Entry">
              <input
                v-model="form.yearOfEntry"
                type="number"
                min="1900"
                max="2200"
                placeholder="2023"
              />
            </EditField>
            <EditField
              label="Year of Exit"
              :error="yearRangeError"
              hint="Expected year, if still studying."
            >
              <input
                v-model="form.yearOfExit"
                type="number"
                min="1900"
                max="2200"
                placeholder="2027"
                :aria-invalid="Boolean(yearRangeError)"
              />
            </EditField>
            <EditField label="Comment" class="sm:col-span-2">
              <textarea
                v-model="form.comment"
                rows="3"
                maxlength="2000"
                placeholder="Anything else worth recording about this youth member"
              ></textarea>
            </EditField>
          </div>
        </section>
      </template>

      <hr class="border-gray-100" />

      <!-- ── Previous Congregation ─────────────────────────────────────────── -->
      <section>
        <h3 class="text-sm font-semibold text-gray-800 mb-4">
          Previous Congregation <span class="text-gray-400 font-normal text-xs">(optional)</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditField label="Congregation">
            <input
              v-model="form.previousCongregation"
              type="text"
              placeholder="Ex.: Congregação Central"
            />
          </EditField>
          <EditField label="Telefone do Pastor / Ministro">
            <input
              v-model="form.previousMinisterPhone"
              type="tel"
              placeholder="+258 84 000 0000"
            />
          </EditField>
        </div>
      </section>

      <hr class="border-gray-100" />

      <!-- ── Emergency Contact ─────────────────────────────────────────────── -->
      <section>
        <h3 class="text-sm font-semibold text-gray-800 mb-4">
          Emergency Contact <span class="text-gray-400 font-normal text-xs">(optional)</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditField label="Nome">
            <input v-model="form.ecNome" type="text" placeholder="Nome do contacto" />
          </EditField>
          <EditField label="Relationship">
            <input v-model="form.ecRelationship" type="text" placeholder="Parentesco" />
          </EditField>
          <EditField label="Telefone">
            <input v-model="form.ecPhone" type="tel" placeholder="+258 84 000 0000" />
          </EditField>
          <EditField label="Endereço">
            <input v-model="form.ecAddress" type="text" placeholder="Endereço completo" />
          </EditField>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button variant="secondary" @click="close">Cancelar</Button>
        <Button
          :loading="membersStore.saving"
          :disabled="Boolean(churchNumberError || yearRangeError)"
          @click="save"
        >
          <template #icon-left><Icon icon="mdi:account-plus-outline" /></template>
          Add Member
        </Button>
      </div>
    </template>
  </Modal>
</template>
