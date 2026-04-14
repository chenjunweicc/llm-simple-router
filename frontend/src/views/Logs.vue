<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">请求日志</h2>
      <div class="flex items-center gap-2">
        <select v-model="filterType" @change="loadLogs" class="border rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">全部类型</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
        <button
          @click="showCleanup = true"
          class="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
        >
          清理日志
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">时间</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">类型</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">模型</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态码</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">延迟</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">流式</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">错误</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50" :class="{ 'bg-red-50/50': log.status_code >= 400 }">
            <td class="px-4 py-3 text-gray-500">{{ formatTime(log.created_at) }}</td>
            <td class="px-4 py-3">
              <span :class="log.api_type === 'openai' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'" class="px-2 py-0.5 rounded text-xs">{{ log.api_type }}</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs">{{ log.model || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="log.status_code < 400 ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ log.status_code || '-' }}</span>
            </td>
            <td class="px-4 py-3">{{ log.latency_ms ? log.latency_ms + 'ms' : '-' }}</td>
            <td class="px-4 py-3">{{ log.is_stream ? 'Yes' : 'No' }}</td>
            <td class="px-4 py-3 text-red-500 text-xs">{{ log.error_message || '-' }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">暂无日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between mt-4">
      <p class="text-sm text-gray-500">共 {{ total }} 条</p>
      <div class="flex gap-1">
        <button @click="prevPage" :disabled="page <= 1" class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">上一页</button>
        <span class="px-3 py-1 text-sm text-gray-600">第 {{ page }} 页</span>
        <button @click="nextPage" :disabled="logs.length < limit" class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">下一页</button>
      </div>
    </div>

    <!-- Cleanup Dialog -->
    <div v-if="showCleanup" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCleanup = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold mb-2">清理日志</h3>
        <p class="text-sm text-gray-600 mb-4">删除指定天数之前的日志</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">保留最近天数</label>
          <input v-model.number="cleanupDays" type="number" min="1" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div class="flex justify-end gap-2">
          <button @click="showCleanup = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
          <button @click="handleCleanup" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">确认清理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'

interface LogEntry {
  id: string
  api_type: string
  model: string | null
  status_code: number | null
  latency_ms: number | null
  is_stream: number
  error_message: string | null
  created_at: string
}

const logs = ref<LogEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const filterType = ref('')
const showCleanup = ref(false)
const cleanupDays = ref(30)

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN')
}

async function loadLogs() {
  try {
    const params: any = { page: page.value, limit }
    if (filterType.value) params.api_type = filterType.value
    const res = await api.getLogs(params)
    logs.value = res.data.data
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to load logs:', e)
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadLogs()
  }
}

function nextPage() {
  page.value++
  loadLogs()
}

async function handleCleanup() {
  try {
    const before = new Date(Date.now() - cleanupDays.value * 86400000).toISOString()
    const res = await api.deleteLogsBefore(before)
    showCleanup.value = false
    page.value = 1
    await loadLogs()
    alert(`已清理 ${res.data.deleted} 条日志`)
  } catch (e) {
    console.error('Failed to cleanup logs:', e)
  }
}

onMounted(loadLogs)
</script>
