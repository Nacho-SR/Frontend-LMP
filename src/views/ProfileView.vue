<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const passwordForm = reactive({
  oldPassword: '',
  password: '',
  confirmPassword: '',
});

const passwordLoading = ref(false);
const passwordError = ref('');
const passwordSuccess = ref(false);

const handleChangePassword = async () => {
  passwordError.value = '';
  passwordSuccess.value = false;

  if (passwordForm.password !== passwordForm.confirmPassword) {
    passwordError.value = 'Las contraseñas nuevas no coinciden';
    return;
  }

  if (passwordForm.password.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres';
    return;
  }

  try {
    passwordLoading.value = true;
    await authStore.changePassword({
      oldPassword: passwordForm.oldPassword,
      password: passwordForm.password,
    });
    passwordSuccess.value = true;
    passwordForm.oldPassword = '';
    passwordForm.password = '';
    passwordForm.confirmPassword = '';
  } catch (error) {
    passwordError.value =
      error.response?.data?.message || 'No se pudo cambiar la contraseña';
  } finally {
    passwordLoading.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <section class="space-y-6">
    <div>
      <p class="text-sm font-medium text-slate-500">Cuenta</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Mi perfil</h1>
    </div>

    <!-- Datos del usuario -->
    <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-semibold text-slate-950">Información personal</h2>
      </div>

      <div class="px-6 py-5">
        <div class="flex items-center gap-4">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-900 text-lg font-semibold text-white">
            {{ (authStore.user?.displayName || authStore.user?.userName || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() }}
          </div>
          <div>
            <p class="text-base font-semibold text-slate-950">
              {{ authStore.user?.displayName || '—' }}
            </p>
            <p class="text-sm text-slate-500">@{{ authStore.user?.userName || '—' }}</p>
          </div>
        </div>

        <dl class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
            <dd class="mt-1 text-sm text-slate-950">{{ authStore.user?.email || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Rol global</dt>
            <dd class="mt-1">
              <span class="status-pill">{{ authStore.user?.role || 'user' }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</dt>
            <dd class="mt-1">
              <span class="status-pill">{{ authStore.user?.status || 'active' }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Cambio de contraseña -->
    <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-semibold text-slate-950">Cambiar contraseña</h2>
      </div>

      <form class="px-6 py-5" @submit.prevent="handleChangePassword">
        <div class="max-w-sm space-y-4">
          <div class="form-field mb-0">
            <label for="oldPassword">Contraseña actual</label>
            <input
              id="oldPassword"
              v-model="passwordForm.oldPassword"
              type="password"
              required
              class="text-input"
              autocomplete="current-password"
            />
          </div>

          <div class="form-field mb-0">
            <label for="newPassword">Nueva contraseña</label>
            <input
              id="newPassword"
              v-model="passwordForm.password"
              type="password"
              required
              minlength="6"
              class="text-input"
              autocomplete="new-password"
            />
          </div>

          <div class="form-field mb-0">
            <label for="confirmPassword">Confirmar nueva contraseña</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              minlength="6"
              class="text-input"
              autocomplete="new-password"
            />
          </div>

          <p
            v-if="passwordError"
            class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ passwordError }}
          </p>

          <p
            v-if="passwordSuccess"
            class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            Contraseña actualizada correctamente
          </p>

          <button
            type="submit"
            :disabled="passwordLoading"
            class="primary-button"
          >
            {{ passwordLoading ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Zona peligrosa / Logout -->
    <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-semibold text-slate-950">Sesión</h2>
      </div>
      <div class="px-6 py-5">
        <p class="mb-4 text-sm text-slate-600">
          Cierra sesión en este dispositivo. Tendrás que volver a iniciar sesión para acceder.
        </p>
        <button type="button" class="danger-button" @click="handleLogout">
          Cerrar sesión
        </button>
      </div>
    </div>
  </section>
</template>
