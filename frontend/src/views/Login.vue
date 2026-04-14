<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-gray-900">LLM Simple Router</h1>
        <p class="text-sm text-gray-500 mt-1">管理后台登录</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="输入管理员密码"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            :disabled="loading"
          />
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'

const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!password.value) return
  error.value = ''
  loading.value = true
  try {
    await api.login(password.value)
    router.push('/admin/')
  } catch (e: any) {
    error.value = e.response?.data?.error?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
