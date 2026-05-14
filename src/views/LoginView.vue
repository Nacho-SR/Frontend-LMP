<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
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

    router.push('/');
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-100"
  >
    <div class="bg-white p-8 rounded-lg shadow w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">
        TaskFlow Login
      </h1>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block mb-1">Email</label>

          <input
            v-model="form.email"
            type="email"
            class="w-full border rounded px-3 py-2"
          />
        </div>

        <div class="mb-4">
          <label class="block mb-1">Password</label>

          <input
            v-model="form.password"
            type="password"
            class="w-full border rounded px-3 py-2"
          />
        </div>

        <p
          v-if="errorMessage"
          class="text-red-500 mb-4"
        >
          {{ errorMessage }}
        </p>

        <button
          :disabled="loading"
          class="w-full bg-black text-white py-2 rounded"
        >
          {{
            loading
              ? 'Ingresando...'
              : 'Iniciar sesión'
          }}
        </button>
      </form>
    </div>
  </div>
</template>