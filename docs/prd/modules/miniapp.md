# P10 Telegram Mini App

<span class="badge-built">已实现</span> Telegram 内沿用同一套响应式页面，只换用专用外壳；不新增 `/m` 路由。

## 入口与登录

| 能力 | 行为 |
|---|---|
| 入口 | Telegram Bot 菜单按钮打开站点；管理员可在 Bot 卡片手动同步菜单按钮 |
| 环境检测 | 仅启动参数含 `tgWebAppData` 或 SDK 提供非空 `initData` 时启用；普通浏览器不加载 Telegram SDK |
| 登录 | `initData` 调用 `POST /auth/telegram/miniapp`，沿用 bearer 会话；已有且属于同一 Telegram 用户的会话直接复用 |
| SDK 降级 | 官方脚本不可达时仍从启动参数取得 `initData` 并登录 |
| 深链 | 未绑定时展示主 Bot 深链；绑定码仍在网页端个人资料生成 |

`initData` 只保存在内存，不写入本地存储或日志。

## 外壳

- 底部标签固定为积分、媒体、商店、心愿、我的；每项复用导航清单的权限、功能开关与媒体账号判断，不可见项不渲染，少于两项时隐藏标签栏。
- 无侧栏、无应用栏；使用 Telegram 自带标题栏与返回按钮。二级页面显示返回按钮，标签根页隐藏。
- 安全区叠加 `env(safe-area-inset-*)` 与 Telegram `safeAreaInset` / `contentSafeAreaInset`；启动时调用 `ready()` 与 `expand()`。
- 账号主题为“跟随系统”时跟随 Telegram `colorScheme`；已选玻璃、透明等主题时保持账号选择。
- 管理、系统与超管路径在路由守卫统一重定向到默认标签；管理员与超管同样只看到个人区。后端权限校验不变。

## 状态与错误

| 情形 | 固定错误码 | 呈现 |
|---|---|---|
| 未绑定 | `telegram_not_bound` | 绑定说明 + 主 Bot 深链，无标签栏 |
| 准入未满足 | `telegram_admission_denied` | 说明需满足的条件，不显示群 ID |
| 账号禁用 | `account_disabled` | 全站阻断提示 |
| initData 过期/无效 | `telegram_init_expired` | “请从机器人重新打开” |
| 限流 | 429 + `retry-after` | 显示等待秒数，可重试 |
| 后端不可用 | 5xx | 重试按钮 |

媒体账号到期或停用不阻断 Mini App 登录，相关页面沿用现有续期门控。

## 菜单按钮同步

`POST /admin/notify/bots/{id}/menu-button`：`admin.notify.write`，仅会员 Bot；站点域名取高级设置的 `publicDomain`，未配置返回 409 `domain_not_set`。保存 Bot 不会自动同步。

## 依赖接口

`POST /auth/telegram/miniapp`、`POST /admin/notify/bots/{id}/menu-button`、既有 `/auth/me` 与各业务接口。
