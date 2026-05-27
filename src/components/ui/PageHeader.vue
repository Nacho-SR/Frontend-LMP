<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p v-if="subtitle" class="text-sm font-medium text-slate-500">{{ subtitle }}</p>
      <h1 :class="['font-semibold tracking-tight text-slate-950', subtitle ? 'mt-1 text-2xl' : 'text-2xl']">
        {{ title }}
      </h1>
    </div>
    <div v-if="$slots.default" class="flex shrink-0 items-center gap-2">
      <slot />
    </div>
  </div>
</template>
