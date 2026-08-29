#!/bin/sh
set -e

# 数据目录（SQLite 库）：容器以 root 启动，无条件确保 /app/.data 存在且属主为 node(uid 1000)。
# 无论 bind 挂载 / named volume / 历史遗留的 root 属主卷，都在启动时修正权限，
# 再降权到 node 用户运行应用，彻底规避"目录存在但无写权限"导致的 SQLITE_CANTOPEN。
mkdir -p /app/.data
chown -R node:node /app/.data

# 降权到 node 用户并执行传入命令（正常启动应用，或 healthcheck 的 node -e 探测）
exec su-exec node "$@"
