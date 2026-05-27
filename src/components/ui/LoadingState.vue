<script setup>
defineProps({
  message: { type: String, default: 'Cargando...' },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <svg
      class="mb-3 h-8 w-8 animate-spin text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <p class="text-sm text-slate-500">{{ message }}</p>
  </div>
</template>
