<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">模型映射</h2>
      <button
        @click="openCreate"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        添加映射
      </button>
    </div>

    <div class="bg-white rounded-lg border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">客户端模型</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600"></th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">后端模型</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">关联服务</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="m in mappings" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-sm">{{ m.client_model }}</td>
            <td class="px-4 py-3 text-center text-gray-400">&rarr;</td>
            <td class="px-4 py-3 font-mono text-sm">{{ m.backend_model }}</td>
            <td class="px-4 py-3 text-gray-500">{{ getServiceName(m.backend_service_id) }}</td>
            <td class="px-4 py-3">
              <span :class="m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'" class="px-2 py-0.5 rounded text-xs font-medium">{{ m.is_active ? '启用' : '禁用' }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="openEdit(m)" class="text-gray-400 hover:text-blue-600 mr-2">编辑</button>
              <button @click="confirmDelete(m)" class="text-gray-400 hover:text-red-600">删除</button>
            </td>
          </tr>
          <tr v-if="mappings.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">暂无映射</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="dialogOpen = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold mb-4">{{ editingId ? '编辑映射' : '添加映射' }}</h3>
        <form @submit.prevent="handleSave" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">客户端模型</label>
            <input v-model="form.client_model" type="text" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">后端模型</label>
            <input v-model="form.backend_model" type="text" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联服务</label>
            <select v-model="form.backend_service_id" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option v-for="s in servicesList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="map-active" class="rounded" />
            <label for="map-active" class="text-sm text-gray-700">启用</label>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="dialogOpen = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="deleteTarget = null">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold mb-2">确认删除</h3>
        <p class="text-sm text-gray-600 mb-4">确定要删除映射「{{ deleteTarget.client_model }} &rarr; {{ deleteTarget.backend_model }}」吗？</p>
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

interface Mapping {
  id: string
  client_model: string
  backend_model: string
  backend_service_id: string
  is_active: number
}

interface Service {
  id: string
  name: string
}

const mappings = ref<Mapping[]>([])
const servicesList = ref<Service[]>([])
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const deleteTarget = ref<Mapping | null>(null)
const form = ref({ client_model: '', backend_model: '', backend_service_id: '', is_active: true })

function getServiceName(id: string): string {
  return servicesList.value.find(s => s.id === id)?.name || id
}

async function loadData() {
  try {
    const [mapRes, svcRes] = await Promise.all([api.getMappings(), api.getServices()])
    mappings.value = mapRes.data
    servicesList.value = svcRes.data
  } catch (e) {
    console.error('Failed to load data:', e)
  }
}

function openCreate() {
  editingId.value = null
  form.value = { client_model: '', backend_model: '', backend_service_id: servicesList.value[0]?.id || '', is_active: true }
  dialogOpen.value = true
}

function openEdit(m: Mapping) {
  editingId.value = m.id
  form.value = { client_model: m.client_model, backend_model: m.backend_model, backend_service_id: m.backend_service_id, is_active: !!m.is_active }
  dialogOpen.value = true
}

async function handleSave() {
  try {
    const data = {
      client_model: form.value.client_model,
      backend_model: form.value.backend_model,
      backend_service_id: form.value.backend_service_id,
      is_active: form.value.is_active ? 1 : 0,
    }
    if (editingId.value) {
      await api.updateMapping(editingId.value, data)
    } else {
      await api.createMapping(data)
    }
    dialogOpen.value = false
    await loadData()
  } catch (e) {
    console.error('Failed to save mapping:', e)
  }
}

function confirmDelete(m: Mapping) {
  deleteTarget.value = m
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await api.deleteMapping(deleteTarget.value.id)
    deleteTarget.value = null
    await loadData()
  } catch (e) {
    console.error('Failed to delete mapping:', e)
  }
}

onMounted(loadData)
</script>
