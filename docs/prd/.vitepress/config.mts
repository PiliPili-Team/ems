import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  lang: 'zh-CN',
  title: 'EMS 产品需求文档',
  description: 'EMS v2 Web 前端功能模块、展示与交互 PRD（草案）',
  srcExclude: ['node_modules/**', 'README.md'],
  themeConfig: {
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页目录' },
    nav: [
      { text: '总览', link: '/' },
      { text: '角色与导航', link: '/roles-permissions' },
      { text: '功能模块', link: '/modules/auth-setup' },
      { text: '关键流程', link: '/flows' },
    ],
    sidebar: [
      {
        text: '总览',
        items: [
          { text: '文档说明与范围', link: '/' },
          { text: '角色、层级与权限', link: '/roles-permissions' },
          { text: '导航结构与路由', link: '/navigation-routes' },
          { text: '界面草图', link: '/wireframes' },
          { text: '交付范围与验收', link: '/delivery-scope' },
          { text: '页面设计原则', link: '/page-design' },
        ],
      },
      {
        text: '个人区（全部角色）',
        items: [
          { text: 'P1 认证与首次初始化', link: '/modules/auth-setup' },
          { text: 'P2 首页与应用中心', link: '/modules/home-dashboard' },
          { text: 'P3 我的媒体账号', link: '/modules/my-media' },
          { text: 'P4 线路', link: '/modules/lines' },
          { text: 'P5 积分与红包', link: '/modules/points' },
          { text: 'P6 商店与我的码', link: '/modules/shop' },
          { text: 'P7 求片', link: '/modules/wishes' },
          { text: 'P8 发现', link: '/modules/discover' },
          { text: 'P9 个人资料与安全', link: '/modules/profile' },
          { text: 'P10 Telegram Mini App', link: '/modules/miniapp' },
          { text: 'P11 工单与反馈', link: '/modules/feedback' },
          { text: 'P12 幸运中心', link: '/modules/lucky' },
        ],
      },
      {
        text: '管理区（admin 及以上）',
        items: [
          { text: 'A1 用户管理与邀请树', link: '/modules/admin-users' },
          { text: 'A2 商店、红包与积分运营', link: '/modules/admin-commerce' },
          { text: 'A3 媒体服务器与媒体账号', link: '/modules/admin-media' },
          { text: 'A4 推流节点与线路', link: '/modules/admin-stream' },
          { text: 'A5 求片处理、通知与计划任务', link: '/modules/admin-ops' },
          { text: 'A6 系统设置与审计', link: '/modules/system' },
          { text: 'A7 超级管理员专区', link: '/modules/super' },
          { text: 'A8 访问分组', link: '/modules/admin-groups' },
        ],
      },
      {
        text: '横向内容',
        items: [
          { text: '关键流程', link: '/flows' },
          { text: '通用状态与错误反馈', link: '/states-errors' },
          { text: '移动端 Mini App', link: '/miniapp' },
          { text: '决策记录', link: '/decisions' },
        ],
      },
    ],
    docFooter: { prev: '上一页', next: '下一页' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
  },
  mermaid: {},
})
