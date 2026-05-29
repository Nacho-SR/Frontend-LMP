<script setup>
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const rateLimitSeconds = ref(0);

const form = reactive({
  email: '',
  password: '',
});

const isRateLimited = computed(() => rateLimitSeconds.value > 0);
const isDisabled = computed(() => loading.value || isRateLimited.value);

let countdownInterval = null;
let rateLimitHits = 0;

const startCountdown = (seconds) => {
  rateLimitSeconds.value = seconds;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    rateLimitSeconds.value -= 1;
    if (rateLimitSeconds.value <= 0) {
      clearInterval(countdownInterval);
      rateLimitHits = 0;
      errorMessage.value = '';
    }
  }, 1000);
};

const handleLogin = async () => {
  if (isDisabled.value) return;
  try {
    loading.value = true;
    errorMessage.value = '';

    await authStore.login(form);

    router.push(route.query.redirect || '/');
  } catch (error) {
    const code = error.response?.data?.error?.code;
    if (code === 'RATE_LIMIT_EXCEEDED') {
      const seconds = error.response?.data?.error?.details?.[0]?.retryAfterSeconds ?? 60;
      rateLimitHits += 1;
      if (rateLimitHits >= 2) {
        startCountdown(seconds);
        errorMessage.value = `Demasiados intentos. Espera ${seconds} segundos antes de volver a intentarlo.`;
      } else {
        errorMessage.value = 'Demasiados intentos. Espera un momento antes de volver a intentarlo.';
      }
    } else {
      const errorMap = {
        INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
        ACCOUNT_LOCKED: 'Cuenta bloqueada por demasiados intentos fallidos. Contacta al administrador.',
        USER_NOT_FOUND: 'No existe una cuenta con ese email',
      };
      errorMessage.value = errorMap[code] || error.response?.data?.message || 'Error al iniciar sesión';
    }
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

        <AlertMessage
          v-if="errorMessage"
          type="error"
          :message="errorMessage + (isRateLimited ? ` Podrás intentarlo en ${rateLimitSeconds}s.` : '')"
          class="mb-4"
        />

        <button
          type="submit"
          :disabled="isDisabled"
          class="primary-button w-full"
        >
          {{ loading ? 'Ingresando...' : isRateLimited ? `Espera ${rateLimitSeconds}s` : 'Iniciar sesion' }}
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
