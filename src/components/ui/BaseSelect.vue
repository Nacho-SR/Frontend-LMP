<script setup>
defineOptions({ inheritAttrs: false });

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  id: { type: String, required: true },
  placeholder: { type: String, default: 'Select an option' },
  options: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="form-field">
    <label v-if="label" :for="id">{{ label }}</label>
    <select
      :id="id"
      v-bind="$attrs"
      :value="modelValue"
      :class="['text-input', error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '']"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>
