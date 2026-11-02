---
name: docker_container_ops
description: Docker 容器与编排运维：容器异常退出排查、日志提取、端口网络诊断与 Compose 治理
triggers: ["docker", "容器挂了", "容器重启", "compose", "容器日志", "镜像", "容器退出"]
required_tools: [bash, view_file, edit_file]
---

# Docker 与容器化运维 SOP

面向 Docker 引擎及 Docker Compose 容器编排场景，规范容器诊断、网络调试与配置变更流程。

## 1. 容器运行状态排查
- **排查异常容器**：执行 `docker ps -a --no-trunc` 检查全量容器状态，重点关注非 `Up` 状态（如 `Exited (1)`、`CrashLoopBackOff`、`Restarting`）。
- **精准提取退出根因**：
  - 执行 `docker inspect <container> --format '{{json .State}}'`，分析 `ExitCode`、`OOMKilled`、`Error` 与 `FinishedAt`；
  - 若 `OOMKilled: true`，说明达到内存限额被杀死，需调整内存配额或排查内存泄漏。
- **提取崩溃日志**：执行 `docker logs --tail 100 --timestamps <container>` 检索容器末尾输出。

## 2. 容器网络与端口排查
- **端口映射验证**：执行 `docker port <container>` 检查宿主机到容器内部的端口绑定。
- **网络连通性调试**：执行 `docker network inspect <network>` 查看容器所属子网、网关及 IP 分配，确认多容器间能否通过别名连通。
- **宿主机防火墙影响**：确认 iptables 规则未拦截 Docker 网桥流量（`docker0` 或自定义 bridge）。

## 3. Docker Compose 编排治理
- **配置语法前检**：修改 `docker-compose.yml` 后，必须先执行 `docker compose config -q` 验证 YAML 语法与参数合法性，校验无误方可部署。
- **增量重启服务**：使用 `docker compose up -d --no-deps <service>` 仅重启变更的服务，减少无关服务波动。
- **查看集群日志**：`docker compose logs --tail 50 -f <service>` 跟踪部署后的实时日志。

## 4. 资源监控与清理
- **实时资源利用率**：执行 `docker stats --no-stream` 检查各容器 CPU、内存、网络 I/O。
- **安全清理废弃资源**：清理仅限虚悬资源，避免误删正在挂载的卷；使用 `docker image prune -f` 清理 `<none>` 镜像。
