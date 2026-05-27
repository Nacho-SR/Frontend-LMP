<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseSelect from '../components/ui/BaseSelect.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth.store';
import { useTeamsStore } from '../stores/teams.store';

const props = defineProps({
  teamId: { type: String, required: true },
});

const authStore = useAuthStore();
const teamsStore = useTeamsStore();

const pageError = ref('');
const addError = ref('');
const addSuccess = ref('');
const removeError = ref('');
const removeSuccess = ref('');
const adding = ref(false);

const memberForm = reactive({ userId: '', role: 'MEMBER' });

const confirm = reactive({ open: false, userId: null, loading: false });

// Role of the current user in this team
const myRole = computed(() => {
  const uid = authStore.user?.id;
  if (!uid) return null;
  return teamsStore.members.find((m) => m.userId === uid)?.role ?? null;
});

const canAddMembers = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));
const canRemoveMembers = computed(() => myRole.value === 'OWNER');

const roleOptions = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Miembro' },
  { value: 'CLIENT', label: 'Cliente' },
];

const ERRORS = {
  TEAM_NOT_FOUND: 'Equipo no encontrado',
  UNAUTHORIZED: 'No tienes acceso a este equipo',
  UNAUTHORIZED_TEAM_ACCESS: 'No tienes permiso para modificar este equipo',
  INSUFFICIENT_TEAM_ROLE: 'Tu rol no permite esta acción',
  USER_ALREADY_IN_TEAM: 'El usuario ya pertenece a este equipo',
  MEMBER_NOT_FOUND: 'Miembro no encontrado',
  OWNER_CANNOT_BE_REMOVED: 'No se puede quitar al propietario del equipo',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return ERRORS[code] || error.response?.data?.message || fallback;
};

const loadTeam = async () => {
  try {
    pageError.value = '';
    await Promise.all([
      teamsStore.fetchTeam(props.teamId),
      teamsStore.fetchMembers(props.teamId),
    ]);
  } catch (error) {
    pageError.value = mapError(error, 'No se pudo cargar el equipo');
  }
};

const handleAddMember = async () => {
  try {
    adding.value = true;
    addError.value = '';
    addSuccess.value = '';
    await teamsStore.addMember(props.teamId, memberForm);
    memberForm.userId = '';
    memberForm.role = 'MEMBER';
    addSuccess.value = 'Miembro agregado correctamente';
  } catch (error) {
    addError.value = mapError(error, 'No se pudo agregar el miembro');
  } finally {
    adding.value = false;
  }
};

const openRemoveConfirm = (userId) => {
  removeError.value = '';
  confirm.userId = userId;
  confirm.open = true;
};

const handleRemoveMember = async () => {
  try {
    confirm.loading = true;
    removeError.value = '';
    removeSuccess.value = '';
    await teamsStore.removeMember(props.teamId, confirm.userId);
    confirm.open = false;
    confirm.userId = null;
    removeSuccess.value = 'Miembro eliminado del equipo';
  } catch (error) {
    confirm.open = false;
    removeError.value = mapError(error, 'No se pudo quitar al miembro');
  } finally {
    confirm.loading = false;
  }
};

onMounted(loadTeam);
watch(() => props.teamId, loadTeam);
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div>
      <RouterLink
        :to="{ name: 'teams' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline underline-offset-4"
      >
        ← Equipos
      </RouterLink>

      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader
            :title="teamsStore.selectedTeam?.name || 'Equipo'"
            :subtitle="teamsStore.selectedTeam?.description || ''"
          />
        </div>
        <div class="flex items-center gap-2">
          <StatusBadge v-if="teamsStore.selectedTeam" :status="teamsStore.selectedTeam.status || 'ACTIVE'" />
          <StatusBadge v-if="myRole" :status="myRole" />
        </div>
      </div>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de miembros -->
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-950">
            Miembros
            <span v-if="teamsStore.members.length" class="ml-2 text-sm font-normal text-slate-400">
              ({{ teamsStore.members.length }})
            </span>
          </h2>
        </div>

        <LoadingState v-if="teamsStore.membersLoading" message="Cargando miembros..." />

        <EmptyState
          v-else-if="!teamsStore.members.length"
          title="Sin miembros"
          description="Este equipo no tiene miembros todavía."
        />

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="member in teamsStore.members"
            :key="member.id || member.userId"
            class="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="font-mono text-sm font-medium text-slate-950" :title="member.userId">
                {{ member.userId === authStore.user?.id ? 'Tú' : member.userId.slice(0, 12) + '…' }}
              </p>
              <p class="text-xs text-slate-400">ID: {{ member.userId }}</p>
            </div>

            <div class="flex items-center gap-2">
              <StatusBadge :status="member.role" />
              <button
                v-if="canRemoveMembers && member.role !== 'OWNER'"
                type="button"
                class="danger-button"
                @click="openRemoveConfirm(member.userId)"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>

        <AlertMessage v-if="removeSuccess" type="success" :message="removeSuccess" class="m-4 mt-0" />
        <AlertMessage v-if="removeError" type="error" :message="removeError" class="m-4 mt-0" />
      </div>

      <!-- Agregar miembro (solo OWNER/MANAGER) -->
      <div>
        <form
          v-if="canAddMembers"
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleAddMember"
        >
          <h2 class="text-base font-semibold text-slate-950">Agregar miembro</h2>

          <div class="mt-4 space-y-1">
            <BaseInput
              id="member-user-id"
              v-model="memberForm.userId"
              label="ID de usuario"
              required
              placeholder="Pega el ID del usuario"
            />
            <BaseSelect
              id="member-role"
              v-model="memberForm.role"
              label="Rol"
              :options="roleOptions"
            />
          </div>

          <AlertMessage v-if="addSuccess" type="success" :message="addSuccess" class="mt-3" />
          <AlertMessage v-if="addError" type="error" :message="addError" class="mt-3" />

          <BaseButton type="submit" :loading="adding" class="mt-4 w-full">
            Agregar
          </BaseButton>
        </form>

        <!-- Aviso si no tiene permisos -->
        <div
          v-else-if="myRole"
          class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm"
        >
          Solo el propietario y los managers pueden agregar miembros.
        </div>
      </div>
    </div>

    <!-- Confirmación de quitar miembro -->
    <ConfirmDialog
      :open="confirm.open"
      title="¿Quitar miembro?"
      description="Esta acción eliminará al usuario del equipo. No se puede deshacer."
      confirm-label="Quitar"
      confirm-variant="danger"
      :loading="confirm.loading"
      @confirm="handleRemoveMember"
      @cancel="confirm.open = false"
    />
  </section>
</template>
