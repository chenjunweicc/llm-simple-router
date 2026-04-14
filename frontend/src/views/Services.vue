<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">后端服务</h2>
      <button
        @click="openCreate"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        添加服务
      </button>
    </div>

    <div class="bg-white rounded-lg border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">名称</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">类型</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Base URL</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">API Key</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="s in services" :key="s.id" class="hover:bg-gray-50" :class="{ 'opacity-60': !s.is_active }">
            <td class="px-4 py-3 font-medium">{{ s.name }}</td>
            <td class="px-4 py-3">
              <span :class="s.api_type === 'openai' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'" class="px-2 py-0.5 rounded text-xs font-medium">{{ s.api_type }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ s.base_url }}</td>
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ s.api_key }}</td>
            <td class="px-4 py-3">
              <span :class="s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'" class="px-2 py-0.5 rounded text-xs font-medium">{{ s.is_active ? '启用' : '禁用' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="openEdit(s)" class="text-gray-400 hover:text-blue-600 mr-2">编辑</button>
              <button @click="confirmDelete(s)" class="text-gray-400 hover:text-red-600">删除</button>
            </td>
          </tr>
          <tr v-if="services.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无服务</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="dialogOpen = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold mb-4">{{ editingId ? '编辑服务' : '添加服务' }}</h3>
        <form @submit.prevent="handleSave" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input v-model="form.name" type="text" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select v-model="form.api_type" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input v-model="form.base_url" type="url" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key {{ editingId ? '(留空不修改)' : '' }}</label>
            <input v-model="form.api_key" :type="editingId ? 'password' : 'text'" :required="!editingId" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="svc-active" class="rounded" />
            <label for="svc-active" class="text-sm text-gray-700">启用</label>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="dialogOpen = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="deleteTarget = null">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold mb-2">确认删除</h3>
        <p class="text-sm text-gray-600 mb-4">确定要删除服务「{{ deleteTarget.name }}」吗？此操作不可撤销。</p>
        <div class="flex justify-end gap-2">
          <button @click="deleteTarget = null" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
          <button @click="handleDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'

interface Service {
  id: string
  name: string
  api_type: string
  base_url: string
  api_key: string
  is_active: number
}

const services = ref<Service[]>([])
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const deleteTarget = ref<Service | null>(null)
const form = ref({ name: '', api_type: 'openai', base_url: '', api_key: '', is_active: true })

async function loadServices() {
  try {
    const res = await api.getServices()
    services.value = res.data
  } catch (e) {
    console.error('Failed to load services:', e)
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', api_type: 'openai', base_url: '', api_key: '', is_active: true }
  dialogOpen.value = true
}

function openEdit(s: Service) {
  editingId.value = s.id
  form.value = { name: s.name, api_type: s.api_type, base_url: s.base_url, api_key: '', is_active: !!s.is_active }
  dialogOpen.value = true
}

async function handleSave() {
  try {
    const data: any = {
      name: form.value.name,
      api_type: form.value.api_type,
      base_url: form.value.base_url,
      is_active: form.value.is_active ? 1 : 0,
    }
    if (form.value.api_key) data.api_key = form.value.api_key

    if (editingId.value) {
      await api.updateService(editingId.value, data)
    } else {
      data.api_key = form.value.api_key
      await api.createService(data)
    }
    dialogOpen.value = false
    await loadServices()
  } catch (e) {
    console.error('Failed to save service:', e)
  }
}

function confirmDelete(s: Service) {
  deleteTarget.value = s
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await api.deleteService(deleteTarget.value.id)
    deleteTarget.value = null
    await loadServices()
  } catch (e) {
    console.error('Failed to delete service:', e)
  }
}

onMounted(loadServices)
</script>
