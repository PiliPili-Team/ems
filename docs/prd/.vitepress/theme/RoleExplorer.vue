<script setup lang="ts">
import { computed, ref } from 'vue'

import { groups, personas, type Mode, type Persona } from './menu-data'

const current = ref<Persona>('userNormal')
const showHidden = ref(false)

const modeLabel: Record<Mode, string> = {
  E: '可操作', V: '仅查看', L: '锁定', '-': '不可见',
}

const visibleGroups = computed(() =>
  groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => showHidden.value || i.access[current.value] !== '-'),
    }))
    .filter((g) => g.items.length > 0),
)
</script>

<template>
  <div class="re">
    <div class="re-bar">
      <button
        v-for="p in personas"
        :key="p.key"
        :class="['re-tab', { active: current === p.key }]"
        @click="current = p.key"
      >
        {{ p.label }}
      </button>
      <label class="re-toggle">
        <input v-model="showHidden" type="checkbox" /> 显示不可见项
      </label>
    </div>

    <div v-for="g in visibleGroups" :key="g.title" class="re-group">
      <div class="re-title">{{ g.title }}</div>
      <div
        v-for="i in g.items"
        :key="i.route"
        :class="['re-item', 'm-' + (i.access[current] === '-' ? 'hidden' : i.access[current])]"
      >
        <span class="re-label">{{ i.label }}</span>
        <code class="re-route">{{ i.route }}</code>
        <span class="re-mode">{{ modeLabel[i.access[current]] }}</span>
        <span :class="i.status === 'built' ? 'badge-built' : 'badge-planned'">
          {{ i.status === 'built' ? '已实现' : '待实现' }}
        </span>
        <span v-if="i.note" class="re-note">{{ i.note }}</span>
      </div>
    </div>
    <p class="re-hint">
      演示的是“后端下发权限后前端菜单的渲染结果”。真实授权始终由后端判定，前端不复制角色规则。
    </p>
  </div>
</template>

<style scoped>
.re { border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 12px; margin: 16px 0; }
.re-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
.re-tab { border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 13px; }
.re-tab.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.re-toggle { margin-left: auto; font-size: 13px; color: var(--vp-c-text-2); }
.re-title { font-weight: 700; font-size: 13px; color: var(--vp-c-text-2); margin: 10px 0 4px; }
.re-item { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 6px 10px; border-radius: 6px; border-left: 3px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); margin-bottom: 4px; font-size: 14px; }
.re-label { min-width: 150px; font-weight: 600; }
.re-route { font-size: 12px; }
.re-mode { font-size: 12px; margin-left: auto; }
.re-note { flex-basis: 100%; font-size: 12px; color: var(--vp-c-text-2); }
.m-E { border-left-color: var(--vp-c-green-1); }
.m-V { border-left-color: var(--vp-c-yellow-1); }
.m-L { border-left-color: var(--vp-c-danger-1); }
.m-hidden { opacity: 0.45; border-left-style: dashed; }
.re-hint { font-size: 12px; color: var(--vp-c-text-2); margin: 8px 0 0; }
</style>
