<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseSelect from '../components/ui/BaseSelect.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useProjectsStore } from '../stores/projects.store';
import { useTeamsStore } from '../stores/teams.store';

const projectsStore = useProjectsStore();
const teamsStore = useTeamsStore();

const listError = ref('');
const createError = ref('');
const createSuccess = ref('');
const creating = ref(false);

const createForm = reactive({ name: '', description: '', teamId: '' });

const teamOptions = computed(() =>
  teamsStore.teams.map((t) => ({ value: t.id, label: t.name })),
);

const teamName = (teamId) =>
  teamsStore.teams.find((t) => t.id === teamId)?.name ?? '—';

const ERRORS = {
  INSUFFICIENT_TEAM_ROLE: 'You do not have permissions to create projects for this team',
  UNAUTHORIZED_TEAM_ACCESS: 'You are not a member of this team',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return ERRORS[code] || error.response?.data?.message || fallback;
};

const handleCreate = async () => {
  try {
    creating.value = true;
    createError.value = '';
    createSuccess.value = '';
    await projectsStore.createProject({ ...createForm });
    createSuccess.value = 'Project created correctly';
    createForm.name = '';
    createForm.description = '';
  } catch (error) {
    createError.value = mapError(error, 'Unable to create a project');
  } finally {
    creating.value = false;
  }
};

onMounted(async () => {
  await teamsStore.fetchTeams();
  if (teamOptions.value.length) createForm.teamId = teamOptions.value[0].value;
  try {
    await projectsStore.fetchProjects();
  } catch {
    listError.value = 'Unable to load projects';
  }
});
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Projects" subtitle="Management" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de proyectos -->
      <div>
        <AlertMessage v-if="listError" type="error" :message="listError" class="mb-4" />
        <LoadingState v-if="projectsStore.loading" message="Load projects..." />

        <div
          v-else-if="!projectsStore.projects.length && !listError"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="No projects"
            description="Create your first project."
          >
            <template #icon>
              <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </template>
          </EmptyState>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="project in projectsStore.projects"
            :key="project.id"
            class="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <h2 class="truncate text-base font-semibold text-slate-950">{{ project.name }}</h2>
              <StatusBadge :status="project.status || 'ACTIVE'" />
            </div>

            <p class="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
              {{ project.description || 'No description' }}
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Team: <span class="font-medium text-slate-600">{{ teamName(project.teamId) }}</span>
            </p>

            <div class="mt-4 flex items-center justify-end border-t border-slate-100 pt-4">
              <RouterLink
                :to="{ name: 'project-detail', params: { projectId: project.id } }"
                class="secondary-button"
              >
                View Project
              </RouterLink>
            </div>
          </article>
        </div>
      </div>

      <!-- Crear proyecto -->
      <aside>
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleCreate"
        >
          <h2 class="text-base font-semibold text-slate-950">Create project</h2>

          <div class="mt-4 space-y-1">
            <BaseInput id="proj-name" v-model="createForm.name" label="Name" required />
            <BaseTextarea id="proj-desc" v-model="createForm.description" label="Description" :rows="2" />
            <BaseSelect
              id="proj-team"
              v-model="createForm.teamId"
              label="Team"
              :options="teamOptions"
              :disabled="!teamOptions.length"
            />
          </div>

          <p v-if="!teamOptions.length" class="mt-2 text-xs text-slate-400">
            You must belong to a team to create a project.
          </p>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />
          <AlertMessage v-if="createSuccess" type="success" :message="createSuccess" class="mt-3" />

          <BaseButton
            type="submit"
            :loading="creating"
            :disabled="!teamOptions.length"
            class="mt-4 w-full"
          >
            Create project
          </BaseButton>
        </form>
      </aside>
    </div>
  </section>
</template>
