# ---- 构建阶段 ----
FROM node:22-alpine AS builder
WORKDIR /app

# 启用 pnpm（corepack 按 package.json 的 packageManager 自动匹配版本）
RUN corepack enable

# 先复制依赖清单，利用 Docker 层缓存；再挂载 pnpm store 缓存，
# 锁文件不变时依赖层直接命中，锁文件微变时也只需增量下载
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 复制源码并构建 Nuxt/Nitro 产物到 .output/
COPY . .
RUN pnpm build

# 移除非生产依赖（devDependencies），只给运行阶段保留最小 node_modules。
# --ignore-scripts：prune 会重跑根项目 postinstall(nuxt prepare) 导致失败，故跳过脚本。
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm prune --prod --ignore-scripts

# ---- 运行阶段 ----
# 避免在运行镜像重复编译并省去编译工具链
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 拷贝 Nuxt/Nitro 构建产物
COPY --from=builder /app/.output ./.output

# 非 root 运行
USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
