<script setup>
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';

const router = useRouter();

const authStore = useAuthStore();

const logout = () => {
  authStore.logout();

  router.push('/login');
};
</script>

<template>
  <div class="p-10">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">
        Dashboard
      </h1>

      <button
        @click="logout"
        class="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>

    <div class="mt-10">
      <p>
        Bienvenido al sistema TaskFlow.
      </p>
    </div>
  </div>
</template>