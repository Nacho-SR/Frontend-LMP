<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseSelect from '../components/ui/BaseSelect.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { fetchUserList } from '../api/users.service';
import { useAuthStore } from '../stores/auth.store';
import { useTeamsStore } from '../stores/teams.store';

const props = defineProps({
  teamId: { type: String, required: true },
});

const router = useRouter();
const authStore = useAuthStore();
const teamsStore = useTeamsStore();

const pageError = ref('');
const editError = ref('');
const editSuccess = ref('');
const addError = ref('');
const addSuccess = ref('');
const removeError = ref('');
const removeSuccess = ref('');
const roleError = ref('');
const roleSuccess = ref('');
const archiveError = ref('');
const adding = ref(false);
const editing = ref(false);
const savingTeam = ref(false);
const roleUpdatingId = ref(null);

const allUsers = ref([]);
const usersLoading = ref(false);
const userFilter = ref('');
const selectedUser = ref(null);
const selectedRole = ref('MEMBER');

const editForm = reactive({
  name: '',
  description: '',
  password: '',
});

const filteredUsers = computed(() => {
  const currentId = authStore.user?.id;
  const base = allUsers.value.filter((u) => u.id !== currentId);
  const q = userFilter.value.trim().toLowerCase();
  if (!q) return base;
  return base.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(q) ||
      u.userName?.toLowerCase().includes(q),
  );
});

const selectUser = (user) => {
  selectedUser.value = user;
  addError.value = '';
  addSuccess.value = '';
};

const resetForm = () => {
  selectedUser.value = null;
  selectedRole.value = 'MEMBER';
  userFilter.value = '';
  addError.value = '';
};

const loadUsers = async () => {
  try {
    usersLoading.value = true;
    const response = await fetchUserList();
    allUsers.value = response.data || [];
  } catch {
    allUsers.value = [];
  } finally {
    usersLoading.value = false;
  }
};

const confirm = reactive({ open: false, userId: null, loading: false });
const archiveConfirm = reactive({ open: false, loading: false });

// Role of the current user in this team
const myRole = computed(() => {
  const uid = authStore.user?.id;
  if (!uid) return null;
  return teamsStore.members.find((m) => m.userId === uid)?.role ?? null;
});

const canEditTeam = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));
const canArchiveTeam = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));
const canAddMembers = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));
const canRemoveMembers = computed(() => myRole.value === 'OWNER');
const canChangeRoles = computed(() => myRole.value === 'OWNER');

const roleOptions = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'CLIENT', label: 'Client' },
];

const memberDisplayName = (member) => {
  if (member.userId === authStore.user?.id) return 'You';

  return member.user?.displayName || member.user?.userName || member.userId;
};

const memberSubtitle = (member) => {
  const username = member.user?.userName ? `@${member.user.userName}` : '';
  const email = member.user?.email || '';

  if (username && email) return `${username} - ${email}`;
  return username || email || `ID: ${member.userId}`;
};

const ERRORS = {
  TEAM_NOT_FOUND: 'Team not found',
  UNAUTHORIZED: 'You have no access to this team',
  UNAUTHORIZED_TEAM_ACCESS: 'You have no permission to modify this team',
  INSUFFICIENT_TEAM_ROLE: 'Your role does not allow this action',
  USER_ALREADY_IN_TEAM: 'The user already belongs to this team',
  MEMBER_NOT_FOUND: 'Member not found',
  OWNER_CANNOT_BE_REMOVED: 'Unable to remove team owner.',
  LAST_OWNER_CANNOT_BE_CHANGED: 'Unable to change last owner',
  OWNER_CANNOT_BE_DEGRADED: 'Unalbe do demote owner',
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
    pageError.value = mapError(error, 'Unable to load the team');
  }
};

const openEditTeam = () => {
  editForm.name = teamsStore.selectedTeam?.name || '';
  editForm.description = teamsStore.selectedTeam?.description || '';
  editForm.password = '';
  editError.value = '';
  editSuccess.value = '';
  archiveError.value = '';
  editing.value = true;
};

const handleUpdateTeam = async () => {
  if (!editForm.name.trim()) {
    editError.value = 'Team name is required';
    return;
  }

  if (editForm.password && editForm.password.length < 6) {
    editError.value = 'The password must have at least 6 characters';
    return;
  }

  try {
    savingTeam.value = true;
    editError.value = '';
    editSuccess.value = '';

    const payload = {
      name: editForm.name.trim(),
      description: editForm.description,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    await teamsStore.updateTeam(props.teamId, payload);
    editSuccess.value = 'Team updated';
    editing.value = false;
  } catch (error) {
    editError.value = mapError(error, 'Unable to update team');
  } finally {
    savingTeam.value = false;
  }
};

const handleArchiveTeam = async () => {
  try {
    archiveConfirm.loading = true;
    archiveError.value = '';
    await teamsStore.archiveTeam(props.teamId);
    router.push({ name: 'teams' });
  } catch (error) {
    archiveConfirm.open = false;
    archiveError.value = mapError(error, 'Unable to archive team');
  } finally {
    archiveConfirm.loading = false;
  }
};

const handleAddMember = async () => {
  if (!selectedUser.value) return;
  try {
    adding.value = true;
    addError.value = '';
    addSuccess.value = '';
    await teamsStore.addMember(props.teamId, { userId: selectedUser.value.id, role: selectedRole.value });
    addSuccess.value = `${selectedUser.value.displayName} was added to the team`;
    resetForm();
  } catch (error) {
    addError.value = mapError(error, 'Unable to add member');
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
    removeSuccess.value = 'Member removed from team';
  } catch (error) {
    confirm.open = false;
    removeError.value = mapError(error, 'Unable to remove member');
  } finally {
    confirm.loading = false;
  }
};

const handleRoleChange = async (member, event) => {
  const role = event.target.value;
  if (!role || role === member.role) return;

  try {
    roleUpdatingId.value = member.userId;
    roleError.value = '';
    roleSuccess.value = '';
    await teamsStore.updateMemberRole(props.teamId, member.userId, role);
    roleSuccess.value = 'Role updated';
  } catch (error) {
    roleError.value = mapError(error, 'Unable to change role');
  } finally {
    roleUpdatingId.value = null;
  }
};

onMounted(() => { loadTeam(); loadUsers(); });
watch(() => props.teamId, () => { loadTeam(); resetForm(); });
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div>
      <RouterLink
        :to="{ name: 'teams' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline underline-offset-4"
      >
        ← Teams
      </RouterLink>

      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader
            :title="teamsStore.selectedTeam?.name || 'Team'"
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
    <AlertMessage v-if="archiveError" type="error" :message="archiveError" />

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

        <LoadingState v-if="teamsStore.membersLoading" message="Loading members..." />

        <EmptyState
          v-else-if="!teamsStore.members.length"
          title="No members"
          description="This team has no members."
        />

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="member in teamsStore.members"
            :key="member.id || member.userId"
            class="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-950" :title="member.user?.email || member.userId">
                {{ memberDisplayName(member) }}
              </p>
              <p class="truncate text-xs text-slate-500">{{ memberSubtitle(member) }}</p>
            </div>

            <div class="flex items-center gap-2">
              <select
                v-if="canChangeRoles && member.userId !== authStore.user?.id"
                :value="member.role"
                class="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                :disabled="roleUpdatingId === member.userId"
                @change="handleRoleChange(member, $event)">
                <option
                  v-for="option in roleOptions"
                  :key="option.value"
                  :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <StatusBadge v-else :status="member.role" />
              <button
                v-if="canRemoveMembers && member.role !== 'OWNER'"
                type="button"
                class="danger-button"
                @click="openRemoveConfirm(member.userId)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <AlertMessage v-if="removeSuccess" type="success" :message="removeSuccess" class="m-4 mt-0" />
        <AlertMessage v-if="removeError" type="error" :message="removeError" class="m-4 mt-0" />
        <AlertMessage v-if="roleSuccess" type="success" :message="roleSuccess" class="m-4 mt-0" />
        <AlertMessage v-if="roleError" type="error" :message="roleError" class="m-4 mt-0" />
      </div>

      <div class="space-y-4">
        <!-- Editar / archivar equipo -->
        <div
          v-if="canEditTeam"
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-950">Manage team</h2>
            <button
              v-if="!editing"
              type="button"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              @click="openEditTeam"
            >
              Edit
            </button>
          </div>

          <template v-if="editing">
            <div class="mt-4 space-y-1">
              <BaseInput id="edit-team-name" v-model="editForm.name" label="Name" required />
              <BaseTextarea id="edit-team-desc" v-model="editForm.description" label="Description" :rows="2" />
              <BaseInput
                id="edit-team-password"
                v-model="editForm.password"
                label="New access password"
                type="password"
                minlength="6"
                placeholder="Leave empty for no changes"
              />
            </div>

            <AlertMessage v-if="editError" type="error" :message="editError" class="mt-3" />

            <div class="mt-4 flex gap-2">
              <BaseButton
                :loading="savingTeam"
                class="flex-1"
                @click="handleUpdateTeam"
              >
                Save
              </BaseButton>
              <BaseButton
                variant="secondary"
                :disabled="savingTeam"
                @click="editing = false"
              >
                Cancel
              </BaseButton>
            </div>
          </template>

          <AlertMessage v-if="editSuccess && !editing" type="success" :message="editSuccess" class="mt-3" />

          <div
            v-if="canArchiveTeam"
            class="mt-4 border-t border-slate-100 pt-4">
            <BaseButton
              variant="danger"
              class="w-full justify-center"
              @click="archiveConfirm.open = true">
              Archive team
            </BaseButton>
          </div>
        </div>

        <!-- Agregar miembro (solo OWNER/MANAGER) -->
        <div
          v-if="canAddMembers"
          class="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-base font-semibold text-slate-950">Add member</h2>
          </div>

          <!-- Barra de búsqueda -->
          <div class="px-4 pt-3">
            <BaseInput
              id="user-filter"
              v-model="userFilter"
              placeholder="Seach by name or user…"
              :disabled="usersLoading"
            />
          </div>

          <!-- Lista de usuarios -->
          <div class="mt-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
            <LoadingState v-if="usersLoading" message="Loading users…" />

            <EmptyState
              v-else-if="userFilter.trim() && !filteredUsers.length"
              title="No results"
              description="No matching users."/>

            <button
              v-for="user in filteredUsers"
              :key="user.id"
              type="button"
              :class="[
                'flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors',
                selectedUser?.id === user.id
                  ? 'bg-indigo-50'
                  : 'hover:bg-slate-50',
              ]"
              @click="selectUser(user)">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-950">{{ user.displayName }}</p>
                <p class="truncate text-xs text-slate-400">@{{ user.userName }}</p>
              </div>
              <svg
                v-if="selectedUser?.id === user.id"
                class="ml-2 h-4 w-4 shrink-0 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>

          <!-- Rol + botón agregar (solo cuando hay usuario seleccionado) -->
          <div v-if="selectedUser" class="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
            <div class="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
              <p class="flex-1 truncate text-sm font-medium text-indigo-900">{{ selectedUser.displayName }}</p>
              <button type="button" class="text-xs text-indigo-400 hover:text-indigo-600" @click="resetForm">✕</button>
            </div>
            <BaseSelect id="member-role" v-model="selectedRole" label="Role" :options="roleOptions" />
            <AlertMessage v-if="addError" type="error" :message="addError" />
            <BaseButton :loading="adding" class="w-full" @click="handleAddMember">Add</BaseButton>
          </div>

          <div v-if="addSuccess" class="px-4 pb-4">
            <AlertMessage type="success" :message="addSuccess" />
          </div>
        </div>

        <!-- Aviso si no tiene permisos -->
        <div
          v-else-if="myRole"
          class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm"
        >
          Only managers and owners can add members.
        </div>
      </div>
    </div>

    <!-- Confirmación de quitar miembro -->
    <ConfirmDialog
      :open="confirm.open"
      title="Remove member?"
      description="If you do this you will have to add the member back manually."
      confirm-label="Remove"
      confirm-variant="danger"
      :loading="confirm.loading"
      @confirm="handleRemoveMember"
      @cancel="confirm.open = false"
    />

    <ConfirmDialog
      :open="archiveConfirm.open"
      title="Archive team?"
      description="The team will no longer be active and all of the children elements will be affected"
      confirm-label="Archive"
      confirm-variant="danger"
      :loading="archiveConfirm.loading"
      @confirm="handleArchiveTeam"
      @cancel="archiveConfirm.open = false"
    />
  </section>
</template>
