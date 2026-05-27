<script setup>
defineOptions({ inheritAttrs: false });

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  id: { type: String, required: true },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="form-field">
    <label v-if="label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-bind="$attrs"
      :value="modelValue"
      :class="['text-input', error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '']"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>
