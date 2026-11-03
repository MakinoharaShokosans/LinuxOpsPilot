# LinuxOpsPilot

专为 Linux 生产与运维环境打造的智能 SRE 故障排查与运维治理智能体（Autonomous Linux SRE Agent）。

---

## 为什么有 LinuxOpsPilot

现有的很多自主 Agent（如以写代码、拉分支、建代码仓库为核心的 Coding Agent）直接用于 Linux 生产运维时存在明显的错位：
- **单工作区死锁**：被死锁在特定的代码工程目录下，无法感知宿主机全局真实运行的系统配置（`/etc`）与日志（`/var/log`）；
- **缺乏 SRE 运维直觉**：遇到服务异常倾向于盲目猜测或直接重启，缺乏“先查监控、看日志、排网络、动前备份、语法前检、平滑重载、探针复核”的防事故防御本能；
- **权限与安全失衡**：要么为了能跑命令大开后门导致执行 `ip link down` 或 `iptables -F` 瞬间断网自毁，要么哪怕查个 `uptime`、`df -h` 都要频繁弹窗审批打扰运维人员；
- **过度包装与工具冗余**：试图用笨重的 Python 代码包装单体诊断工具，剥夺了 Agent 并行使用原生 Shell 诊断工具链的强大能力。

LinuxOpsPilot 走纯粹的 **SRE 专精与 CLI-First 原生优先** 路线：
**将主循环控制权交给大模型，通过严密的权限矩阵、核心禁区防御、自动快照备份与标准化 SRE SOP，打造可靠、安全、知进退的 Linux 运维智能助理。**

---

## 核心设计支柱

### 1. CLI-First / Shell 原生优先
- 拒绝在后端搞抽象笨重的单体 Python 运维函数。
- Agent 通过 `bash` 原生并行编写非交互命令，自由调用 Linux 丰富的系统工具（`top`, `ss`, `ip`, `df`, `free`, `journalctl`, `systemctl`, `docker` 等），诊断输出自动流式截断并生成持久化句柄（`read_artifact`）。

### 2. SRE 黄金工作法五项纪律（系统提示词硬约束）
1. **先诊断后动刀（Observe First）**：严禁盲目重启。先并行调取资源负载（`top`/`free`/`df`）、连接状态（`ss -tulpn`）与服务错误日志（`journalctl -u <svc> -n 50 --no-pager`）。
2. **动前备份（Backup First）**：修改生产配置（如 `/etc/` 下文件）前必须保证快照留痕。`edit_file` 与 `write_file` 会自动备份至当前任务目录；bash 修改必须显式时间戳备份。
3. **语法前检（Pre-flight Syntax Check）**：重载服务前必须强制执行配置自检（`nginx -t`, `sshd -t`, `systemd-analyze verify`, `visudo -c`, `docker compose config`）。语法未通过绝不允许重载服务。
4. **平滑重载优先（Reload over Restart）**：支持热重载的组件优先执行 `systemctl reload` 或 `kill -HUP`，最大限度保障既有长连接业务无损。
5. **变更后健康复核（Health Probe）**：操作完成后主动检查进程 PID、服务状态与端口监听，确认无 Crash 后方可交付。

### 3. 去工作区架构（Zero-Workspace）
- 摒弃传统开发类 Agent 繁重的手动多工作区切换模式。
- 每个会话自动锚定在 `storage/workspaces/<session_id>` 专属轻量沙盒，存放该会话产生的临时排障脚本、分析报表与备份快照。

### 4. SRE 权限控制矩阵与防断网自毁审计
- **只读探测无感放行（`read_only`）**：`uptime`、`top`、`free`、`df`、`ss`、`ip`、`systemctl status`、`docker ps`、`journalctl` 等免审批直接执行。
- **平滑变更受控写（`workspace_write`）**：`systemctl reload`、`docker compose restart`、安全写文件受控放行。
- **高危操作特权审批（`privileged`）**：`sudo` 提权命令、服务强行停启必须经由人类操作员（HITL）审批。
- **防自毁硬护栏（`NETWORK_SUICIDE_RISK`）**：在前置命令审计层坚决拦截 `ip link set ... down`、`ifconfig ... down`、`iptables -F`、`nft flush ruleset` 等导致主机失联的高危自毁指令。

### 5. 工具路径解绑与核心敏感禁区保护
- 文件工具（`view_file`, `edit_file`, `write_file`, `grep`）全面支持查看与局部热修宿主机绝对路径（`/etc/`, `/var/log/`, `/tmp/` 等）。
- 物理拦截核心系统禁区：无论是否经过审批，坚决拒绝触碰 `/boot`、`/sys`、`/proc`、`/dev` 硬件内核区与 `/etc/shadow`、`/etc/sudoers` 凭据区。
- 内建 YAML 语法进程内即时诊断，改动 Docker Compose 或 Kubernetes manifests 错误直接在观察值中反馈。

### 6. SRE 纯净技能库（Built-in SOPs）
内置 5 大生产级标准运维 SOP 技能 + Shell 最佳实践：
1. **`linux_troubleshooting`**：CPU 飙高、内存泄漏、OOM、磁盘容量/Inode 打满、网络拥塞定位排障 SOP。
2. **`service_management`**：Systemd 守护进程生命周期治理、崩溃原因分析、平滑重载与存活复核 SOP。
3. **`docker_container_ops`**：Docker 容器退出码诊断、崩溃日志提取、端口网络调试与 Compose 治理 SOP。
4. **`safe_config_change`**：生产配置动前备份、局部精准替换（Unified Diff）、语法预检自检与回滚预案 SOP。
5. **`log_analysis`**：journalctl/syslog 时序切片、严重级别过滤、轮转压缩归档检索（zgrep）与高频错误统计 SOP。
6. **`shell_best_practices`**：非交互模式规范、输出截断控制、避免高危操作的 Shell 执行守则。

---

## 快速开始

### 1. 环境准备
- **操作系统**：Linux（生产首选）或 macOS。
- **Python 环境**：Python 3.12（推荐使用 [`uv`](https://github.com/astral-sh/uv) 自动管理）。
- **Node 环境**：Node.js >= 20，`pnpm >= 9`。

### 2. 配置密钥与环境
复制环境变量模板并填入模型密钥：
```bash
cp .env.example .env     # 填写 DEEPSEEK_API_KEY（或其它 OpenAI 兼容提供商密钥）
```

### 3. 一键安装依赖与自检
```bash
make install             # 一键同步 Python 虚拟环境与安装前端依赖
make check               # 运行静态分析 + 类型检查 + 离线回归测试（2038 个单测）
```

### 4. 启动服务
```bash
make start               # 一键并发启动全套服务
# 或进入后端目录执行：
cd backend && uv run baseagent start
```

服务端口矩阵：
- **前端 Web 运维仪表盘**：`http://127.0.0.1:5173`（支持 SRE 常用运维快捷卡片、滑动时间轴导轨导航、人机协同审批卡片）
- **后端核心 API**：`http://127.0.0.1:11328`
- **Shell 沙箱 Sidecar**：`http://127.0.0.1:11326`
- **Web 搜索 Sidecar**：`http://127.0.0.1:11327`

---

## 部署与生产运维加固

### 1. 本地回环与网络暴露原则
- LinuxOpsPilot 默认严格绑定在 `127.0.0.1` 本地回环接口。
- **切勿将控制台端口裸露暴露在公网**。推荐通过 **Tailscale / WireGuard** 私有虚拟网或 **SSH 端口转发隧道** 进行远程安全访问：
  ```bash
  # 本地终端建立加密隧道直连远程服务器：
  ssh -N -L 5173:127.0.0.1:5173 -L 11328:127.0.0.1:11328 user@your-server-ip
  ```

### 2. Linux Systemd 常驻服务配置
创建 `/etc/systemd/system/linuxopspilot.service`：
```ini
[Unit]
Description=LinuxOpsPilot SRE Runtime Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/LinuxOpsPilot/backend
EnvironmentFile=/path/to/LinuxOpsPilot/.env
ExecStart=/usr/local/bin/uv run baseagent start --no-frontend
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```
启停命令：
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now linuxopspilot
sudo systemctl status linuxopspilot
```

### 3. 前端静态打包与 Nginx 反向代理
生产环境推荐静态打包并通过 Nginx 托管：
```bash
cd frontend && pnpm build   # 静态资源输出至 frontend/dist
```

Nginx 反向代理配置（支持 SSE 禁用缓冲）：
```nginx
server {
    listen 80;
    server_name linuxops.internal;

    location / {
        root /path/to/LinuxOpsPilot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:11328;
        proxy_http_version 1.1;

        # 关键：支持 SSE 事件流实时推流
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 仓库结构

```
LinuxOpsPilot/
├── backend/                 # Python 3.12 SRE 运行时、API、沙箱 Sidecar 与评测体系
│   ├── src/agent_runtime/   # 主循环、权限策略、提示词工程、检查点与存储
│   ├── src/services/        # 独立的 bash_shell 与 web_search 安全沙箱
│   ├── src/skills/          # 5 大内置生产级 SRE SOP 技能包
│   ├── src/tools/           # 内置文件/检索/Shell/YAML即时诊断工具
│   └── tests/               # 2038 个单测与端到端运维集成测试套件
├── frontend/                # React 19 + Tailwind CSS SRE 运维仪表盘
│   ├── src/features/        # 会话流、快捷运维卡片、审批卡片、检视器
│   └── dist/                # 生产静态打包产物
├── config/config.toml       # 运行时权限、核心禁区、端点降级与参数策略
├── docs/                    # 完整设计与架构文档
└── Makefile                 # 一键开发、测试与构建命令
```

---

## 质量与测试保证

代码库包含严格的契约保障与全量回归测试：
```bash
cd backend && uv run pytest
# 2038 passed in 61.62s (100% 通过率，0 失败，0 告警)
```
- `tests/test_ops_scenarios_e2e.py`：端到端真实 SRE 生产运维链路验证；
- `tests/test_permissions.py`：SRE 运维命令权限分类覆盖；
- `tests/test_tools_files.py` / `test_tools_edit_search.py`：路径沙箱与核心禁区安全防御验证；
- `tests/test_builtin_skills.py`：SRE 技能包元数据与防注入合规校验。
