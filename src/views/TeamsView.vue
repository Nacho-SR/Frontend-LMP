<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useTeamsStore } from '../stores/teams.store';

const teamsStore = useTeamsStore();
const createError = ref('');
const joinError = ref('');
const creating = ref(false);
const joining = ref(false);

const createForm = reactive({
  name: '',
  description: '',
  password: '',
});

const joinForm = reactive({
  teamId: '',
  password: '',
});

const resetCreateForm = () => {
  createForm.name = '';
  createForm.description = '';
  createForm.password = '';
};

const resetJoinForm = () => {
  joinForm.teamId = '';
  joinForm.password = '';
};

const handleCreateTeam = async () => {
  try {
    creating.value = true;
    createError.value = '';

    await teamsStore.createTeam(createForm);
    resetCreateForm();
  } catch (error) {
    createError.value =
      error.response?.data?.message ||
      'No se pudo crear el equipo';
  } finally {
    creating.value = false;
  }
};

const handleJoinTeam = async () => {
  try {
    joining.value = true;
    joinError.value = '';

    await teamsStore.joinTeam(joinForm.teamId, {
      password: joinForm.password,
    });
    resetJoinForm();
  } catch (error) {
    joinError.value =
      error.response?.data?.message ||
      'No se pudo unir al equipo';
  } finally {
    joining.value = false;
  }
};

onMounted(() => {
  teamsStore.fetchTeams();
});
</script>

<template>
  <section class="space-y-6">
    <div>
      <p class="text-sm font-medium text-slate-500">
        Colaboracion
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        Equipos
      </h1>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="space-y-4">
        <div
          v-if="teamsStore.loading"
          class="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600"
        >
          Cargando equipos...
        </div>

        <div
          v-else-if="!teamsStore.teams.length"
          class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center"
        >
          <h2 class="text-lg font-semibold text-slate-950">
            Todavia no perteneces a equipos
          </h2>
          <p class="mt-2 text-sm text-slate-600">
            Crea uno o unete con el identificador y password del equipo.
          </p>
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-2"
        >
          <article
            v-for="team in teamsStore.teams"
            :key="team.id"
            class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold text-slate-950">
                  {{ team.name }}
                </h2>
                <p class="mt-1 line-clamp-2 text-sm text-slate-600">
                  {{ team.description || 'Sin descripcion' }}
                </p>
              </div>
              <span class="status-pill">
                {{ team.status || 'ACTIVE' }}
              </span>
            </div>

            <div class="mt-5 flex items-center justify-between gap-3">
              <p class="truncate text-xs text-slate-500">
                ID: {{ team.id }}
              </p>
              <RouterLink
                :to="{ name: 'team-detail', params: { teamId: team.id } }"
                class="secondary-button"
              >
                Ver
              </RouterLink>
            </div>
          </article>
        </div>
      </div>

      <aside class="space-y-4">
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleCreateTeam"
        >
          <h2 class="text-base font-semibold text-slate-950">
            Crear equipo
          </h2>

          <div class="mt-4 space-y-4">
            <div class="form-field">
              <label for="team-name">Nombre</label>
              <input
                id="team-name"
                v-model="createForm.name"
                required
                class="text-input"
              />
            </div>

            <div class="form-field">
              <label for="team-description">Descripcion</label>
              <textarea
                id="team-description"
                v-model="createForm.description"
                rows="3"
                class="text-input"
              />
            </div>

            <div class="form-field">
              <label for="team-password">Password</label>
              <input
                id="team-password"
                v-model="createForm.password"
                type="password"
                minlength="6"
                required
                class="text-input"
              />
            </div>
          </div>

          <p
            v-if="createError"
            class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ createError }}
          </p>

          <button
            type="submit"
            :disabled="creating"
            class="primary-button mt-5 w-full"
          >
            {{ creating ? 'Creando...' : 'Crear equipo' }}
          </button>
        </form>

        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleJoinTeam"
        >
          <h2 class="text-base font-semibold text-slate-950">
            Unirse a equipo
          </h2>

          <div class="mt-4 space-y-4">
            <div class="form-field">
              <label for="join-team-id">ID del equipo</label>
              <input
                id="join-team-id"
                v-model="joinForm.teamId"
                required
                class="text-input"
              />
            </div>

            <div class="form-field">
              <label for="join-password">Password</label>
              <input
                id="join-password"
                v-model="joinForm.password"
                type="password"
                minlength="6"
                required
                class="text-input"
              />
            </div>
          </div>

          <p
            v-if="joinError"
            class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ joinError }}
          </p>

          <button
            type="submit"
            :disabled="joining"
            class="secondary-button mt-5 w-full justify-center"
          >
            {{ joining ? 'Uniendo...' : 'Unirse' }}
          </button>
        </form>
      </aside>
    </div>
  </section>
</template>
