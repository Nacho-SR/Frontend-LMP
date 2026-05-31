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
const activeForm = ref(null); // 'create' | 'join' | null
const createError = ref('');
const joinError = ref('');
const creating = ref(false);
const joining = ref(false);

const toggleForm = (form) => {
  activeForm.value = activeForm.value === form ? null : form;
};

const createForm = reactive({ name: '', description: '', password: '' });
const joinForm = reactive({ teamId: '', password: '' });

const JOIN_ERRORS = {
  TEAM_NOT_FOUND: 'No team with this id',
  TEAM_NOT_ACTIVE: 'This team is no longer active',
  USER_ALREADY_IN_TEAM: 'You already belong at a team',
  INVALID_TEAM_PASSWORD: 'Incorrect password',
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
    activeForm.value = null;
  } catch (error) {
    createError.value = mapError(error, 'Unable to create team');
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
    activeForm.value = null;
  } catch (error) {
    joinError.value = mapError(error, 'Unable to join team');
  } finally {
    joining.value = false;
  }
};

onMounted(() => teamsStore.fetchTeams());
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Teams" subtitle="Collaboration" />

    <div class="space-y-6">
      <!-- Lista de equipos -->
      <div>
        <LoadingState v-if="teamsStore.loading" message="Loading teams..." />

        <div
          v-else-if="!teamsStore.teams.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="You are not in any team yeat"
            description="Create one or join an already existing one.">
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
              {{ team.description || 'No description' }}
            </p>

            <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p class="truncate font-mono text-xs text-slate-400" :title="team.id">
                {{ team.id.slice(0, 16) }}…
              </p>
              <RouterLink
                :to="{ name: 'team-detail', params: { teamId: team.id } }"
                class="secondary-button"
              >
                View team
              </RouterLink>
            </div>
          </article>
        </div>
      </div>

      <!-- Botones y formularios -->
      <div class="space-y-3">
        <!-- Botones -->
        <div class="flex gap-2">
          <button
            type="button"
            :class="[
              'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              activeForm === 'create'
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="toggleForm('create')"
          >
            + Create team
          </button>
          <button
            type="button"
            :class="[
              'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              activeForm === 'join'
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
            @click="toggleForm('join')"
          >
            Join
          </button>
        </div>

        <!-- Crear equipo -->
        <form
          v-if="activeForm === 'create'"
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleCreateTeam"
        >
          <div class="space-y-1">
            <BaseInput id="team-name" v-model="createForm.name" label="Name" required />
            <BaseTextarea id="team-desc" v-model="createForm.description" label="Description" :rows="2" />
            <BaseInput id="team-password" v-model="createForm.password" label="Access password" type="password" minlength="6" required />
          </div>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />

          <BaseButton type="submit" :loading="creating" class="mt-4 w-full">
            Create team
          </BaseButton>
        </form>

        <!-- Unirse a equipo -->
        <form
          v-if="activeForm === 'join'"
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleJoinTeam"
        >
          <div class="space-y-1">
            <BaseInput id="join-id" v-model="joinForm.teamId" label="ID del equipo" required />
            <BaseInput id="join-password" v-model="joinForm.password" label="Contraseña" type="password" minlength="6" required />
          </div>

          <AlertMessage v-if="joinError" type="error" :message="joinError" class="mt-3" />

          <BaseButton type="submit" variant="secondary" :loading="joining" class="mt-4 w-full justify-center">
            Join
          </BaseButton>
        </form>
      </div>
    </div>
  </section>
</template>
