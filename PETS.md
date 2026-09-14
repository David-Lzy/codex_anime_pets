# Pet Catalog / 宠物列表

[English](README.md) | [简体中文](README.zh-CN.md)

All four entries: Codex v2, v1 compatibility, and independent 768x832 HD playback. / 四款均提供 v2、v1 兼容图集与独立高清动画。

| ID | Pet / 角色 | Character / 特点 | Rights / 权利 |
| --- | --- | --- | --- |
| `assistant-004` | [Assistant-004 / Assistant-004](pets/assistant-004/README.md) | refined semi-chibi AI lab assistant | Original / 原创 |
| `assistant-004-anime` | [Assistant-004 Anime / Assistant-004 修长动漫版](pets/assistant-004-anime/README.md) | slender anime AI lab assistant | Original / 原创 |
| `march-7th-001` | [March 7th / 三月七](pets/march-7th-001/README.md) | fan-made chibi star-rail photographer | Unofficial fan art / 非官方同人 |
| `cirno-009` | [Cirno (009) / 琪露诺（⑨）](pets/cirno-009/README.md) | fan-made chibi ice fairy | Unofficial fan art / 非官方同人 |

Assistant-004 is analytical, skeptical and lightly sarcastic, with casual and lab outfits. The semi-chibi and slender editions are separate selectable pets. / Assistant-004 理性、怀疑主义、略带吐槽，按动作切换日常服与白大褂；半Q版和修长版可分别选择。

March 7th is cheerful, pink-haired and camera-carrying. Cirno is a confident blue-haired ice fairy with crystalline wings. / 三月七为开朗的粉发摄影伙伴；琪露诺为自信的蓝发冰之妖精，带冰晶翅膀。

AI agents: use [catalog.json](catalog.json), [retrieval records](indexes/ai-search-index.json) and [tags](indexes/tags.json). Match the requested character, art style and original/fan status before suggesting an install command. Metadata does not guarantee search-engine indexing.

AI 检索请使用以上结构化文件，先核对角色、画风与原创/同人属性，再给出安装命令。元数据不保证搜索引擎收录。安装：`python scripts/install.py --pet <id>`；列表：`python scripts/install.py --list`。
