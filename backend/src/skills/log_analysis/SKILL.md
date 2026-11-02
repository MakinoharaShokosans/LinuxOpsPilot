---
name: log_analysis
description: 系统与业务日志分析：时序窗口检索、严重级别过滤、轮转日志检索与高频错误统计
triggers: ["分析日志", "报错日志", "journalctl", "syslog", "排查异常", "错误统计", "日志分析"]
required_tools: [bash, grep, view_file]
---

# 系统与应用日志分析 SOP

高效、精准地从海量系统与应用日志中提取异常线索，避免在无关刷屏信息中迷失。

## 1. Systemd 结构化日志检索（journalctl）
- **时间窗口精准切片**：避免全量无参调用，使用 `--since` 限定时间范围：
  `journalctl --since "15 minutes ago" -u <svc> --no-pager`
  `journalctl --since "2026-11-02 20:00:00" --until "2026-11-02 21:00:00" -u <svc> --no-pager`
- **按严重级别过滤**：过滤致命与错误级别（0=emerg, 1=alert, 2=crit, 3=err）：
  `journalctl -p 3 -u <svc> -n 50 --no-pager`
- **内核日志分析**：`journalctl -k -n 50 --no-pager` 或 `dmesg -T --level=err,warn` 提取硬件、驱动及 OOM 异常。

## 2. 文本与轮转归档日志分析
- **常见系统日志定位**：
  - `/var/log/syslog` 或 `/var/log/messages`：系统全局事件；
  - `/var/log/auth.log` 或 `/var/log/secure`：SSH 登录与 sudo 权限审计；
  - `/var/log/nginx/` 或 `/var/log/httpd/`：Web 访问与错误日志。
- **压缩归档日志检索**：系统轮转生成的 `.gz` 归档文件使用 `zgrep` 快速检索，无需手动解压：
  `zgrep -i "502 Bad Gateway" /var/log/nginx/error.log.*.gz | head -n 30`。

## 3. 错误频率聚合与高频特征统计
- 单条报错往往不能代表系统整体趋势，使用文本处理工具统计错误分布：
  `grep "ERROR" /var/log/app.log | awk -F'Exception:' '{print $2}' | sort | uniq -c | sort -nr | head -n 10`
- 统计高频访问或异常 IP：
  `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10`。

## 4. 证据沉淀
从日志中提取出确切的报错信息、堆栈关键行、时间点及影响的 PID，使用 `note` 记录关键线索，作为后续根因分析与配置变更的依据。
