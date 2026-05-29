import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';
import ProtectedLayout from '../components/layout/ProtectedLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import ProfileView from '../views/ProfileView.vue';
import ProjectDetailView from '../views/ProjectDetailView.vue';
import ProjectsView from '../views/ProjectsView.vue';
import RegisterView from '../views/RegisterView.vue';
import TasksView from '../views/TasksView.vue';
import KanbanView from '../views/KanbanView.vue';
import TeamDetailView from '../views/TeamDetailView.vue';
import TeamsView from '../views/TeamsView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },

  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },

  {
    path: '/',
    component: ProtectedLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'teams',
        name: 'teams',
        component: TeamsView,
      },
      {
        path: 'teams/:teamId',
        name: 'team-detail',
        component: TeamDetailView,
        props: true,
      },
      {
        path: 'projects',
        name: 'projects',
        component: ProjectsView,
      },
      {
        path: 'projects/:projectId',
        name: 'project-detail',
        component: ProjectDetailView,
        props: true,
      },
      {
        path: 'projects/:projectId/kanban/:chartId',
        name: 'kanban',
        component: KanbanView,
        props: true,
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: TasksView,
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: NotificationsView,
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  await authStore.initialize();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (
    (to.name === 'login' || to.name === 'register') &&
    authStore.isAuthenticated
  ) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
