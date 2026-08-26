# ---- 构建阶段 ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# 启用 pnpm corepack
RUN corepack enable

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建 Nuxt/Nitro 产物到 .output/
COPY . .
RUN pnpm build

# ---- 运行阶段 ----
# 原生模块（better-sqlite3）无法被 Nitro 打包，需在运行环境安装生产依赖供其解析
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 启用 pnpm
RUN corepack enable

# 装生产依赖（供 .output 内外部化的 better-sqlite3 等解析），利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 拷贝 Nuxt/Nitro 构建产物
COPY --from=builder /app/.output ./.output

# 非 root 运行
USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]