# ---- 构建阶段 ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 是原生模块，需 Python + make + g++ 源码编译
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 启用 pnpm corepack
RUN corepack enable

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建 Nuxt/Nitro 产物到 .output/
COPY . .
RUN pnpm build

# 移除非生产依赖（devDependencies），只给运行阶段保留最小 node_modules。
# --ignore-scripts：prune 会重跑根项目 postinstall(nuxt prepare) 导致失败，故跳过脚本。
# 不影响 native 模块——better-sqlite3 的二进制已在构建阶段编译完成，直接复用。
RUN pnpm prune --prod --ignore-scripts

# ---- 运行阶段 ----
# 原生模块（better-sqlite3）无法被 Nitro 打包，直接复用构建阶段已编译好的 node_modules，
# 避免在运行镜像重复编译并省去编译工具链
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 启用 pnpm，用于在运行阶段建立依赖软链目录结构（.output 内 require 依赖解析走 node_modules）
RUN corepack enable

# 拷贝构建阶段安装并编译好的依赖（含 better-sqlite3 原生二进制）
COPY --from=builder /app/node_modules ./node_modules

# 拷贝 Nuxt/Nitro 构建产物
COPY --from=builder /app/.output ./.output

# 非 root 运行
USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]