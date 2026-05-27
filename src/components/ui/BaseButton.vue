<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger'].includes(v),
  },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v),
  },
});

const variantClass = {
  primary: 'primary-button',
  secondary: 'secondary-button',
  danger: 'danger-button',
};

const sizeClass = {
  sm: 'h-8 px-3 text-xs',
  md: '',
};
</script>

<template>
  <button
    v-bind="$attrs"
    :type="type"
    :disabled="loading || $attrs.disabled"
    :class="[variantClass[variant], sizeClass[size]]"
  >
    <svg
      v-if="loading"
      class="mr-2 h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
