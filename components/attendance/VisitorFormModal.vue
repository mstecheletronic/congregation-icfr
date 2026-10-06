<script setup lang="ts">
import type { Visitor } from '~/types'

interface Props {
  modelValue: boolean
  /** The service this visit belongs to. Shown, not edited — the card owns the date. */
  date: string
  serviceType: string
  /** Passed to edit an existing visit; omitted to record a new one. */
  visitor?: Visitor | null
}

const props = withDefaults(defineProps<Props>(), { visitor: null })

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  save: [payload: Omit<Visitor, 'id' | 'createdAt'>]
}>()

const visitorsStore = useVisitorsStore()

const blank = { name: '', address: '', phone: '', email: '', church: '' }
const form = reactive({ ...blank })
const errors = reactive({ name: '', email: '' })

const isEdit = computed(() => Boolean(props.visitor))

/**
 * Reset from the prop each time the modal opens, rather than once on mount. The card keeps one
 * instance of this component and swaps `visitor` on it, so binding at mount would show the
 * previous visitor's details the second time it was opened.
 */
watch(
  () => [props.modelValue, props.visitor] as const,
  ([open]) => {
    if (!open) return
    Object.assign(form, blank, props.visitor ? pick(props.visitor) : {})
    Object.assign(errors, { name: '', email: '' })
  },
  { immediate: true }
)

function pick(v: Visitor) {
  return {
    name: v.name ?? '',
    address: v.address ?? '',
    phone: v.phone ?? '',
    email: v.email ?? '',
    church: v.church ?? '',
  }
}

function save() {
  errors.name = form.name.trim() ? '' : 'O nome é obrigatório'
  // Optional, but if given it should be an address that could receive a reply.
  errors.email =
    !form.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? ''
      : 'Introduza um email válido ou deixe o campo vazio'

  if (errors.name || errors.email) return

  // Blank optional fields are dropped rather than stored as empty strings, so a visitor who gave
  // only a name has no address field at all instead of an address that looks recorded-and-empty.
  emit('save', {
    name: form.name.trim(),
    address: form.address.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    church: form.church.trim() || undefined,
    date: props.date,
    serviceType: props.serviceType,
  })
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="isEdit ? 'Editar Visitante' : 'Registar Visitante'"
    size="xl"
    @update:model-value="close"
  >
    <div class="flex flex-col gap-4">
      <p class="text-xs text-gray-500">{{ serviceType }} · {{ formatDate(date, 'full') }}</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EditField label="Nome Completo *" :error="errors.name" class="sm:col-span-2">
          <input
            v-model="form.name"
            type="text"
            placeholder="Digite o nome completo do visitante"
            :aria-invalid="Boolean(errors.name)"
          />
        </EditField>

        <EditField label="Telefone">
          <input v-model="form.phone" type="tel" placeholder="+258 84 000 0000" />
        </EditField>

        <EditField label="Email" :error="errors.email">
          <input
            v-model="form.email"
            type="email"
            placeholder="visitor@example.com"
            :aria-invalid="Boolean(errors.email)"
          />
        </EditField>

        <EditField label="Igreja / Congregação" class="sm:col-span-2">
          <input
            v-model="form.church"
            type="text"
            placeholder="Ex.: ICFR Beira Sede — ou deixe em branco"
          />
        </EditField>

        <EditField label="Endereço" class="sm:col-span-2">
          <input v-model="form.address" type="text" placeholder="Ex.: Munhava, Beira" />
        </EditField>
      </div>

      <p class="text-xs text-gray-400">
        Apenas o nome é obrigatório. Registe os outros dados que o visitante desejar fornecer.
      </p>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button variant="secondary" @click="close">Cancelar</Button>
        <Button :loading="visitorsStore.saving" @click="save">
          <template #icon-left><Icon icon="mdi:account-plus-outline" /></template>
          {{ isEdit ? 'Guardar Alterações' : 'Registar Visitante' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
