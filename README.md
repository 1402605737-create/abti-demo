# ABTI Demo

一个适合正式公网产品的 `Vite + React + Express` 项目：

- 前端负责展示与交互
- 后端负责保存模型密钥、组装 Prompt、调用兼容 OpenAI Chat Completions 的模型接口
- 正式版不再把 `API Key` 暴露给浏览器
- 生产环境支持打成单个 Docker 容器，直接部署到腾讯云云托管

## 项目结构

```text
src/                  前端页面与状态管理
server/               Express 后端与 Prompt 组装
.github/workflows/    GitHub Actions 校验工作流
Dockerfile            腾讯云云托管容器构建文件
.dockerignore         容器构建忽略规则
.env.example          本地与云托管环境变量模板
```

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

```bash
cp .env.example .env
```

3. 配置 `.env`

```env
VITE_API_BASE_URL=
PORT=3000
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-real-key
OPENAI_MODEL=gpt-4.1-mini
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
```

4. 分别启动后端和前端

```bash
npm run server:dev
```

```bash
npm run dev
```

本地开发时，前端默认通过 `Vite proxy` 把 `/api/*` 转发到 `http://localhost:3000`。

## 腾讯云云托管部署

### 部署形态

生产环境使用单容器部署：

- `Dockerfile` 在构建阶段执行 `npm ci + npm run build`
- 运行阶段只保留生产依赖、`server/` 和 `dist/`
- Express 同时提供：
  - 前端页面 `/`
  - 后端接口 `/api/*`
- 这样在腾讯云云托管里只需要一个服务、一个域名

### 云托管控制台配置

在腾讯云云托管里创建服务时，推荐这样填：

- 部署方式：从代码仓库构建，或先本地构建镜像再推镜像仓库
- 构建文件：`Dockerfile`
- 服务端口：`3000`
- 健康检查路径：`/api/health`
- CPU / 内存：先用最小可用规格测试
- 自动扩缩容：先保守配置，确认费用后再打开

### 运行时环境变量

在云托管控制台里配置这些环境变量：

```env
PORT=3000
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=你的真实密钥
OPENAI_MODEL=gpt-4.1-mini
CORS_ORIGIN=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
```

说明：

- `PORT` 保持 `3000`
- `OPENAI_API_KEY` 只放在云托管环境变量，不提交到 GitHub
- `CORS_ORIGIN` 如果前后端由同一个云托管服务同域提供，可以留空
- `VITE_API_BASE_URL` 在云托管单容器模式下保持空字符串即可，因为前端会直接请求同域 `/api`

### 自定义域名

部署成功后：

- 先用云托管分配的默认访问地址验证功能
- 再绑定你自己的域名
- 开启 HTTPS

如果你只部署一个服务，那么建议直接绑定一个主域名，例如：

- `https://abti.your-domain.com`

这时：

- 前端页面访问 `https://abti.your-domain.com/`
- 前端发起接口请求到 `https://abti.your-domain.com/api/*`

## Docker 本地验证

如果你本机安装了 Docker，可以先本地验证：

```bash
docker build -t abti-demo .
docker run --rm -p 3000:3000 \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  -e OPENAI_API_KEY=你的真实密钥 \
  -e OPENAI_MODEL=gpt-4.1-mini \
  abti-demo
```

然后打开：

- `http://localhost:3000`
- `http://localhost:3000/api/health`

## GitHub 校验

仓库里提供了一个 Docker 构建校验工作流：

- [docker-build.yml](file:///f:/一下/3%20AI%20Product%20Manger/workspace/5月/5.15/3ABTI/.github/workflows/docker-build.yml)

每次推送到 `main` 或发起 PR 时，GitHub Actions 都会执行一次 `docker build`，提前发现容器构建问题。

## 常用命令

```bash
npm run dev
npm run server:dev
npm run build
npm run test
npm start
```

## 参考

- 腾讯云 CloudBase Framework 说明中提到支持 Node 应用和容器/云托管形态：[cloudbase-framework README](https://github.com/MicroChipTecnology/cloudbase-framework/blob/master/README.md)
- 腾讯云 CloudBase AI ToolKit 文档说明支持将全栈 Web 应用部署到 CloudBase 平台：[CloudBase-MCP README](https://github.com/TencentCloudBase/CloudBase-MCP/blob/1cdf06de106f4ee4ccb16a4e686d7c2158a57e7d/README.md)
