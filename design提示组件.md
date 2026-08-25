# 提示组件 UI 设计规范（弹窗 + 轻反馈）

适用范围：苏轼诗文 N 选 64 项目（Vue2 + Vite）。所有反馈类提示统一采用两套组件：**模态弹窗（Modal）** 用于需要用户理解并手动确认的强信息；**轻反馈（Toast）** 用于操作结果、表单校验提醒等无需打断流程的弱信息。

---

## 1. 组件选择原则

| 场景 | 组件 | 示例 |
|---|---|---|
| 规则 / 约束类说明（需用户阅读后决定下一步操作） | Modal | TOP64 数量不为 64、淘汰表为空、导出图片失败 |
| 需要填写内容并提交的表单弹窗 | Modal（自证弹窗） | 首次上传前的真人自证文本 |
| 表单字段缺失提醒 | Toast | 未填写填表人即点击上传 |
| 操作成功 / 失败的结果反馈 | Toast | 上传成功、上传失败 |

### 当前调用分布

- **Modal（`showMsg`）**：导出图片失败 / TOP64 数量不足 64 / 淘汰表为空 / 未找到表格容器
- **Toast（`showToast`）**：请填写填表人（warn）、上传成功（success）、上传失败（error）

---

## 2. 模态弹窗 Modal

### 2.1 结构

```
.auth-mask  遮罩层（fixed 全屏）
 └─ .auth-box  对话框容器
     ├─ .auth-title   标题（带下分割线）
     ├─ .auth-desc    描述区（白底虚线框）
     ├─ [.auth-textarea  文本框]  （仅自证弹窗）
     └─ .auth-footer  底部按钮区
```

### 2.2 遮罩层 `.auth-mask`

| 属性 | 值 |
|---|---|
| position | fixed |
| inset | 0 |
| background | `rgba(44, 62, 44, 0.4)`（墨绿色半透明） |
| 布局 | flex 水平垂直居中 |
| z-index | 9999 |
| padding | 20px（小屏贴边保护） |

### 2.3 对话框 `.auth-box`

| 属性 | 值 |
|---|---|
| 背景 | `#faf9f6`（米白） |
| 边框 | 1px solid `#b8cdb8` |
| 宽度 | 100% / max-width 560px |
| 内边距 | 24px 26px |
| 阴影 | 0 12px 40px `rgba(44,62,44,0.2)` |
| 小屏（≤700px）内边距 | 18px 16px |

### 2.4 标题 `.auth-title`

| 属性 | 值 |
|---|---|
| 字号 | 18px |
| 字重 | 700 |
| 字距 | 2px |
| 颜色 | `#2c3e2c`（墨绿） |
| 下边框 | 1px solid `#b8cdb8`，距标题 10px |
| 小屏字号 | 15px |

### 2.5 描述区 `.auth-desc`

| 属性 | 值 |
|---|---|
| 字号 | 13px |
| 颜色 | `#4a7a52` |
| 行高 | 1.7 |
| 背景 | `#fff` |
| 边框 | 1px dashed `#b8cdb8` |
| 内边距 | 10px 14px |
| 小屏字号 / 行高 / 内边距 | 12px / 1.6 / 8px 10px |

### 2.6 文本框 `.auth-textarea`（仅自证弹窗）

| 属性 | 值 |
|---|---|
| 宽度 | 100% |
| 边框 | 1px solid `#b8cdb8`（focus → `#4a7a52`） |
| 字号 | 13px，行高 1.7 |
| 背景 | `#fff` |
| 占位符颜色 | `#b8cdb8` |
| 可调大小 | vertical |

### 2.7 底部按钮区 `.auth-footer`

| 属性 | 值 |
|---|---|
| 布局 | flex 右对齐 |
| 间距 | gap 10px |
| 上方外边距 | 16px |
| 左侧辅助计数 `.auth-count-tip` | 12px，`#b8cdb8`；达标态 `.ok` → `#4a7a52` 加粗 |

### 2.8 按钮 `.btn`

| 属性 | 值 |
|---|---|
| 背景 | `#fff` |
| 文字颜色 | `#2c3e2c` |
| 边框 | 1px solid `#b8cdb8`，圆角 4px |
| 字号 | 13px，字重 500，字距 1px |
| 内边距 | 6px 14px，固定宽度：桌面 58px / 移动端 42px |
| hover | bg `#f5f8f4`，边框 `#4a7a52` |
| active | bg `#e3f1e5` |
| disabled | opacity 0.5，cursor not-allowed |

主按钮 `.btn-upload` 与普通按钮同色（同体系下不做强调色差异，通过右置 + 顺序体现层级）。

---

## 3. 轻反馈 Toast

### 3.1 结构

```
.toast-wrap  容器（fixed 屏幕中央）
 ├─ .toast-icon  状态图标（✓ / ✕ / !，圆边框）
 └─ .toast-text  提示文本
```

Vue `<transition name="toast-fade">` 包裹，提供淡入淡出 + 轻微位移。

### 3.2 容器 `.toast-wrap`

| 属性 | 值 |
|---|---|
| position | fixed，top 50% / left 50%，translate 居中 |
| z-index | 10000 |
| 最小宽度 | 160px，最大宽度 80vw |
| 内边距 | 12px 20px |
| 圆角 | 6px |
| 字号 | 14px，行高 1.5，字距 1px，居中对齐 |
| 文字颜色 | `#fff` |
| 布局 | flex 水平排列，gap 10px |
| 阴影 | 0 8px 24px `rgba(44,62,44,0.25)` |
| user-select | none |
| 小屏（≤700px） | 字号 13px，内边距 10px 16px，min-width 140px |

### 3.3 三种状态配色

| 类型 | class | 背景色 | 边框色 | 场景 |
|---|---|---|---|---|
| 默认（info） | `.toast-wrap` | `rgba(44, 62, 44, 0.88)` | `rgba(184,205,184,0.5)` | 通用提示 |
| 成功 | `.toast-success` | `rgba(74, 122, 82, 0.92)` | `#8fae93` | 上传成功 |
| 错误 | `.toast-error` | `rgba(160, 78, 78, 0.92)` | `#cdb8b8` | 上传失败 |
| 警告 | `.toast-warn` | `rgba(160, 130, 70, 0.92)` | `#cdc4b8` | 表单缺失 / 未填写填表人 |

### 3.4 图标 `.toast-icon`

| 属性 | 值 |
|---|---|
| 大小 | 20×20px（小屏 18×18px） |
| 形状 | 圆形，1.5px 白色边框 |
| 内部字符 | ✓（success）/ ✕（error）/ !（warn） |
| 字号 | 13px（小屏 12px），字重 700 |
| 布局 | inline-flex 居中 |

### 3.5 动效 `toast-fade`

| 阶段 | 透明度 | 位移 |
|---|---|---|
| enter-from / leave-to | 0 | translate(-50%, -60%)（向上 10px 偏移） |
| enter-active / leave-active | transition 0.2s ease（opacity + transform） | - |

默认显示时长：success/warn 2000ms，error 3000ms（可通过 `duration` 参数覆盖）。连续调用时自动清除上一个定时器，避免叠加。

---

## 4. API 接口

### 4.1 Modal：`showMsg(title, desc)`
- 挂在 App.vue methods 中，全局可调用
- 关闭：点击「知道了」或点击遮罩空白处

### 4.2 Toast：`showToast(text, type = 'success', duration = 2000)`
- `text`：提示文案（必填）
- `type`：`success` / `error` / `warn` / `info`（不传则为 info 默认色）
- `duration`：显示毫秒数，建议 success=2000、warn=2000、error=3000

---

## 5. 色板速查

| 用途 | 色值 | 备注 |
|---|---|---|
| 墨绿主色 | `#2c3e2c` | 标题、按钮文字 |
| 次绿 | `#4a7a52` | 描述文字、success 背景 |
| 浅绿边 | `#b8cdb8` | 边框、分割线、disabled |
| 米白底 | `#faf9f6` | 弹窗 / 页面背景 |
| 错误红 | `rgba(160,78,78,0.92)` | Toast error |
| 警告黄 | `rgba(160,130,70,0.92)` | Toast warn |
