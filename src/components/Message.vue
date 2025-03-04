<template>
  <teleport to="body">
    <transition
        enter-active-class="transform transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transform transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
    >
      <div
          v-if="visible"
          class="fixed top-4 left-1/2 -translate-x-1/2 min-w-80 px-6 py-4 rounded shadow-lg backdrop-blur-sm flex items-center"
          :class="typeStyles"
      >
        <span :class="iconClass" class="text-lg mr-2"></span>
        <span class="flex-1">{{ message }}</span>
        <span class="i-mdi-close cursor-pointer ml-2" @click="close"></span>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed,type Ref } from 'vue'

type MessageType = 'info' | 'success' | 'warning' | 'error'

interface Props {
  type?: MessageType
  message: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000
})

const visible = ref(false)
const timer: Ref<number | null> = ref(null)

const typeStyles = computed(() => {
  const styles: Record<MessageType, string> = {
    info: 'bg-blue-500/20 text-white dark:text-blue-100',
    success: 'bg-green-500/20 text-green-700 dark:text-green-100',
    warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-100',
    error: 'bg-red-500/20 text-red-700 dark:text-red-100'
  }
  return styles[props.type]
})

const iconClass = computed(() => {
  const icons: Record<MessageType, string> = {
    info: 'i-mdi-information-circle-outline',
    success: 'i-mdi-check-circle-outline',
    warning: 'i-mdi-alert-circle-outline',
    error: 'i-mdi-close-circle-outline'
  }
  return icons[props.type]
})

onMounted(() => {
  visible.value = true
  startTimer()
})

const startTimer = () => {
  if (props.duration > 0) {
    timer.value = setTimeout(() => {
      close()
    }, props.duration) as unknown as number
  }
}

const close = () => {
  visible.value = false
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
}
</script>