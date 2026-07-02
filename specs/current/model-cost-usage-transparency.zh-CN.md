# 模型 / 成本 / 用量透明化：全链路优化方案

> 状态：提案（已完成全链路代码盘点）
> 日期：2026-07-02
> 目标一句话：让付费用户在**选模型前、跑任务中、跑完后**三个时刻都清楚地知道
> 「我在用什么模型、它擅长什么、花了多少、context 还剩多少、什么时候该换模型/换会话」，
> 并让 Open Design Cloud (AMR) 成为这条感知链上最突出、最省心的选项。

---

## 1. 现状盘点（代码事实）

### 1.1 模型选择链 —— 元数据几乎为零

| 环节 | 文件 | 现状 |
|---|---|---|
| 模型 DTO | `packages/contracts/src/api/registry.ts:1` | `AgentModelOption = { id, label }`，**仅两个字段** |
| 内置模型表 | `apps/daemon/src/runtimes/defs/*.ts`（`fallbackModels`） | 只有 id/label，无描述/价格/context |
| BYOK 模型拉取 | `apps/daemon/src/integrations/provider-models.ts` | provider 返回的 description/max_tokens 等元数据**全部丢弃**，只留 id→label |
| context window 数据 | `apps/web/src/state/maxTokens.ts` + `litellm-models.json` | vendored litellm 目录**只保留 max_output_tokens 数字**，价格字段被剥掉；`CONTEXT_WINDOW_OVERRIDES` 是 web 内部查表，不经 contracts 下发 |
| 选择器 UI | `apps/web/src/components/InlineModelSwitcher.tsx`（149-1105） | 纯名字列表；无 hover 介绍卡、无价格/速度/用途提示（对比 Cursor：hover 出「Anthropic's large model class, great for difficult tasks / 300k context window」） |
| 模式选择器 | `apps/web/src/components/SessionModeToggle.tsx:17` | Ask/Plan/Design 已有 Light/Standard/Heavy 三档成本条 —— **这是目前唯一的"成本语义化"表达**，与模型选择完全正交 |

### 1.2 用量链 —— 采集齐全，但「不落库、不聚合、不成面板」

| 层 | 现状 | 证据 |
|---|---|---|
| 采集 | ✅ 所有 parser 都抽 usage：claude（`claude-stream.ts:486`）、opencode/gemini/cursor/codex（`json-event-stream.ts`）、qoder；含 input/output/cache/cost/duration | 完整 |
| 传输 | ✅ SSE `{ type:'usage', usage, costUsd, durationMs }`（`packages/contracts/src/sse/chat.ts:81`） | 完整 |
| 消息级展示 | ⚠️ `AssistantMessage.tsx:1411` footer：只有 Done · 时长 · **output** tokens · $cost；**input/cache 不显示** | 半成品 |
| 会话级 context | ✅ 已有 Cursor 式面板：`ContextUsagePanel.tsx`（挂在 `ChatPane.tsx:2042` 的 `ContextUsageControl` + `:2358` 的 `ContextUsageWarning`，75%/90% 阈值），分段估算逻辑在 `apps/web/src/runtime/context-usage.ts` | 已接入但**模型 context window 靠 UI 查表，估算系数写死** |
| 持久化 | ❌ SQLite 无 usage 一等列 —— usage 埋在 `messages.events_json` 文本 blob 里（`apps/daemon/src/db.ts:55-253`），**无法 SUM** | 缺失 |
| 聚合 API | ❌ 无 `/api/usage/*`；`od` CLI 无 usage 子命令 | 缺失 |
| 分析导出 | ⚠️ run 级 usage/cache-hit/timing 分析很完善（`run-analytics-observability.ts:93-157`，含 cache_hit_ratio、first_call 缓存信号、codex rollout 兜底 `codex-rollout-usage.ts`）但**只发 Langfuse，不回流产品 UI** | 外流不内显 |

### 1.3 AMR / Open Design Cloud —— 有登录态和余额，没有用量入口

| 面 | 现状 | 文件 |
|---|---|---|
| 登录/钱包 | ✅ `~/.amr/config.json`；`GET /api/integrations/vela/status`、`/wallet`（8s 缓存）、login/logout；`AmrWalletSnapshot`（plan + balanceUsd + stale） | `apps/daemon/src/integrations/vela-wallet.ts:109`、`routes/vela.ts:143-442`、`packages/contracts/src/api/amrWallet.ts` |
| UI 呈现 | ✅ Settings AMR 卡（`SettingsDialog.tsx:4289-4558`：邮箱+plan 徽章+余额+Upgrade）；头像菜单内嵌 plan+余额（`AvatarMenu.tsx:422`）；错误引导 `AMR_AUTH_REQUIRED`/`AMR_INSUFFICIENT_BALANCE`（`amr-guidance.ts:126-225`） | |
| 缺口 | ❌ 齿轮下拉（`EntrySettingsMenu.tsx`）**无 Usage/Billing 入口**；无低余额**预警**（只有失败后补救）；无消耗曲线；AMR 模型目录（`/api/amr/models`）与其他 agent 一样只有名字 | |

### 1.4 一句话诊断

> **数据都有，语义全无。** 采集层（usage 事件、cache 分析、钱包快照）是这个 repo 做得最好的部分；
> 但用户能看到的只有「一行小字的 output tokens」和「一个无模型说明的名字下拉框」。
> 缺的是三块：**① 模型目录带元数据 ② usage 落库+聚合面板 ③ 时机化引导（换模型/换会话/充值）**。

---

## 2. 设计原则

1. **透明**：每一分钱都能回答「哪个会话、哪个模型、产出了什么」。
2. **省钱**：默认帮用户省 —— 缓存命中率、轻任务提示轻模型、context 快满提示新会话。
3. **用好**：模型不是名字是「工具卡片」—— 介绍/擅长/边界/速度/价格/context 一眼可见。
4. **突出 Open Design Cloud**：AMR 登录后是唯一能打通「余额 ↔ 每次消耗」闭环的通道，把它做成默认最省心的选择；其他 agent 则突出模型卡片与本地用量可视化。
5. **不打断**：所有引导都是非阻塞 chip/banner + 一键 action，可 dismiss，不弹对话框。

---

## 3. 方案：四层架构

```
┌─ L4 引导层  Advisor nudges（context 阈值 / 模型错配 / 余额预警 → 一键切换）
├─ L3 面板层  Usage Dashboard（Settings·Usage + 齿轮/头像入口 + od usage CLI）
├─ L2 记账层  usage_ledger 表 + /api/usage/* 聚合 API
└─ L1 目录层  Model Catalog（description/context/pricing/speed/tags 全链路下发）
```

### L1 模型目录层（Model Catalog）—— 让「选模型」变成「看卡片」

**contracts**（先行）：扩展 `packages/contracts/src/api/registry.ts`

```ts
export interface AgentModelOption {
  id: string;
  label: string;
  // ↓ 全部 optional，向后兼容
  description?: string;        // i18n key 或纯文案："Anthropic 旗舰，适合复杂任务"
  contextWindow?: number;      // 200000
  maxOutputTokens?: number;
  pricing?: { inputPer1M?: number; outputPer1M?: number; cacheReadPer1M?: number; currency?: 'USD' };
  speedTier?: 'fast' | 'balanced' | 'powerful';   // 对应 UI 速度徽章
  tags?: string[];             // ['vision','reasoning','long-context']
  recommendedFor?: string[];   // ['design','chat'] —— 与 ChatSessionMode 对齐
  deprecated?: boolean;
}
```

**daemon**：新增 `apps/daemon/src/model-catalog.ts`
- 内置目录：主流模型（claude/gpt/gemini/deepseek/glm/qwen…）的 description/context/pricing/speed 手工维护表（数据源可从 litellm 全量 JSON 重新生成，这次**保留价格**；生成脚本放 `tools/` 或 `scripts/`）。
- 合并策略：`fallbackModels`/`fetchModels`/provider `/v1/models` 返回的裸 id → 经 catalog **enrich** 后再下发（`/api/agents`、`/api/provider/models`、`/api/amr/models` 三个口统一走 enrich）。
- AMR 特权：若 AMR API 返回自带元数据（价格/配额），以远端为准覆盖本地表 —— cloud 模型信息永远最新，这本身就是 AMR 的卖点。

**web**：
- `InlineModelSwitcher` 与 Settings 模型下拉：每项右侧加 speed/price 徽章，hover/focus 出**模型卡片**（描述、context window、$/1M in/out、适用模式、边界提示），样式对齐现有 Ask/Plan/Design 卡片（`SessionModeToggle` 的 hover 卡已有先例）。
- `ContextUsagePanel` 的分母（context window）改为读 catalog 下发值，估算 fallback 仅在 catalog 缺失时使用，并在 UI 上标注「估算」。
- i18n：内置模型描述走 i18n key（18 locale 全量），provider 动态模型描述保留原文。

### L2 用量记账层（Usage Ledger）—— 从「blob 里的字」变成「可 SUM 的表」

**SQLite**（`apps/daemon/src/db.ts` 新表，run 结束时写一行）：

```sql
CREATE TABLE IF NOT EXISTS usage_ledger (
  id TEXT PRIMARY KEY,
  project_id TEXT, conversation_id TEXT, message_id TEXT,
  agent_id TEXT NOT NULL, model TEXT, mode TEXT,          -- chat/plan/design
  exec_mode TEXT,                                          -- daemon/api(BYOK)/amr
  input_tokens INTEGER, output_tokens INTEGER,
  cache_read_tokens INTEGER, cache_write_tokens INTEGER,
  cost_usd REAL,                                           -- provider 报告值；无则按 catalog pricing 估算并标记
  cost_source TEXT,                                        -- 'provider' | 'estimated' | 'unknown'
  duration_ms INTEGER, artifact_count INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_usage_ledger_time ON usage_ledger(created_at);
CREATE INDEX idx_usage_ledger_conv ON usage_ledger(conversation_id);
```

- 写入点：daemon 现有 usage bookkeeping（`server.ts` usage 事件转发处）已拿到全部字段，加一次 insert；复用 `run-analytics-observability.ts` 的 `scanRunEventsForUsageAnalytics` 结果，Langfuse 与本地 ledger **同源同刻写**。
- 成本估算：provider 不报 cost（codex/gemini 等）时用 L1 catalog 的 pricing × tokens 估算，`cost_source='estimated'`，UI 一律显示 `≈$`。

**聚合 API + CLI（同一 PR 三步闭环，遵守 AGENTS.md 能力双轨规则）**：
- `GET /api/usage/summary?range=today|7d|30d&groupBy=day|model|agent|project|conversation`
- `GET /api/usage/conversations/:id`（单会话累计）
- contracts：`packages/contracts/src/api/usage.ts` 新 DTO
- CLI：`od usage [--range 7d] [--group-by model] [--json]`，注册进 `SUBCOMMAND_MAP`

### L3 面板层（Usage Dashboard）—— 「我的钱花在哪了」

**入口（3 个）**：
1. 齿轮下拉 `EntrySettingsMenu.tsx`：Settings 按钮上方加「Usage & billing」行（AMR 登录时行内直接显示余额）。
2. 头像菜单 `AvatarMenu.tsx`：现有 plan+余额行点击 → 直达面板。
3. Settings 新 section「Usage」（与 Execution mode 平级）。

**面板内容**（Settings·Usage）：
- 顶部：今日 / 7 天 / 30 天 成本 + tokens 大数字；缓存命中率（省了多少钱 —— `cache_read × (input价 − cache价)`，把 run-analytics 里已经算好的 cache_hit_ratio 变成用户可见的「已为你节省 ≈$X」）。
- 中部：按模型 / 按项目 / 按会话 的 breakdown 条形列表（点会话可跳转）。
- **AMR 区（登录时置顶）**：余额大字 + plan 徽章 + 消耗趋势 + Recharge/Upgrade 按钮（复用 `amrPlansUrlForProfile`）；未登录显示引导卡（复用现有 benefits chips：Official / Lower cost / Many models）→ 这是「突出 Open Design Cloud」的主阵地。
- 底部：`cost_source` 图例说明（实报 $ vs 估算 ≈$）。

**会话内强化**：
- `AssistantMessage` footer 补全：`in 5.2k (cache 4.1k) · out 1.8k · ≈$0.0034`。
- ChatPane 会话头部加**会话累计 cost chip**（读 `/api/usage/conversations/:id`），点击展开该会话的模型/成本明细。

### L4 引导层（Advisor Nudges）—— 「合适的时候提一句」

统一形态：composer 上方一条非阻塞 slim banner（复用 PinnedTodoSlot 的布局位模式），文案 + 一键 action + dismiss；同类提示每会话最多出现一次。

| 触发器 | 条件（可在 web 端纯前端判定，数据已具备） | Action |
|---|---|---|
| **T1 context 快满** | `ContextUsageSummary` ≥75% / ≥90%（阈值已存在） | 「新会话继续」按钮：新建会话并自动带上一条由当前会话生成的摘要提示；90% 时按钮变主色 |
| **T2 大材小用** | mode=chat（Light）且当前模型 `speedTier='powerful'` 且连续 ≥3 轮短问答（output <1k tokens） | 「切到 fast 模型省 ~N 倍」一键切换（写回 `agentModels` prefs） |
| **T3 小材大用** | mode=design（Heavy）且模型 `speedTier='fast'` | 「设计任务建议用更强模型」一键切换 |
| **T4 AMR 余额预警** | `AmrWalletSnapshot.balanceUsd` < 阈值（如 $2）或 < 近 7 日日均消耗 ×2 | 「余额即将用完」+ Recharge —— 把现有**失败后**的 `AMR_INSUFFICIENT_BALANCE` 引导前置成**失败前**预警 |
| **T5 未登录 AMR** | exec_mode=daemon 且非 AMR agent 连续产生高成本（7 日 >$X） | 「Open Design Cloud 同款模型更省」引导卡 → 打开 AMR 登录（复用 `AmrLoginPill` 流程，entry source 记 `usage_nudge`） |

分析埋点：每个 nudge 的 impression/accept/dismiss 走现有 `track*` 通道，形成转化漏斗（尤其 T5 是 AMR 增长入口）。

---

## 4. 分期落地

### P0 —— 模型有脸（约 1 个 PR 组）
1. contracts `AgentModelOption` 扩展 + daemon `model-catalog.ts` + 三个下发口 enrich。
2. `InlineModelSwitcher`/Settings 模型 hover 卡 + speed/price 徽章 + i18n（18 locale）。
3. `ContextUsagePanel` 分母接 catalog；`AssistantMessage` footer 补 input/cache tokens。
- 验收：选择器里 hover 任一主流模型能看到 描述/context/价格/速度；context 面板分母与所选模型一致。

### P1 —— 钱看得见（约 2 个 PR）
4. `usage_ledger` 表 + 写入点 + 成本估算（cost_source）。
5. `/api/usage/*` + contracts DTO + `od usage --json`（同 PR）。
6. Settings·Usage 面板 + 齿轮/头像入口 + AMR 区（余额/趋势/Recharge/未登录引导）。
- 验收：跑 3 个不同模型的会话后，`od usage --group-by model --json` 与面板数字一致；AMR 登录时面板置顶显示余额。

### P2 —— 该提就提（约 1-2 个 PR）
7. Nudge 框架（banner 组件 + 每会话去重 + 埋点）+ T1/T4 先行。
8. T2/T3/T5 错配与增长引导。
- 验收：造一个长会话冲到 75%/90% 分别出现建议；mock AMR 低余额出现预警；每个 nudge 可 dismiss 且不再重复。

### 边界约束（照 AGENTS.md）
- contracts 纯 TS，先改 contracts 再动两端；web 不 import daemon src。
- 新能力 UI+CLI 双轨同 PR；`--json` 必备。
- usage 数据属 daemon data root（`RUNTIME_DATA_DIR` 下 SQLite），不新增路径约定。
- 测试放各包 `tests/`；stream/usage 写入用 `mocks/` 回放验证（`OD_MOCKS_TRACE` + `OD_MOCKS_NO_DELAY=1`）。
- i18n：`types.ts` 先加 key，18 locale 全补。

---

## 5. 竞品对照速查（本方案覆盖点）

| Cursor 的做法（参考截图） | 本方案对应 |
|---|---|
| Context Usage 面板（14% Full · 37.4K/272K · 分段） | 已有 `ContextUsagePanel`，P0 接真实 context window，T1 接引导 |
| 模型 hover 卡（介绍 + 300k context + effort） | P0 模型卡片 |
| 模式 tooltip（Run and coordinate…） | 已有（SessionModeToggle/Design mode 卡） |
| Auto / MAX 档位 | 远期：可在 catalog `recommendedFor` 基础上做 Auto 路由（不在本期） |
| — （Cursor 没有的）账单级余额↔逐次消耗闭环 | AMR 区 + T4/T5，**差异化卖点** |
