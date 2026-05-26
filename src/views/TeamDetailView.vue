<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useTeamsStore } from '../stores/teams.store';

const props = defineProps({
  teamId: {
    type: String,
    required: true,
  },
});

const teamsStore = useTeamsStore();
const addError = ref('');
const pageError = ref('');
const adding = ref(false);

const memberForm = reactive({
  userId: '',
  role: 'MEMBER',
});

const loadTeam = async () => {
  try {
    pageError.value = '';
    await Promise.all([
      teamsStore.fetchTeam(props.teamId),
      teamsStore.fetchMembers(props.teamId),
    ]);
  } catch (error) {
    pageError.value =
      error.response?.data?.message ||
      'No se pudo cargar el equipo';
  }
};

const handleAddMember = async () => {
  try {
    adding.value = true;
    addError.value = '';

    await teamsStore.addMember(props.teamId, memberForm);
    memberForm.userId = '';
    memberForm.role = 'MEMBER';
  } catch (error) {
    addError.value =
      error.response?.data?.message ||
      'No se pudo agregar el miembro';
  } finally {
    adding.value = false;
  }
};

const handleRemoveMember = async (userId) => {
  await teamsStore.removeMember(props.teamId, userId);
};

onMounted(loadTeam);

watch(
  () => props.teamId,
  () => loadTeam()
);
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <RouterLink
          :to="{ name: 'teams' }"
          class="text-sm font-medium text-slate-500 underline underline-offset-4"
        >
          Volver a equipos
        </RouterLink>
        <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {{ teamsStore.selectedTeam?.name || 'Equipo' }}
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          {{ teamsStore.selectedTeam?.description || 'Administra miembros y roles del equipo.' }}
        </p>
      </div>

      <span class="status-pill self-start sm:self-auto">
        {{ teamsStore.selectedTeam?.status || 'ACTIVE' }}
      </span>
    </div>

    <p
      v-if="pageError"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ pageError }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-950">
            Miembros
          </h2>
        </div>

        <div
          v-if="teamsStore.membersLoading"
          class="p-5 text-sm text-slate-600"
        >
          Cargando miembros...
        </div>

        <div
          v-else-if="!teamsStore.members.length"
          class="p-5 text-sm text-slate-600"
        >
          No hay miembros para mostrar.
        </div>

        <div
          v-else
          class="divide-y divide-slate-200"
        >
          <div
            v-for="member in teamsStore.members"
            :key="member.id || member.userId"
            class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-950">
                {{ member.displayName || member.userName || member.userId }}
              </p>
              <p class="truncate text-sm text-slate-500">
                {{ member.email || member.userId }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span class="status-pill">
                {{ member.role }}
              </span>
              <button
                type="button"
                class="danger-button"
                @click="handleRemoveMember(member.userId)"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>

      <form
        class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        @submit.prevent="handleAddMember"
      >
        <h2 class="text-base font-semibold text-slate-950">
          Agregar miembro
        </h2>

        <div class="mt-4 space-y-4">
          <div class="form-field">
            <label for="member-user-id">ID de usuario</label>
            <input
              id="member-user-id"
              v-model="memberForm.userId"
              required
              class="text-input"
            />
          </div>

          <div class="form-field">
            <label for="member-role">Rol</label>
            <select
              id="member-role"
              v-model="memberForm.role"
              class="text-input"
            >
              <option value="MANAGER">MANAGER</option>
              <option value="MEMBER">MEMBER</option>
              <option value="CLIENT">CLIENT</option>
            </select>
          </div>
        </div>

        <p
          v-if="addError"
          class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ addError }}
        </p>

        <button
          type="submit"
          :disabled="adding"
          class="primary-button mt-5 w-full"
        >
          {{ adding ? 'Agregando...' : 'Agregar miembro' }}
        </button>
      </form>
    </div>
  </section>
</template>
