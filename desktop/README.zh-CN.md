# Assistant-004 Desktop

[English](README.md) | **简体中文**

独立透明置顶的 Electron/Canvas 高清桌宠，包含四款重制角色，不修改 Codex 客户端。每帧768x832，真实 RGBA，按实际时间和素材帧时长播放。

## Windows 使用

从 [Releases](https://github.com/David-Lzy/codex_anime_pets/releases/latest) 下载 **未签名** 的 Windows ZIP，核对 SHA-256 后完整解压，双击 **Assistant-004 Desktop.exe**。不要只移动 EXE，需要保留同目录资源。成品不依赖另行安装 Python 或 Node。

拖动移动、单击挥手、双击轻跳。右键或托盘菜单可选角色、动作、大小（160至640像素）、暂停、鼠标朝向、鼠标穿透、跟随任务、重置位置和退出。启用穿透后仍可用托盘恢复。位置自动保存，重启会限制在当前显示器可见范围内。默认不开机启动。

两款 Assistant 在工作、审阅、等待、挫败时穿白大褂，其他状态穿日常短外套。三月七和琪露诺保留各自服装与非官方同人声明。

## 可选 Codex 联动

1. 从托盘菜单选择 **Codex integration** 并确认。
2. 程序先备份，再合并 `$CODEX_HOME/hooks.json`，未配置环境变量时使用 `~/.codex/hooks.json`。原有处理项保留。
3. Codex 提示时，请审查并信任新增 Hooks；未信任的非托管 Hooks 不会执行。启用后开始新一轮任务。客户端能力或工作区策略可能限制 Hooks。
4. 菜单区分关闭、设置失败不可用、已启用但尚无事件、已连接、长时间无事件待确认。

只向 **127.0.0.1** 上随机端口发送最小事件，使用随机令牌校验。字段仅包括事件类型、可用的任务/轮次/调用标识、工具名、时间、工作区末级名称与结构化错误标记。不发送或记录题词、参数、完整工具输出、对话及凭据，不自动联动服务器任务。

提交任务显示工作中；审批或输入请求显示等待；后续可观察的工具完成事件恢复工作；Stop/Interrupt 回闲置。明确工具错误短暂显示挫败，不代表整个任务失败。审阅保留手动选择。官方没有提供独立的“审批已完成”事件，因此审批后恢复显示可能滞后到匹配工具返回或其他可观察事件；后台事件也可能延迟。Hooks 是状态提示，不是完整执行追踪。静默30分钟后显示待确认，不标成失败。

默认跟随最近有事件的任务，也可固定任务。Hooks 异步执行，不输出审批决定；程序未运行或发送失败时静默返回。接口依据：[官方 Hooks 文档](https://learn.chatgpt.com/zh-Hans/docs/hooks)。

关闭联动只移除本工具标记的处理项，不删除其他 Hooks，备份保留。删除或移动程序前先关闭联动。单纯退出保留注册，供下次启动使用。不提供自动审批、抓取对话、远程页面或远程控制。

## 源码运行与构建

需要 Node.js 22.12+、pnpm 11.19.0 和包含 `pets/*/hd/` 的完整仓库：

```sh
cd desktop
pnpm install --frozen-lockfile
pnpm start
pnpm test
pnpm dist:win
```

macOS/Linux 可在相应主机执行 `pnpm build:dir` 构建未打包目录，**本次未进行实机验收**。Linux 透明窗口、位置及托盘行为受合成器影响，不保证 Wayland 表现；这些平台源码启动的 Hooks 帮助程序需要 Codex 的 PATH 中可用 Node。

## 验证

参见[验收记录及剩余交互检查](https://github.com/David-Lzy/codex_anime_pets/blob/main/art/QA.md)。原生鼠标点击投递与真实 Codex
信任、审批流程仍需交互桌面验证；本地模拟事件不等于真实任务联动验收。

```sh
python -m unittest discover -s scripts -p 'test_*.py'
node --test desktop/test.cjs
```

可选 `desktop/smoke.cjs` 需要 Playwright 位于 Node 模块路径。设置 `ASSISTANT004_REAL_ART=1`、`ASSISTANT004_ASSETS` 为 `pets` 的绝对路径、`ASSISTANT004_REVIEW_ALL=1`，检查深浅背景下内置和高清尺寸的所有动作循环。用 `TEST_DPR=1`、`1.25` 或 `2` 检查缩放。不启用真实素材模式时，用 `scripts/make_test_art.py` 生成几何测试夹具；夹具不能证明美术质量。

GitHub Actions 仅在四款素材均有验收记录时发布 Windows ZIP 和校验值。EXE 不提交进 Git。渲染进程关闭 Node 集成，启用上下文隔离与沙箱，仅开放必要 IPC，禁止跳转远程页面。
