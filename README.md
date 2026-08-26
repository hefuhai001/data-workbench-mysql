# Data Workbench MySQL

一款基于 **Nuxt 4** 构建的本地单机 MySQL 管理工具，提供 Web 图形界面进行数据库日常管理操作。

## 功能特性

- **主密码保护** — 首次使用需设置主密码，MySQL 连接密码经 **PBKDF2 + AES-256-GCM** 加密存储，仅进程内存中持有明文密钥
- **多连接管理** — 支持增删改查多个 MySQL 连接，可测试连通性，密码安全加密
- **数据库/表浏览** — 树形结构展示数据库及表，过滤系统库，一键切换数据库
- **行数据 CRUD** — 分页浏览表数据，支持 WHERE 条件过滤、新增行、编辑行、删除行，自动识别主键
- **SQL 控制台** — 自由执行任意 SQL 语句，查询结果以表格展示，支持 DDL/DML
- **响应式布局** — 基于 Tailwind CSS v4，桌面/移动端均可使用
- **Docker 部署** — 提供多阶段构建 Dockerfile，支持容器化运行

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Nuxt 4 + Nitro |
| 前端 | Vue 3 + Tailwind CSS v4 |
| 后端 | Nitro 服务端（REST API） |
| 数据库 | better-sqlite3（元数据存储） |
| MySQL | mysql2（动态连接池） |
| 加密 | node:crypto（PBKDF2 + AES-256-GCM） |
| 语言 | TypeScript |

## 快速开始

### 前提条件

- Node.js >= 22
- pnpm >= 11（推荐使用 corepack 启用）

```bash
corepack enable
```

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

默认访问 http://localhost:3000

### 首次使用

1. 打开浏览器访问应用
2. 首次运行会进入 **设置主密码** 页面，设置主密码（至少 6 位）
3. 进入主界面后，在"连接"面板新增 MySQL 连接
4. 切换连接后，可在"对象/数据"面板浏览数据库和表，或在"SQL"面板执行查询

## 安全设计

- 主密码通过 **PBKDF2（100,000 次迭代，随机盐）** 哈希后存储于本地 SQLite
- MySQL 连接密码使用主密码派生的 **AES-256-GCM** 密钥加密存储
- 解密密钥仅在 Nitro 进程内存中保留，不落盘
- 前端 API 每次请求均需校验解锁状态，未解锁返回 401

## Docker 部署

```bash
# 构建镜像
docker compose build

# 启动
docker compose up -d

# 查看日志
docker compose logs -f
```

服务默认监听 `0.0.0.0:3000`，SQLite 数据持久化在 `./.data/` 目录。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |
| `HOST` | `0.0.0.0` | 监听地址 |

## 项目结构

```
├── app/                        # 前端应用
│   ├── app.vue                 # 根组件
│   ├── assets/css/main.css     # Tailwind 入口
│   ├── pages/
│   │   ├── index.vue           # 主界面（连接/对象/SQL 三栏）
│   │   └── unlock.vue          # 解锁/设置主密码页
│   ├── components/
│   │   ├── ConnectionPanel.vue # 连接管理面板
│   │   ├── ObjectBrowser.vue   # 数据库/表树形浏览器
│   │   ├── DataGrid.vue        # 行数据表格（CRUD）
│   │   ├── SqlConsole.vue      # SQL 控制台
│   │   ├── UiModal.vue         # 通用弹窗
│   │   ├── UiButton.vue        # 通用按钮
│   │   └── UiInput.vue         # 通用输入框
│   └── composables/useApi.ts   # 统一 API 封装
├── server/                     # 服务端
│   ├── api/                    # REST API 路由
│   │   ├── init-master.post.ts # 初始化主密码
│   │   ├── unlock.post.ts      # 解锁
│   │   ├── unlock.put.ts       # 修改主密码
│   │   ├── me.get.ts           # 查询解锁状态
│   │   ├── connections.get.ts  # 连接列表
│   │   ├── connections.post.ts # 新增连接
│   │   ├── connections/[id].put.ts
│   │   ├── connections/[id].delete.ts
│   │   ├── connections/[id]/test.post.ts  # 测试连接
│   │   ├── connections/[id]/switch.post.ts # 切换当前连接
│   │   ├── databases.get.ts    # 数据库列表
│   │   ├── databases/[db]/tables.get.ts   # 表列表
│   │   ├── databases/[db]/switch.post.ts  # 切换数据库
│   │   ├── table-schema.get.ts # 表结构（含主键）
│   │   ├── tables.post.ts      # 删除/清空表
│   │   ├── rows.get.ts         # 查行（分页）
│   │   ├── rows.post.ts        # 新增行
│   │   ├── rows.put.ts         # 更新行
│   │   ├── rows.delete.ts      # 删除行
│   │   └── query.post.ts       # SQL 控制台执行
│   └── utils/
│       ├── crypto.ts           # PBKDF2 + AES-256-GCM
│       ├── db.ts               # SQLite 初始化
│       ├── mysql.ts            # MySQL 连接封装
│       ├── connect.ts          # 连接解析与生命周期管理
│       ├── session.ts          # 进程内存会话
│       └── escape.ts           # 标识符转义
├── Dockerfile                  # Docker 多阶段构建
├── docker-compose.yml          # Docker Compose 配置
├── nuxt.config.ts              # Nuxt 配置
└── package.json                # 依赖管理
```

## API 概览

所有 API 均需解锁状态（除 `GET /api/me`、`POST /api/init-master`、`POST /api/unlock`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/me` | 查询解锁与初始化状态 |
| POST | `/api/init-master` | 初始化主密码 |
| POST | `/api/unlock` | 解锁 |
| PUT | `/api/unlock` | 修改主密码 |
| GET | `/api/connections` | 连接列表 |
| POST | `/api/connections` | 新增连接 |
| PUT | `/api/connections/:id` | 编辑连接 |
| DELETE | `/api/connections/:id` | 删除连接 |
| POST | `/api/connections/:id/test` | 测试连接 |
| POST | `/api/connections/:id/switch` | 切换当前连接 |
| GET | `/api/databases` | 数据库列表 |
| GET | `/api/databases/:db/tables` | 表列表 |
| POST | `/api/databases/:db/switch` | 切换数据库 |
| GET | `/api/table-schema` | 表结构（含主键） |
| POST | `/api/tables` | 删除/清空表 |
| POST | `/api/rows` | 查询行（分页） |
| POST | `/api/rows` | 新增行 |
| PUT | `/api/rows` | 更新行 |
| DELETE | `/api/rows` | 删除行 |
| POST | `/api/query` | 执行 SQL |

## 开发

```bash
# 启动开发服务器（热重载）
pnpm dev

# 类型检查
npx nuxi typecheck

# 构建
pnpm build
```