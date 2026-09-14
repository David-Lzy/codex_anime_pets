# Codex Anime Pets

[English](README.md) | **简体中文**

可检索、可分享的 Codex 桌宠合集。目前有四款重制角色，提供 Codex 内置版和独立高清版，保留生成题词及素材来源记录。

| Assistant-004 半Q版 | Assistant-004 修长版 | 三月七 | 琪露诺 |
| --- | --- | --- | --- |
| ![半Q版](pets/assistant-004/assets/previews/idle.gif) | ![修长版](pets/assistant-004-anime/assets/previews/idle.gif) | ![三月七](pets/march-7th-001/assets/previews/idle.gif) | ![琪露诺](pets/cirno-009/assets/previews/idle.gif) |
| 原创，约3.5头身 | 原创，约5头身 | 非官方同人 | 非官方同人 |

## 下载与使用

[最新 Release 与 SHA-256 校验值](https://github.com/David-Lzy/codex_anime_pets/releases/latest)

- **Codex-Anime-Pets.zip**：轻量 Codex 内置宠物安装包，含 v2 和 v1 兼容素材。
- **Assistant-004-Desktop-2.0.0-win-x64.zip**：独立 Windows 高清桌宠，**未签名**。完整解压后双击 **Assistant-004 Desktop.exe**，无需额外安装 Python 或 Node。
- 原生图片、生成题词与构建源码保存在本仓库。Windows 成品由 GitHub Actions 构建，不把二进制放进 Git 历史。

## 安装到 Codex

先解压安装包。Windows 双击 `scripts/install.bat` 默认安装 Assistant-004；也可以选择角色或全部安装：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId assistant-004-anime
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -All
```

macOS/Linux 需要 Python 3.9+：

```sh
sh scripts/install.sh --pet assistant-004
sh scripts/install.sh --all
```

跨平台 Python 入口：

```sh
python scripts/install.py --list
python scripts/install.py --pet cirno-009
```

旧客户端在 Python/Shell 命令后加 `--legacy`，PowerShell 加 `-Legacy`。安装器只复制 `pet.json` 和 `spritesheet.webp`，优先使用 `$CODEX_HOME/pets/<id>/`，否则使用 `~/.codex/pets/<id>/`。已有文件先备份到 `pets/.backups/`。未立即出现时刷新宠物列表或重启 Codex。需要支持桌宠的 Codex 桌面客户端，安装脚本不会安装客户端本身。

手动安装时，从角色目录复制上述两个文件；旧版请复制 `compat/v1/` 中的那一对文件。

## 独立高清桌宠

四款角色使用真实透明的 **768x832** 帧，由 Electron/Canvas 播放。默认窗口高约320像素。拖动移动、单击挥手、双击轻跳；右键或托盘菜单可切换角色、动作、大小、暂停、鼠标朝向、鼠标穿透、跟随任务、重置位置与退出。

可选的 **Codex integration** 在确认后备份并合并观察型 Hooks，通过带随机令牌的本机回环接口接收最小状态事件。不传输题词或工具输出，不改变审批，不自动连接远程任务。未启用联动时也可以手动切换动作。

详细信任步骤、事件限制和构建方式见[中文桌宠说明](desktop/README.zh-CN.md)。Windows 成品未签名；**macOS/Linux 本次只提供源码与构建说明，不宣称实机验收。** 默认不开机启动。

## 本次重制

每款包含九种动作与16个闲置朝向，从正上方顺时针排列。两款 Assistant 在工作、审阅、挫败、等待时穿白大褂，其余动作穿日常短外套。三月七与琪露诺保留各自同人服装。

素材采用原生高分辨率纯绿底动作图，经本地抠图得到真实 RGBA。装配统一缩放整张画布，只平移对齐脚底；不会把每帧人物裁出后单独拉伸。跳跃保留实际画出的蓄力、腾空、落地，左移动作由右移周期镜像获得。

Codex v2 图集为 **1536x2288**、8列11行，每格 **192x208**；v1 为 **1536x1872**。内置图集与高清播放素材分开，不修改 Codex 客户端，不承诺自定义客户端播放帧率。旧美术保留在 Git 历史中。

## 检索与扩展

- [宠物列表](PETS.md)
- [机器可读目录](catalog.json)
- [AI 检索索引](indexes/ai-search-index.json)
- [标签索引](indexes/tags.json)
- [目录格式](schemas/catalog.schema.json)
- [题词、来源及装配说明](art/README.md)
- [文件校验清单](manifest.json)
- [验收记录及剩余交互检查](art/QA.md)

检索示例：“找一个适合 AI 工程师、会吐槽的原创实验室助理 Codex 高清桌宠。”元数据便于检索，但不保证任何搜索引擎一定收录。

新增角色时创建 `pets/<id>/`，在 `catalog.json` 注册，保留题词和权利说明；运行 `python scripts/build_index.py` 更新索引，再按美术说明验证。轻量安装包有自己的子集清单，仓库清单覆盖公开源码和素材。

## 授权

代码与原创项目元数据采用 MIT。**MIT 不授予同人角色或所属作品的权利。** 三月七和琪露诺沿用非商业个人桌面使用的非官方同人声明，见 [NOTICE](NOTICE.md)。Assistant-004 为原创设计。用户上传的系列参考图不随包再发布。
