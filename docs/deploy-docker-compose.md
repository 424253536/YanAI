# Docker Compose 正式服务器部署指南

这份指南面向 fork 后发布自己的镜像，并在正式服务器上通过 Docker Compose 部署的场景。服务器不需要 clone 源码，只需要 compose、`.env`、`config.json` 和持久化目录。

## 1. 先发布你自己的镜像

推荐使用仓库内置的 GitHub Actions：

1. 在你的 fork 仓库打开 `Actions`。
2. 手动运行 `Publish Docker Image`，或推送 `v*` 标签，例如 `v1.0.0`。
3. 镜像会发布到 `ghcr.io/<owner>/yanai:<tag>`，其中 `<owner>` 是你的 GitHub 用户名或组织名。

也可以在开发机手动构建并推送：

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/<owner>/yanai:latest --push .
```

不要把 `.env`、`config.json`、`data/`、数据库文件或真实密钥打进镜像；这些都应该留在服务器运行目录中。

## 2. 服务器准备运行目录

```bash
mkdir -p /opt/yanai/data
cd /opt/yanai
```

把以下文件复制到 `/opt/yanai`：

- `docker-compose.yml`
- `.env.example`，复制后改名为 `.env`
- `config.example.json`，复制后改名为 `config.json`
- 可选：`docker-compose.postgres.yml`，仅使用内置 PostgreSQL 时需要

你可以从 GitHub raw 地址下载，也可以从开发机 `scp` 上传。重点是服务器目录中不需要完整源码。

```bash
cp .env.example .env
cp config.example.json config.json
```

`config.json` 需要保持可写，因为后台管理页保存系统设置时会写回该文件；`data/` 用来保存 SQLite 数据库、图片和其他运行时数据。

## 3. SQLite 单机部署

适合轻量、单实例、低并发部署。编辑 `.env`：

```dotenv
YANAI_IMAGE=ghcr.io/<owner>/yanai:latest
YANAI_PORT=3000
TZ=Asia/Shanghai
CHATGPT2API_AUTH_KEY=change_me_to_a_long_random_secret

STORAGE_BACKEND=sqlite
DATABASE_URL=
```

`DATABASE_URL` 留空时程序会自动使用容器内 `/app/data/accounts.db`，该路径通过 `./data:/app/data` 挂载到宿主机，所以容器重建不会丢库。

启动：

```bash
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3000/health
```

## 4. 使用内置 PostgreSQL 部署

适合希望数据库也由 Docker Compose 管理的生产部署。编辑 `.env`：

```dotenv
YANAI_IMAGE=ghcr.io/<owner>/yanai:latest
YANAI_PORT=3000
TZ=Asia/Shanghai
CHATGPT2API_AUTH_KEY=change_me_to_a_long_random_secret

STORAGE_BACKEND=postgres
POSTGRES_DB=yanai
POSTGRES_USER=yanai
POSTGRES_PASSWORD=change_me_to_a_long_random_password
DATABASE_URL=
```

启动：

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
docker compose -f docker-compose.yml -f docker-compose.postgres.yml ps
curl -fsS http://127.0.0.1:3000/health
```

当 `DATABASE_URL` 留空时，`docker-compose.postgres.yml` 会自动拼出容器内连接串：

```text
postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>
```

数据库数据保存在 Docker volume `yanai_postgres_data` 中。

## 5. 使用外部 PostgreSQL 部署

如果你使用云数据库、Supabase 或已有 PostgreSQL，只用基础 `docker-compose.yml` 即可。编辑 `.env`：

```dotenv
YANAI_IMAGE=ghcr.io/<owner>/yanai:latest
YANAI_PORT=3000
CHATGPT2API_AUTH_KEY=change_me_to_a_long_random_secret

STORAGE_BACKEND=postgres
DATABASE_URL=postgresql://user:password@host:5432/yanai
```

启动：

```bash
docker compose up -d
```

如果目标数据库不存在，应用启动时会尝试通过 `postgres` 或 `template1` 维护库创建；如果数据库账号没有建库权限，请先在数据库侧创建空库。

## 6. 更新版本

在开发机或 CI 发布新镜像后，服务器只需要拉取镜像并重建容器：

```bash
cd /opt/yanai
docker compose pull
docker compose up -d
```

使用内置 PostgreSQL 时保持同样的 compose 文件组合：

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml pull
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
```

## 7. 备份建议

- SQLite：备份 `/opt/yanai/data/accounts.db`、`/opt/yanai/data/images/` 和 `config.json`。
- 内置 PostgreSQL：使用 `pg_dump` 或备份 Docker volume，同时备份 `data/images/` 和 `config.json`。
- 外部 PostgreSQL：按数据库服务商建议做数据库备份，同时备份 `data/images/` 和 `config.json`。

迁移旧 JSON 数据到 SQLite/PostgreSQL 前，请先阅读 README 的“迁移前保护和审计”章节，先停写、备份、预演，再执行迁移。
