# LinuxOpsPilot 后端

LinuxOpsPilot SRE 运行时、HTTP API 与两个独立安全 sidecar（`bash_shell`、`web_search`）。

> 📖 **快速定位与修改指南**：详见 [**`DIRECTORY_GUIDE.md`**](DIRECTORY_GUIDE.md)，包含三层架构拓扑、SRE 运维时序图以及按修改需求的秒查索引表。

## 目录与功能结构

```
src/
├── agent_runtime/     SRE 运行时核心：
│                      core / loop (ReAct 步进) / checkpoint (状态快照) /
│                      guardrails (权限矩阵与防自毁) / approval (人机协同审批) /
│                      context (提示词工程与观察值蒸馏) / memory (SQLite 会话持久化) /
│                      skills (SOP 技能扫描) / runtime / api (REST / SSE 接口)
├── baseagent_config/  配置加载与校验（pydantic，支持零工作区 workspaces_dir）
├── tools/             工具层：core（注册表、派发器）、builtin（解绑系统路径、禁区拦截、YAML即时诊断）
├── mcps/              MCP 外部工具扩展接入
├── services/          独立隔离进程：bash_shell (含 NETWORK_SUICIDE_RISK 审计)、web_search
├── skills/            5 大内置生产级 SRE SOP 技能包 + Shell 规范
└── evaluation/        评测框架（baseagent-bench）
tests/                 全量 2038 个单测与端到端真实 SRE 场景测试套件
```

## 核心特性
- **Zero-Workspace**：会话自动在 `storage/workspaces/<session_id>` 建立独立沙盒，无需手动指定或切换工作区；
- **SRE 权限矩阵**：放行常用只读诊断命令（`top`, `df`, `ss`, `ip`, `systemctl status` 等），`sudo` 映射特权审批，拦截断网自毁命令；
- **系统路径解绑与核心禁区保护**：放行 `/etc/`、`/var/log/`、`/tmp/` 等合法路径，拦截 `/boot`、`/sys`、`/proc`、`/etc/shadow` 等核心系统禁区；
- **SRE 黄金工作法五项纪律**：提示词强制约束“先诊断后动刀、动前备份、语法前检、平滑重载优先、存活复核”。

## 开发与测试

```bash
make install     # uv sync 同步依赖
make lint        # ruff check + pyright + import-linter 静态校验
make test        # 运行全量 2038 项自动化测试（uv run pytest）
```
