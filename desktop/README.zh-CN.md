# Assistant-004 独立桌宠

[English](README.md) | [中文](README.zh-CN.md)

**开发状态：**动画引擎和本机事件联动已实现；新版高清角色动画尚未通过验收，也尚未包含在项目中。正式启动需要两套已验收的高清素材，测试用几何图形不会进入发布包。

## 源码运行

需要 Node.js 22.12+ 和 pnpm 11.19.0。在此目录运行：

```sh
pnpm install --frozen-lockfile
pnpm start
```

需要 `pets/assistant-004/hd/` 和 `pets/assistant-004-anime/hd/`，各自包含 `animation.json`、无损 WebP 动作图及 `tray.png`。每帧为 768×832。装配脚本只接受已验收的原始帧，会拒绝假透明图、分辨率不足的图和重复静态图凑帧。

## 本机 Codex 联动

在托盘菜单选择 **Codex integration**。启用时会再次确认，先备份 `$CODEX_HOME/hooks.json`，未设置环境变量则使用 `~/.codex/hooks.json`，再追加观察事件的 Hooks。已有配置保留。启用后开始新一轮 Codex 任务。

事件只发往绑定 `127.0.0.1` 的随机端口，通过保存在程序用户数据目录的随机令牌认证。发送内容仅包含事件类型、任务与轮次及工具调用标识、工具名、结构化错误标志、时间戳和工作目录末级名称。不发送提示词、工具参数、完整输出、凭据或聊天记录，不上传到任何服务。

Hooks 在后台运行，不输出内容，也不会批准、拒绝或修改 Codex 操作。工具报错只触发短暂挫败动作，不判断整个任务失败；无法解析的错误不会靠文本猜测。连续30分钟没有事件时标记状态未确认，不当作失败。不会自动连接远程服务器任务。

关闭联动仅移除带有完整 `Assistant004Hook` 标识的处理器，保留备份。删除或移动程序前应先关闭联动；正常退出会保留配置供下次启动使用，程序关闭期间的事件发送会静默结束。

接口依据：[官方 Codex Hooks](https://learn.chatgpt.com/docs/hooks)。

## 操作

拖动角色移动位置，单击挥手，双击小跳。右键或托盘菜单可切换角色、动作、大小、暂停、鼠标朝向、鼠标穿透及跟随任务。开启穿透后仍可从托盘恢复。不设置开机启动。

工作、审阅、等待和挫败动作使用白大褂；闲置、招手、跳跃与左右移动使用日常外套，服装随动作切换。

## 测试与打包

```sh
pnpm test
python ../scripts/make_test_art.py
node smoke.cjs
pnpm dist:win
```

macOS/Linux 可执行 `pnpm build:dir`，为当前系统生成未归档程序目录；这些平台尚未经过实机验收。

可选的 Electron 冒烟测试还需要 Node 能找到 Playwright。几何测试图仅验证渲染、透明、计时动画、暂停、拖动、缩放和事件接收，**不代表美术验收**。设置 `TEST_DPR=1.25` 或 `2` 可检查显示缩放。

Windows ZIP 未签名，运行前请核对源码和 SHA-256 校验值。macOS/Linux 目前仅提供源码和构建说明，不声称经过实机验收。Linux 的透明窗体、托盘与定位受桌面环境影响，Wayland 行为不作保证。macOS/Linux 从源码启动时，Codex 的 Hooks 进程需要能找到 `node`。

GitHub Actions 发布会检查两套高清素材均已验收；可执行文件不写入 Git 历史。渲染进程启用沙箱与隔离，禁用 Node 集成和远程页面跳转。
