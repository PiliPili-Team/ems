export type Mode = 'E' | 'V' | 'L' | '-'
export type Persona = 'userNormal' | 'userVip' | 'userWhitelist' | 'admin' | 'super'
export type Kind = 'home' | 'cards' | 'table' | 'form' | 'tree' | 'dashboard' | 'files'

export interface Item {
  label: string
  route: string
  status: 'built' | 'planned'
  access: Record<Persona, Mode>
  kind: Kind
  doc: string
  note?: string
}
export interface Group {
  title: string
  items: Item[]
}

const all = (m: Mode): Record<Persona, Mode> => ({
  userNormal: m, userVip: m, userWhitelist: m, admin: m, super: m,
})
const personal = (n: Mode, v: Mode = n, w: Mode = v): Record<Persona, Mode> => ({
  userNormal: n, userVip: v, userWhitelist: w, admin: 'E', super: 'E',
})
const adminOnly = (a: Mode, s: Mode = 'E'): Record<Persona, Mode> => ({
  userNormal: '-', userVip: '-', userWhitelist: '-', admin: a, super: s,
})

export const personas: { key: Persona; label: string }[] = [
  { key: 'userNormal', label: '用户 · normal' },
  { key: 'userVip', label: '用户 · vip' },
  { key: 'userWhitelist', label: '用户 · whitelist' },
  { key: 'admin', label: '管理员' },
  { key: 'super', label: '超级管理员' },
]

export const groups: Group[] = [
  {
    title: '个人',
    items: [
      { label: '首页', route: '/apps', status: 'built', access: all('V'), kind: 'home', doc: '/modules/home-dashboard', note: '个人状态与非敏感统计；概览待实现' },
      { label: '发现', route: '/browse', status: 'built', access: personal('E'), kind: 'cards', doc: '/modules/discover', note: '求片功能开启且有媒体账号才可见' },
      { label: '求片', route: '/wishes', status: 'planned', access: personal('E'), kind: 'table', doc: '/modules/wishes', note: '需有媒体账号' },
      { label: '我的媒体', route: '/my-media', status: 'planned', access: personal('E'), kind: 'cards', doc: '/modules/my-media' },
      { label: '我的线路', route: '/lines', status: 'built', access: personal('E'), kind: 'cards', doc: '/modules/lines', note: '会员线路对 normal 显示锁定' },
      { label: '积分中心', route: '/points', status: 'planned', access: personal('E'), kind: 'home', doc: '/modules/points', note: '需开启积分功能' },
      { label: '红包中心', route: '/points/red-packets', status: 'planned', access: personal('E'), kind: 'cards', doc: '/modules/points', note: '用户发红包默认关闭，由开关控制' },
      { label: '商店', route: '/shop', status: 'planned', access: personal('E'), kind: 'cards', doc: '/modules/shop' },
      { label: '我的码', route: '/shop/codes', status: 'planned', access: personal('E'), kind: 'table', doc: '/modules/shop' },
      { label: '个人资料与安全', route: '/profile', status: 'built', access: all('E'), kind: 'form', doc: '/modules/profile' },
    ],
  },
  {
    title: '管理',
    items: [
      { label: '运营仪表盘', route: '/dashboard', status: 'built', access: adminOnly('V'), kind: 'dashboard', doc: '/modules/home-dashboard', note: '含敏感内容，仅管理员' },
      { label: '用户管理', route: '/user', status: 'built', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-users' },
      { label: '邀请树 / 链式封禁', route: '/admin/users/:id/tree', status: 'planned', access: adminOnly('V'), kind: 'tree', doc: '/modules/admin-users', note: '封禁与回滚仅超管' },
      { label: '求片处理', route: '/admin/wishes', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-ops' },
      { label: '商店与码管理', route: '/admin/shop', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-commerce' },
      { label: '红包管理', route: '/admin/red-packets', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-commerce', note: '含“允许用户发红包”开关' },
      { label: '积分对账', route: '/admin/points', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-commerce', note: '显示剩余额度；差异终结仅超管' },
      { label: '媒体服务', route: '/admin/media-servers', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-media' },
      { label: '媒体账号管理', route: '/admin/media-accounts', status: 'planned', access: adminOnly('E'), kind: 'table', doc: '/modules/admin-media' },
      { label: '推流节点与线路', route: '/admin/stream', status: 'planned', access: adminOnly('E'), kind: 'cards', doc: '/modules/admin-stream' },
      { label: '通知与 Bot', route: '/admin/notify', status: 'planned', access: adminOnly('E'), kind: 'form', doc: '/modules/admin-ops' },
      { label: '计划任务', route: '/admin/scheduler', status: 'planned', access: adminOnly('E'), kind: 'cards', doc: '/modules/admin-ops' },
      { label: '审计中心', route: '/admin/audit', status: 'planned', access: adminOnly('V'), kind: 'table', doc: '/modules/system' },
    ],
  },
  {
    title: '系统',
    items: [
      { label: '系统设置', route: '/setting', status: 'built', access: adminOnly('E'), kind: 'form', doc: '/modules/system', note: '超管含版本历史与专属项' },
      { label: '服务状态与日志', route: '/service-status', status: 'built', access: adminOnly('V'), kind: 'dashboard', doc: '/modules/system' },
      { label: '插件', route: '/plugins', status: 'built', access: adminOnly('E'), kind: 'cards', doc: '/modules/system' },
      { label: '宿主机文件', route: '/filemanager', status: 'built', access: adminOnly('V', 'E'), kind: 'files', doc: '/modules/system', note: '写入仅超管' },
      { label: 'OpenAPI 文档', route: '/openapi', status: 'planned', access: adminOnly('V'), kind: 'form', doc: '/modules/system', note: '内置页面，仅管理员' },
    ],
  },
  {
    title: '超管专区',
    items: [
      { label: '管理员管理', route: '/super/admins', status: 'planned', access: adminOnly('-'), kind: 'table', doc: '/modules/super' },
      { label: 'API Key', route: '/super/api-keys', status: 'planned', access: adminOnly('-'), kind: 'table', doc: '/modules/super' },
      { label: '引导配置（只读）', route: '/super/bootstrap', status: 'planned', access: adminOnly('-'), kind: 'form', doc: '/modules/super' },
    ],
  },
]
