<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'You sure?' },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  confirmVariant: {
    type: String,
    default: 'danger',
    validator: (v) => ['danger', 'primary'].includes(v),
  },
  loading: { type: Boolean, default: false },
});

defineEmits(['confirm', 'cancel']);

const variantClass = {
  danger: 'danger-button',
  primary: 'primary-button',
};
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="$emit('cancel')" />

        <!-- Card -->
        <div class="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <h2 class="text-base font-semibold text-slate-950">{{ title }}</h2>
          <p v-if="description" class="mt-2 text-sm text-slate-600">{{ description }}</p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="secondary-button"
              :disabled="loading"
              @click="$emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              :class="variantClass[confirmVariant]"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              <svg v-if="loading" class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
