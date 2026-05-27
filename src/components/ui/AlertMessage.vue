<script setup>
defineProps({
  type: {
    type: String,
    default: 'error',
    validator: (v) => ['error', 'success', 'warning', 'info'].includes(v),
  },
  message: { type: String, default: '' },
});

const styles = {
  error:   'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info:    'border-blue-200 bg-blue-50 text-blue-700',
};

const icons = {
  error:   'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};
</script>

<template>
  <div
    v-if="message || $slots.default"
    :class="['flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm', styles[type]]"
  >
    <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" :d="icons[type]" />
    </svg>
    <span><slot>{{ message }}</slot></span>
  </div>
</template>
