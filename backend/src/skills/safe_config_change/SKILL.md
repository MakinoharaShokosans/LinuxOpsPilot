---
name: safe_config_change
description: 生产配置安全热修规范：动前备份、局部精准替换、组件语法预检、平滑重载与健康探针
triggers: ["修改配置", "nginx 配置", "修改参数", "配置变更", "热修", "语法检查"]
required_tools: [bash, view_file, edit_file, write_file]
---

# 生产配置安全热修 SOP

在生产环境下修改关键系统与中间件配置（如 Nginx, SSHD, MySQL, Redis, Sudoers, K8s manifests 等），必须遵循零事故防御规范。

## 1. 动前备份（Backup First）
- 使用 `edit_file` 或 `write_file` 会自动在当前会话的 `backups/` 目录下生成历史快照。
- 若通过 shell 脚本进行辅助变动，必须显式创建时间戳备份：
  `cp -a <config_file> <config_file>.bak_$(date +%Y%m%d%H%M%S)`。
- 确认备份存在且大小一致后，方可进行实质修改。

## 2. 局部精准替换（Minimize Diffs）
- 严禁对生产配置执行全文件盲目覆写。
- 优先使用 `edit_file` 定位目标行或上下文进行精准替换，改动后审阅工具返回的 Unified Diff，核对是否有意外夹带的空白字符或配置误删。

## 3. 语法预飞自检（Pre-flight Check）
修改完成之后、重载服务之前，**必须强制执行对应组件的原生语法检查**，未通过前严禁执行任何重载：
| 组件 | 必须执行的自检命令 |
|---|---|
| Nginx | `nginx -t` |
| SSHD | `sshd -t` |
| Systemd 单元 | `systemd-analyze verify <unit_file>` |
| Sudoers 授权 | `visudo -c` |
| Apache / HTTPD | `apache2ctl -t` 或 `httpd -t` |
| HAProxy | `haproxy -c -f <config>` |
| Docker Compose | `docker compose config -q` |

## 4. 平滑热重载（Graceful Reload）
- 自检命令退出码为 0 时，优先执行平滑重载：`systemctl reload <svc>` 或 `kill -HUP <pid>`。
- 严禁直接执行全量重启（restart），除非该组件架构不支持动态 reload。

## 5. 探针复核与回滚预案
- 重载后立即执行 `systemctl status <svc> --no-pager` 确认主进程健康。
- 检查端口监听与错误日志：`tail -n 20 /var/log/<svc>/error.log`。
- 若探针异常或业务端口丢失，立即将备份文件原样还原并再次 reload，实现秒级止血回滚。
