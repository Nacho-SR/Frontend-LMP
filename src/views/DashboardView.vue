<script setup>
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
</script>

<template>
  <section class="space-y-6">
    <div>
      <p class="text-sm font-medium text-slate-500">
        Inicio
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        Dashboard
      </h1>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-lg font-medium text-slate-950">
        Bienvenido, {{ authStore.user?.displayName || authStore.user?.userName || 'usuario' }}
      </p>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Esta base ya usa sesion protegida, token del backend y navegacion privada.
        El siguiente bloque natural sera conectar proyectos y tareas sobre los equipos.
      </p>
    </div>
  </section>
</template>
