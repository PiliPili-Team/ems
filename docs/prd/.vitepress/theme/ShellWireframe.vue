<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { groups, personas, type Item, type Persona } from './menu-data'

const current = ref<Persona>('userNormal')
const mobile = ref(false)
const drawer = ref(false)

const visible = computed(() =>
  groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.access[current.value] !== '-') }))
    .filter((g) => g.items.length > 0),
)

const selected = ref<Item>(groups[0].items[0])

// 切换身份后，若当前页面不可见则回到首页
watch(current, () => {
  if (selected.value.access[current.value] === '-') selected.value = groups[0].items[0]
})

const mode = computed(() => selected.value.access[current.value])
const canWrite = computed(() => mode.value === 'E')

const identity = computed(() => personas.find((p) => p.key === current.value)?.label ?? '')

function pick(i: Item) {
  selected.value = i
  drawer.value = false
}
</script>

<template>
  <div class="wf">
    <div class="wf-bar">
      <button
        v-for="p in personas"
        :key="p.key"
        :class="['wf-tab', { on: current === p.key }]"
        @click="current = p.key"
      >
        {{ p.label }}
      </button>
      <span class="wf-sep" />
      <button :class="['wf-tab', { on: !mobile }]" @click="mobile = false">桌面</button>
      <button :class="['wf-tab', { on: mobile }]" @click="mobile = true">手机</button>
    </div>

    <div :class="['wf-frame', { mobile }]">
      <!-- 顶栏 -->
      <header class="wf-top">
        <button v-if="mobile" class="wf-burger" @click="drawer = !drawer">☰</button>
        <strong class="wf-logo">EMS</strong>
        <span class="wf-search">搜索…</span>
        <span class="wf-chip">中 / EN</span>
        <span class="wf-chip">◐</span>
        <span class="wf-avatar" :title="identity">●</span>
      </header>

      <div class="wf-body">
        <!-- 侧栏 -->
        <nav v-show="!mobile || drawer" :class="['wf-side', { drawer: mobile }]">
          <div v-for="g in visible" :key="g.title" class="wf-group">
            <div class="wf-group-title">{{ g.title }}</div>
            <button
              v-for="i in g.items"
              :key="i.route"
              :class="['wf-nav', { on: selected.route === i.route }]"
              @click="pick(i)"
            >
              <span>{{ i.label }}</span>
              <span v-if="i.access[current] === 'V'" class="wf-mark" title="仅查看">👁</span>
              <span v-if="i.status === 'planned'" class="wf-dot" title="待实现" />
            </button>
          </div>
        </nav>

        <!-- 内容区 -->
        <main class="wf-main">
          <div class="wf-head">
            <div>
              <div class="wf-title">{{ selected.label }}</div>
              <code class="wf-route">{{ selected.route }}</code>
            </div>
            <div class="wf-head-right">
              <span v-if="mode === 'V'" class="wf-tag view">仅查看</span>
              <span v-if="selected.status === 'planned'" class="wf-tag plan">待实现</span>
              <button v-if="canWrite && selected.kind !== 'dashboard' && selected.kind !== 'home'" class="wf-btn primary">
                ＋ 新建 / 保存
              </button>
            </div>
          </div>

          <p v-if="selected.note" class="wf-note">{{ selected.note }}</p>

          <!-- home -->
          <template v-if="selected.kind === 'home'">
            <div class="wf-row">
              <div class="wf-card tall">状态卡<br /><small>账号 / 到期 / 积分</small></div>
              <div class="wf-card tall">快捷操作<br /><small>签到 · 求片</small></div>
            </div>
            <div class="wf-label">功能入口</div>
            <div class="wf-row"><div v-for="n in 4" :key="n" class="wf-card" /></div>
            <div class="wf-label">在线人数 / Top5 / 最近入库</div>
            <div class="wf-row"><div v-for="n in 5" :key="n" class="wf-poster" /></div>
          </template>

          <!-- dashboard -->
          <template v-else-if="selected.kind === 'dashboard'">
            <div class="wf-row"><div v-for="n in 4" :key="n" class="wf-card" /></div>
            <div class="wf-label">实时列表 / 日志</div>
            <div class="wf-lines"><i v-for="n in 6" :key="n" /></div>
          </template>

          <!-- cards -->
          <template v-else-if="selected.kind === 'cards'">
            <div class="wf-row wrap"><div v-for="n in 6" :key="n" class="wf-card">
              <small v-if="n === 3 && current === 'userNormal' && selected.route === '/lines'">🔒 会员线路</small>
            </div></div>
          </template>

          <!-- table -->
          <template v-else-if="selected.kind === 'table'">
            <div class="wf-filter"><span class="wf-input">筛选 / 搜索</span><span class="wf-input short">状态 ▾</span></div>
            <div class="wf-table">
              <div v-for="n in 6" :key="n" class="wf-tr">
                <i /><i /><i class="s" />
                <span v-if="canWrite" class="wf-act">操作</span>
              </div>
            </div>
            <div class="wf-pager">‹ 1 2 3 ›</div>
          </template>

          <!-- form -->
          <template v-else-if="selected.kind === 'form'">
            <div class="wf-form"><div v-for="n in 5" :key="n"><label /><span class="wf-input" /></div></div>
            <div v-if="canWrite" class="wf-foot"><button class="wf-btn">取消</button><button class="wf-btn primary">保存</button></div>
          </template>

          <!-- tree -->
          <template v-else-if="selected.kind === 'tree'">
            <div class="wf-tree">
              <div>▾ 用户 A</div><div class="l2">▾ 用户 B</div><div class="l3">· 用户 D</div>
              <div class="l2">· 用户 C</div>
            </div>
            <div v-if="current === 'super'" class="wf-danger">链式封禁（预览 → 输入名称确认）</div>
          </template>

          <!-- files -->
          <template v-else>
            <div class="wf-crumb">/ data / media</div>
            <div class="wf-table">
              <div v-for="n in 4" :key="n" class="wf-tr"><i /><i class="s" />
                <span v-if="current === 'super'" class="wf-act">重命名 · 删除</span>
                <span v-else class="wf-act off">下载</span>
              </div>
            </div>
          </template>

          <div class="wf-links"><a :href="selected.doc">查看该模块的完整说明 →</a></div>
        </main>
      </div>
    </div>

    <p class="wf-legend">
      👁 仅查看　● 待实现　灰色方块代表内容占位，不代表视觉设计。切换身份，观察菜单与按钮的变化。
    </p>
  </div>
</template>

<style scoped>
.wf { margin: 16px 0; }
.wf-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
.wf-tab { border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-radius: 6px; padding: 3px 10px; font-size: 13px; cursor: pointer; }
.wf-tab.on { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.wf-sep { width: 1px; height: 18px; background: var(--vp-c-divider); margin: 0 4px; }

.wf-frame { border: 2px solid var(--vp-c-divider); border-radius: 10px; overflow: hidden; background: var(--vp-c-bg); position: relative; }
.wf-frame.mobile { max-width: 390px; margin: 0 auto; }
.wf-top { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.wf-logo { margin-right: 6px; }
.wf-search { flex: 1; border: 1px dashed var(--vp-c-divider); border-radius: 6px; padding: 3px 10px; font-size: 12px; color: var(--vp-c-text-3); }
.wf-chip { font-size: 12px; border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 1px 8px; color: var(--vp-c-text-2); }
.wf-avatar { color: var(--vp-c-brand-1); font-size: 18px; }
.wf-burger { border: 0; background: none; font-size: 18px; cursor: pointer; color: var(--vp-c-text-1); }

.wf-body { display: flex; min-height: 440px; position: relative; }
.wf-side { width: 200px; flex-shrink: 0; border-right: 1px solid var(--vp-c-divider); padding: 8px; overflow-y: auto; max-height: 560px; background: var(--vp-c-bg-soft); }
.wf-side.drawer { position: absolute; z-index: 5; inset: 0 auto 0 0; width: 230px; box-shadow: 4px 0 12px rgba(0,0,0,.2); background: var(--vp-c-bg); }
.wf-group-title { font-size: 11px; font-weight: 700; color: var(--vp-c-text-3); margin: 10px 4px 4px; letter-spacing: .05em; }
.wf-nav { display: flex; width: 100%; justify-content: space-between; align-items: center; gap: 4px; text-align: left; border: 0; background: none; color: var(--vp-c-text-1); padding: 5px 8px; border-radius: 6px; font-size: 13px; cursor: pointer; }
.wf-nav:hover { background: var(--vp-c-default-soft); }
.wf-nav.on { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 600; }
.wf-mark { font-size: 11px; margin-left: auto; }
.wf-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vp-c-yellow-1); }

.wf-main { flex: 1; padding: 14px; min-width: 0; }
.wf-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.wf-title { font-size: 18px; font-weight: 700; }
.wf-route { font-size: 12px; }
.wf-head-right { display: flex; gap: 6px; align-items: center; }
.wf-tag { font-size: 11px; padding: 0 8px; line-height: 20px; border-radius: 10px; }
.wf-tag.view { background: var(--vp-c-yellow-soft); color: var(--vp-c-yellow-1); }
.wf-tag.plan { background: var(--vp-c-default-soft); color: var(--vp-c-text-2); }
.wf-btn { border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); border-radius: 6px; padding: 3px 12px; font-size: 12px; color: var(--vp-c-text-1); }
.wf-btn.primary { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.wf-note { font-size: 12px; color: var(--vp-c-text-2); margin: 8px 0 !important; }
.wf-label { font-size: 12px; font-weight: 700; color: var(--vp-c-text-2); margin: 14px 0 6px; }

.wf-row { display: flex; gap: 8px; margin-top: 10px; }
.wf-row.wrap { flex-wrap: wrap; }
.wf-card { flex: 1 1 110px; min-height: 64px; border: 1px dashed var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-default-soft); padding: 8px; font-size: 12px; }
.wf-card.tall { min-height: 96px; }
.wf-poster { flex: 1; aspect-ratio: 2/3; max-height: 110px; border-radius: 6px; background: var(--vp-c-default-soft); }
.wf-lines i { display: block; height: 10px; border-radius: 4px; background: var(--vp-c-default-soft); margin: 8px 0; }
.wf-lines i:nth-child(even) { width: 70%; }

.wf-filter { display: flex; gap: 6px; margin: 10px 0; }
.wf-input { border: 1px solid var(--vp-c-divider); border-radius: 6px; padding: 3px 10px; font-size: 12px; color: var(--vp-c-text-3); flex: 1; display: block; min-height: 22px; }
.wf-input.short { flex: 0 0 90px; }
.wf-table { border: 1px solid var(--vp-c-divider); border-radius: 8px; overflow: hidden; margin-top: 10px; }
.wf-tr { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-bottom: 1px solid var(--vp-c-divider); }
.wf-tr:last-child { border-bottom: 0; }
.wf-tr i { flex: 2; height: 10px; border-radius: 4px; background: var(--vp-c-default-soft); }
.wf-tr i.s { flex: 1; }
.wf-act { font-size: 11px; color: var(--vp-c-brand-1); white-space: nowrap; }
.wf-act.off { color: var(--vp-c-text-3); }
.wf-pager { text-align: right; font-size: 12px; color: var(--vp-c-text-3); margin-top: 8px; }
.wf-form > div { display: flex; gap: 10px; align-items: center; margin: 10px 0; }
.wf-form label { width: 90px; height: 10px; border-radius: 4px; background: var(--vp-c-default-soft); }
.wf-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.wf-tree { font-size: 13px; line-height: 1.9; margin-top: 10px; }
.wf-tree .l2 { padding-left: 18px; }
.wf-tree .l3 { padding-left: 36px; }
.wf-danger { margin-top: 12px; border: 1px solid var(--vp-c-danger-1); color: var(--vp-c-danger-1); border-radius: 6px; padding: 6px 10px; font-size: 12px; }
.wf-crumb { font-size: 12px; color: var(--vp-c-text-2); margin-top: 10px; }
.wf-links { margin-top: 16px; font-size: 13px; }
.wf-legend { font-size: 12px; color: var(--vp-c-text-2); margin-top: 8px; }
</style>
