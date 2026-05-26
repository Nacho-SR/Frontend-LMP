<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  displayName: '',
  userName: '',
  email: '',
  password: '',
});

const handleRegister = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';

    await authStore.register(form);

    router.push({ name: 'login' });
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      'No se pudo crear la cuenta';
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
          Crear cuenta
        </h1>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-field">
          <label for="displayName">Nombre</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            required
            minlength="3"
            class="text-input"
          />
        </div>

        <div class="form-field">
          <label for="userName">Usuario</label>
          <input
            id="userName"
            v-model="form.userName"
            type="text"
            required
            minlength="3"
            class="text-input"
          />
        </div>

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
            autocomplete="new-password"
            required
            minlength="6"
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
          {{ loading ? 'Creando...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        Ya tienes cuenta?
        <RouterLink
          :to="{ name: 'login' }"
          class="font-medium text-slate-950 underline underline-offset-4"
        >
          Iniciar sesion
        </RouterLink>
      </p>
    </section>
  </main>
</template>
