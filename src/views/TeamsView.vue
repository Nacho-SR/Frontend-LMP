<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useTeamsStore } from '../stores/teams.store';

const teamsStore = useTeamsStore();
const createError = ref('');
const joinError = ref('');
const creating = ref(false);
const joining = ref(false);

const createForm = reactive({ name: '', description: '', password: '' });
const joinForm = reactive({ teamId: '', password: '' });

const JOIN_ERRORS = {
  TEAM_NOT_FOUND: 'No existe un equipo con ese ID',
  TEAM_NOT_ACTIVE: 'El equipo no está activo',
  USER_ALREADY_IN_TEAM: 'Ya perteneces a este equipo',
  INVALID_TEAM_PASSWORD: 'Contraseña de equipo incorrecta',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return JOIN_ERRORS[code] || error.response?.data?.message || fallback;
};

const handleCreateTeam = async () => {
  try {
    creating.value = true;
    createError.value = '';
    await teamsStore.createTeam(createForm);
    createForm.name = '';
    createForm.description = '';
    createForm.password = '';
  } catch (error) {
    createError.value = mapError(error, 'No se pudo crear el equipo');
  } finally {
    creating.value = false;
  }
};

const handleJoinTeam = async () => {
  try {
    joining.value = true;
    joinError.value = '';
    await teamsStore.joinTeam(joinForm.teamId, { password: joinForm.password });
    joinForm.teamId = '';
    joinForm.password = '';
  } catch (error) {
    joinError.value = mapError(error, 'No se pudo unir al equipo');
  } finally {
    joining.value = false;
  }
};

onMounted(() => teamsStore.fetchTeams());
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Equipos" subtitle="Colaboración" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de equipos -->
      <div>
        <LoadingState v-if="teamsStore.loading" message="Cargando equipos..." />

        <div
          v-else-if="!teamsStore.teams.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="Todavía no perteneces a ningún equipo"
            description="Crea uno nuevo o únete con el ID y contraseña de un equipo existente."
          >
            <template #icon>
              <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
          </EmptyState>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="team in teamsStore.teams"
            :key="team.id"
            class="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <h2 class="truncate text-base font-semibold text-slate-950">
                {{ team.name }}
              </h2>
              <StatusBadge :status="team.status || 'ACTIVE'" />
            </div>

            <p class="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
              {{ team.description || 'Sin descripción' }}
            </p>

            <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p class="truncate font-mono text-xs text-slate-400" :title="team.id">
                {{ team.id.slice(0, 16) }}…
              </p>
              <RouterLink
                :to="{ name: 'team-detail', params: { teamId: team.id } }"
                class="secondary-button"
              >
                Ver equipo
              </RouterLink>
            </div>
          </article>
        </div>
      </div>

      <!-- Formularios laterales -->
      <aside class="space-y-4">
        <!-- Crear equipo -->
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleCreateTeam"
        >
          <h2 class="text-base font-semibold text-slate-950">Crear equipo</h2>

          <div class="mt-4 space-y-1">
            <BaseInput id="team-name" v-model="createForm.name" label="Nombre" required />
            <BaseTextarea id="team-desc" v-model="createForm.description" label="Descripción" :rows="2" />
            <BaseInput id="team-password" v-model="createForm.password" label="Contraseña de acceso" type="password" minlength="6" required />
          </div>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />

          <BaseButton type="submit" :loading="creating" class="mt-4 w-full">
            Crear equipo
          </BaseButton>
        </form>

        <!-- Unirse a equipo -->
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleJoinTeam"
        >
          <h2 class="text-base font-semibold text-slate-950">Unirse a equipo</h2>

          <div class="mt-4 space-y-1">
            <BaseInput id="join-id" v-model="joinForm.teamId" label="ID del equipo" required />
            <BaseInput id="join-password" v-model="joinForm.password" label="Contraseña" type="password" minlength="6" required />
          </div>

          <AlertMessage v-if="joinError" type="error" :message="joinError" class="mt-3" />

          <BaseButton type="submit" variant="secondary" :loading="joining" class="mt-4 w-full justify-center">
            Unirse
          </BaseButton>
        </form>
      </aside>
    </div>
  </section>
</template>
