<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    await authStore.login(form);

    router.push(route.query.redirect || '/');
  } catch (error) {
    const code = error.response?.data?.error?.code;
    const errorMap = {
      INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
      ACCOUNT_LOCKED: 'Cuenta bloqueada por demasiados intentos fallidos. Contacta al administrador.',
      USER_NOT_FOUND: 'No existe una cuenta con ese email',
    };
    errorMessage.value = errorMap[code] || error.response?.data?.message || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
    <section class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <p class="text-sm font-medium text-slate-500">
          TaskFlow
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Iniciar sesion
        </h1>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="text-input"
          />
        </div>

        <div class="form-field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            minlength="6"
            required
            class="text-input"
          />
        </div>

        <p
          v-if="errorMessage"
          class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full"
        >
          {{ loading ? 'Ingresando...' : 'Iniciar sesion' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        No tienes cuenta?
        <RouterLink
          :to="{ name: 'register' }"
          class="font-medium text-slate-950 underline underline-offset-4"
        >
          Crear cuenta
        </RouterLink>
      </p>
    </section>
  </main>
</template>
