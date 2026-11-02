---
name: linux_troubleshooting
description: Linux 系统资源瓶颈与故障排查：CPU 飙高、内存泄漏、OOM、磁盘空间与 Inode 打满、网络拥塞
triggers: ["系统负载", "CPU 飙高", "内存不足", "OOM", "磁盘打满", "网络不通", "系统卡顿", "僵尸进程"]
required_tools: [bash, view_file, grep]
---

# Linux 主机故障排查 SOP

面对系统性能急剧劣化、卡顿或不可用时，严禁盲目重启。必须严格遵循「取证 -> 定位 -> 止血」排查流程。

## 1. CPU 与系统负载异常
- **查看宏观负载**：执行 `uptime` 查看 1/5/15 分钟 Load Average；若 Load 大于 CPU 核心数，说明存在排队拥塞。
- **定位高 CPU 进程**：执行 `top -b -n 1 | head -n 25` 或 `ps aux --sort=-%cpu | head -n 10`，抓取前列进程的 PID、USER 及 CMD。
- **细粒度性能分析**：使用 `pidstat -u 1 3` 区分是用户态消耗（%usr）还是内核态消耗（%system）。若 %system 极高，需重点排查频繁系统调用或上下文切换。
- **排查僵尸与不可中断进程**：`ps -eo stat,pid,user,cmd | grep -E '^D|^Z'`，发现 D 状态过多通常代表磁盘 I/O 挂起或 NFS 阻塞。

## 2. 内存不足与 OOM 排查
- **容量与 Swap 状态**：执行 `free -m` 重点观察 `available` 与 `swap` 使用量，若 available 接近 0 且 swap 飙高，系统处于颠簸状态。
- **核验 OOM Killer 记录**：`dmesg -T | grep -i oom` 或 `journalctl -k -n 50 --no-pager | grep -i oom`，确认哪些进程被内核强制杀死及发生时间点。
- **定位内存大户**：执行 `ps aux --sort=-%mem | head -n 10`。

## 3. 磁盘打满与句柄泄露
- **查看空间与 Inode**：并行执行 `df -h`（空间容量）与 `df -i`（Inode 节点）。Inode 耗尽同样会导致写文件报 `No space left on device`。
- **定位大文件与大目录**：执行 `du -ahx / 2>/dev/null | sort -rh | head -n 20` 快速定位异常膨胀的目录（如日志、缓存）。
- **排查已删除但句柄未释放的文件**：执行 `lsof +L1`，找出被删除但仍在被运行中进程持有的文件（导致磁盘空间不释放），找到对应 PID 进行重载。

## 4. 网络连通性与端口调试
- **端口监听与连接数**：执行 `ss -tulpn` 确认端口监听是否正常；`ss -s` 查看全局 TCP 连接摘要。
- **网络接口与路由**：`ip -br addr` 检查网卡状态与 IP；`ip route` 检查默认网关。
- **连通性探测**：使用 `ping -c 3 <target>` 测试连通性；使用 `curl -I -m 5 <url>` 测试应用层响应。
