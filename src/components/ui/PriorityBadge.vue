<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 1=LOW, 2=MEDIUM, 3=HIGH, 4=URGENT
  priority: { type: Number, required: true },
});

const labelMap = { 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Urgente' };

const colorMap = {
  1: 'border-green-200 bg-green-50 text-green-700',
  2: 'border-blue-200 bg-blue-50 text-blue-700',
  3: 'border-orange-200 bg-orange-50 text-orange-700',
  4: 'border-red-200 bg-red-50 text-red-700',
};

const dotColor = {
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
};

const label = computed(() => labelMap[props.priority] ?? `P${props.priority}`);
const color = computed(() => colorMap[props.priority] ?? 'border-slate-200 bg-slate-50 text-slate-600');
const dot   = computed(() => dotColor[props.priority] ?? 'bg-slate-400');
</script>

<template>
  <span :class="['inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', color]">
    <span :class="['h-1.5 w-1.5 rounded-full', dot]" />
    {{ label }}
  </span>
</template>
