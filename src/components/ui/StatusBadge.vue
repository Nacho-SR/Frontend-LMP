<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, required: true },
});

const labelMap = {
  // Task status
  PENDING:     'Pendiente',
  IN_PROGRESS: 'En progreso',
  REVIEW:      'En revisión',
  COMPLETED:   'Completada',
  CANCELLED:   'Cancelada',
  // Pro Team status
  ACTIVE:      'Activo',
  INACTIVE:    'Inactivo',
  ARCHIVED:    'Archivado',
  // User status
  online:      'En línea',
  offline:     'Desconectado',
  // Team roles
  OWNER:       'Owner',
  MANAGER:     'Manager',
  MEMBER:      'Miembro',
  CLIENT:      'Cliente',
  // Global roles
  admin:       'Admin',
  user:        'Usuario',
  client:      'Cliente',
};

const colorMap = {
  PENDING:     'border-amber-200 bg-amber-50 text-amber-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  REVIEW:      'border-violet-200 bg-violet-50 text-violet-700',
  COMPLETED:   'border-green-200 bg-green-50 text-green-700',
  CANCELLED:   'border-red-200 bg-red-50 text-red-700',
  ACTIVE:      'border-green-200 bg-green-50 text-green-700',
  INACTIVE:    'border-slate-200 bg-slate-50 text-slate-500',
  ARCHIVED:    'border-slate-200 bg-slate-100 text-slate-500',
  online:      'border-green-200 bg-green-50 text-green-700',
  offline:     'border-slate-200 bg-slate-50 text-slate-500',
  OWNER:       'border-indigo-200 bg-indigo-50 text-indigo-700',
  MANAGER:     'border-blue-200 bg-blue-50 text-blue-700',
  MEMBER:      'border-slate-200 bg-slate-50 text-slate-600',
  CLIENT:      'border-teal-200 bg-teal-50 text-teal-700',
  admin:       'border-violet-200 bg-violet-50 text-violet-700',
  user:        'border-slate-200 bg-slate-50 text-slate-600',
  client:      'border-teal-200 bg-teal-50 text-teal-700',
};

const label = computed(() => labelMap[props.status] ?? props.status);
const color = computed(() => colorMap[props.status] ?? 'border-slate-200 bg-slate-50 text-slate-600');
</script>

<template>
  <span :class="['inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium', color]">
    {{ label }}
  </span>
</template>
