---
name: service_management
description: Systemd 守护进程生命周期治理：服务崩溃诊断、配置语法校验、平滑热重载优先与存活复核
triggers: ["服务挂了", "systemctl", "启动失败", "服务重启", "重载配置", "守护进程", "service"]
required_tools: [bash, view_file, edit_file]
---

# Systemd 服务治理与排障 SOP

治理托管在 systemd 下的系统守护进程（如 nginx, docker, sshd, redis 等），必须确保服务可用性与变更透明度。

## 1. 现场取证与状态诊断
- **查看当前状态**：执行 `systemctl status <unit> --no-pager -l`，重点确认：
  - `Active`: 是否为 `active (running)`，还是 `failed` / `activating` / `deactivating`；
  - `Main PID`: 进程 PID 是否频繁跳动（若频繁变动说明陷入 CrashLoop）；
  - `Exit Code`: 进程退出码与信号（如 `code=exited, status=1/FAILURE` 或 `code=killed, signal=KILL`）。
- **提取最近错误日志**：执行 `journalctl -u <unit> -n 50 --no-pager -e`，从最近的崩溃行精准定位根因。

## 2. 单元文件与配置校验
- **Unit 语法自检**：在调整 `/etc/systemd/system/` 下的 `.service` 文件后，必须执行 `systemd-analyze verify /etc/systemd/system/<unit>` 检查语法。
- **通知 systemd 重新加载**：若修改了 unit 定义文件，必须先执行 `systemctl daemon-reload`，否则变更不会生效。

## 3. 变更与重载规范（平滑优先）
- **平滑重载优先**：若服务仅修改了应用配置（如 Nginx、SSHD），优先使用 `systemctl reload <unit>`，避免断开既有长连接。
- **受控重启**：仅在服务完全崩溃、不支持 reload 或重载无效时，执行 `systemctl restart <unit>`。
- **自启动检查**：确保核心服务配置为开机自启：`systemctl is-enabled <unit>`，必要时 `systemctl enable <unit>`。

## 4. 存活复核与验收
- 重载或重启后，严禁直接报告完成。必须立即执行 `systemctl status <unit> --no-pager`。
- 结合 `ss -tulpn | grep <port>` 确认端口已成功被新进程绑定并对外提供服务。
