# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 启动与使用

本工具是一个本地 MySQL 管理应用（Nuxt 4），无需后端服务即可在浏览器中管理 MySQL 数据库。

```bash
# 首次安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:3000）
pnpm dev
```

启动后访问本机地址，首次运行时需先设置主密码（用于解锁应用）。

功能概览：

- **连接管理**：新增、编辑、删除多个 MySQL 连接配置，支持密码加密保存。
- **对象浏览**：浏览当前连接下的数据库、表及其字段结构。
- **数据行增删改**：在数据网格中对表数据做行级的新增、修改、删除。
- **SQL 控制台**：执行任意 SQL 并查看查询结果。

> 提示：需先在首页新增并切换到当前 MySQL 连接后，才能浏览与编辑该连接下的数据。

数据存储：应用自身的元数据（主密码哈希、加密的 MySQL 连接配置）保存于运行时生成的 `.data/workbench.db`（SQLite，已加入 `.gitignore`，不提交到仓库）。MySQL 连接密码使用随机盐 AES-256-GCM 加密，主密码使用 PBKDF2 哈希校验，明文密码仅驻留服务端内存。
