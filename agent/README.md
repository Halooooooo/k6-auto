# K6 Agent - 分布式性能测试执行器

K6 Agent是一个用Go语言开发的分布式k6脚本执行器，支持多节点部署、实时日志传输和结果回传。Agent采用通用任务执行器设计，不仅支持k6脚本执行，还可以执行shell、python、docker等多种类型的任务。

## 功能特性

### 核心功能
- 🚀 **分布式执行**: 支持多节点部署，实现负载分散
- 📡 **实时通信**: HTTP RESTful API + WebSocket与后端交互
- 📊 **实时监控**: WebSocket实时日志传输
- 🔄 **自动注册**: Agent启动时自动向后端注册
- 💓 **心跳机制**: 定期发送心跳保持连接
- 📋 **任务轮询**: 主动拉取待执行任务
- 📈 **状态上报**: 实时上报任务执行状态和进度
- 🔧 **通用执行器**: 支持k6、shell、python、docker等多种任务类型
- 🏷️ **标签管理**: 支持Agent标签，实现灵活的任务调度
- 🐳 **容器化**: 支持Docker和Kubernetes部署
- 📈 **监控指标**: 内置Prometheus指标收集

### Agent与后端交互机制

#### 核心交互模式：HTTP RESTful API
- **Agent注册**: `POST /api/v1/agents/register` - Agent启动时注册自身信息
- **心跳维持**: 定期发送心跳保持在线状态
- **任务轮询**: `GET /api/v1/agents/jobs/poll` - 主动拉取待执行任务
- **状态上报**: `POST /api/v1/agents/jobs/status` - 实时上报任务执行状态
- **结果回传**: `POST /api/v1/agents/jobs/result` - 任务完成后回传结果
- **健康检查**: `GET /api/v1/agents/health` - 后端主动探测Agent健康状态

#### 可选增强模式：WebSocket
- 用于实时日志流式传输，实现低延迟的日志查看
- 支持双向通信，可接收后端的实时指令

### 执行流程
1. **Agent启动**: 读取配置，向后端注册，开始心跳和任务轮询
2. **接收任务**: 通过轮询获取待执行任务（k6/shell/python/docker等）
3. **任务执行**: 根据任务类型调用相应的执行器
4. **状态上报**: 实时上报任务执行状态和进度
5. **日志收集**: 实时收集并传输执行日志
6. **结果处理**: 解析执行结果并生成报告
7. **结果回传**: 将最终结果回传至后端
8. **清理工作**: 清理临时文件和资源

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
go mod download

# 2. 安装k6
# macOS
brew install k6
# Linux
sudo apt-get install k6
# Windows
choco install k6

# 3. 运行Agent
go run .
```

### Docker部署

```bash
# 1. 构建镜像
docker build -t k6-agent .

# 2. 运行单个实例
docker run -d \
  --name k6-agent \
  -p 8080:8080 \
  -p 9090:9090 \
  -e BACKEND_URL=http://host.docker.internal:3001 \
  k6-agent

# 3. 使用Docker Compose
docker-compose up -d

# 4. 多实例 + 负载均衡
docker-compose --profile multi-agent --profile load-balancer up -d
```

### Kubernetes部署

```bash
# 1. 创建命名空间
kubectl create namespace k6-system

# 2. 部署Agent
kubectl apply -f k8s-deployment.yaml

# 3. 检查状态
kubectl get pods -n k6-system
kubectl get svc -n k8s-system
```

## API接口

### 健康检查
```http
GET /health
```

### Agent信息
```http
GET /info
```

### 执行脚本
```http
POST /execute
Content-Type: application/json

{
  "scriptId": "script-123",
  "scriptContent": "import http from 'k6/http';...",
  "parameters": {
    "BASE_URL": "https://api.example.com",
    "API_KEY": "your-api-key"
  },
  "options": {
    "vus": 10,
    "duration": "30s",
    "iterations": 100
  },
  "callbackUrl": "http://backend:3001/api/tasks/callback"
}
```

### 查询任务状态
```http
GET /status/{taskId}
```

### 停止任务
```http
POST /stop/{taskId}
```

### 实时日志（WebSocket）
```javascript
const ws = new WebSocket('ws://agent:8080/ws/{taskId}');
ws.onmessage = (event) => {
  console.log('Log:', event.data);
};
```

## 配置说明

### 完整配置文件 (config.yaml)

```yaml
# 服务器配置
server:
  host: "0.0.0.0"
  port: 8080
  read_timeout: 30s
  write_timeout: 30s
  idle_timeout: 60s

# 后端API配置
backend:
  url: "http://localhost:3001"
  timeout: 30s
  retry_count: 3
  retry_delay: 5s

# Agent配置
agent:
  registration_token: "your-secret-token"  # 注册令牌
  heartbeat_interval: 30s                   # 心跳间隔
  poll_interval: 5s                         # 任务轮询间隔
  tags:                                     # Agent标签
    env: "production"
    region: "us-west"
    type: "high-performance"

# K6配置
k6:
  binary: "k6"                    # k6可执行文件路径
  output_dir: "./output"          # 输出目录
  script_dir: "./scripts"         # 脚本目录
  max_execution_time: "1h"        # 最大执行时间
  default_options:
    vus: 1
    duration: "10s"

# 日志配置
log:
  level: "info"                   # 日志级别: debug, info, warn, error
  format: "json"                  # 日志格式: json, text
  output: "stdout"                # 输出: stdout, file
  file: "./logs/agent.log"        # 日志文件路径
  max_size: 100                   # 最大文件大小(MB)
  max_backups: 5                  # 最大备份数
  max_age: 30                     # 最大保存天数

# 资源限制
resources:
  max_concurrent_tasks: 5         # 最大并发任务数
  max_memory_mb: 2048            # 最大内存使用(MB)
  max_cpu_percent: 80            # 最大CPU使用率(%)
  temp_dir: "./temp"             # 临时目录
  cleanup_interval: "1h"         # 清理间隔

# 安全配置
security:
  enable_auth: false             # 是否启用认证
  api_key: ""                    # API密钥
  allowed_ips: []                # 允许的IP列表
  rate_limit:
    requests_per_minute: 60      # 每分钟请求限制
    burst: 10                    # 突发请求数

# 监控配置
monitoring:
  enable_metrics: true           # 启用指标收集
  metrics_port: 9090            # 指标端口
  metrics_path: "/metrics"       # 指标路径
  enable_pprof: false           # 启用性能分析
  pprof_port: 6060              # 性能分析端口
```

### 环境变量配置

支持通过环境变量覆盖配置文件中的设置：

```bash
# 基础配置
export SERVER_HOST=0.0.0.0
export SERVER_PORT=8080
export BACKEND_URL=http://backend:3001

# Agent配置
export AGENT_REGISTRATION_TOKEN=your-secret-token
export AGENT_HEARTBEAT_INTERVAL=30s
export AGENT_POLL_INTERVAL=5s
export AGENT_TAGS_ENV=production
export AGENT_TAGS_REGION=us-west
export AGENT_TAGS_TYPE=high-performance

# K6配置
export K6_BINARY=/usr/local/bin/k6
export K6_OUTPUT_DIR=/app/output
export K6_MAX_EXECUTION_TIME=1h

# 日志配置
export LOG_LEVEL=info
export LOG_FORMAT=json

# 资源限制
export RESOURCES_MAX_CONCURRENT_TASKS=5
export RESOURCES_MAX_MEMORY_MB=2048
export RESOURCES_MAX_CPU_PERCENT=80
```

### Agent管理

#### 添加Agent

1. **静态配置方式**：
   - 在后端配置文件中预先定义Agent列表
   - Agent使用预配置的ID和Token注册

2. **动态注册方式**（推荐）：
   - 管理员在后端生成注册令牌(registration_token)
   - 新Agent配置令牌后自动注册
   - 后端验证令牌并分配唯一Agent ID

#### Agent标签

通过标签实现灵活的任务调度：

```yaml
agent:
  tags:
    env: production      # 环境标签
    region: us-west     # 地域标签
    type: high-mem      # 类型标签
    team: backend       # 团队标签
```

任务创建时可指定标签选择器：
```json
{
  "job": {
    "type": "k6",
    "script_content": "...",
    "agent_selector": {
      "env": "production",
      "region": "us-west"
    }
  }
}
```

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SERVER_HOST` | `0.0.0.0` | 服务器监听地址 |
| `SERVER_PORT` | `8080` | 服务器端口 |
| `BACKEND_URL` | `http://localhost:3001` | 后端API地址 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `K6_BINARY` | `k6` | k6可执行文件路径 |

### 配置文件

参考 `config.yaml` 文件进行详细配置：

```yaml
server:
  host: "0.0.0.0"
  port: 8080

backend:
  url: "http://localhost:3001"
  timeout: 30s

k6:
  binary: "k6"
  max_concurrent_tasks: 10
  default_timeout: "30m"

log:
  level: "info"
  format: "json"
```

## 架构设计

### 组件结构

```
Agent
├── main.go           # 程序入口
├── agent.go          # 核心Agent逻辑
├── executor.go       # k6执行器
├── config.yaml       # 配置文件
├── Dockerfile        # 容器镜像
├── docker-compose.yml # 容器编排
└── k8s-deployment.yaml # K8s部署
```

### 数据流

```
后端API → Agent → k6执行 → 结果收集 → 回调后端
    ↓         ↓         ↓         ↓
  指令下发   脚本准备   实时日志   结果解析
```

### 通信协议

- **HTTP API**: RESTful接口，用于任务管理
- **WebSocket**: 实时日志传输
- **回调机制**: 执行完成后主动通知后端

## 监控和运维

### 健康检查

Agent提供多层次的健康检查：

```bash
# HTTP健康检查
curl http://agent:8080/health

# Docker健康检查
docker ps --filter "health=healthy"

# Kubernetes健康检查
kubectl get pods -n k6-system
```

### 监控指标

Agent暴露Prometheus指标：

```bash
# 访问指标端点
curl http://agent:9090/metrics
```

主要指标：
- `agent_tasks_total`: 总任务数
- `agent_tasks_running`: 运行中任务数
- `agent_tasks_completed`: 完成任务数
- `agent_tasks_failed`: 失败任务数
- `agent_memory_usage`: 内存使用量
- `agent_cpu_usage`: CPU使用率

### 日志管理

```bash
# Docker日志
docker logs k6-agent

# Kubernetes日志
kubectl logs -f deployment/k6-agent -n k6-system

# 日志级别调整
export LOG_LEVEL=debug
```

## 性能优化

### 资源配置

```yaml
# Docker资源限制
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
    reservations:
      memory: 512M
      cpus: '0.5'

# Kubernetes资源配置
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### 并发控制

```yaml
k6:
  max_concurrent_tasks: 10  # 最大并发任务数
  default_timeout: "30m"    # 默认超时时间
```

### 自动扩缩容

```yaml
# HPA配置
minReplicas: 2
maxReplicas: 10
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
```

## 故障排除

### 常见问题

1. **k6命令未找到**
   ```bash
   # 检查k6安装
   which k6
   k6 version
   ```

2. **连接后端失败**
   ```bash
   # 检查网络连通性
   curl http://backend:3001/health
   ```

3. **任务执行失败**
   ```bash
   # 查看详细日志
   curl http://agent:8080/status/{taskId}
   ```

4. **WebSocket连接失败**
   ```bash
   # 检查防火墙和代理设置
   curl -H "Upgrade: websocket" http://agent:8080/ws/{taskId}
   ```

### 调试模式

```bash
# 启用调试日志
export LOG_LEVEL=debug

# 查看详细执行过程
curl http://agent:8080/status/{taskId}
```

## 安全考虑

### 网络安全
- 使用内部网络通信
- 配置防火墙规则
- 启用TLS加密（生产环境）

### 容器安全
- 非root用户运行
- 只读根文件系统
- 最小权限原则

### 资源隔离
- 内存和CPU限制
- 临时文件清理
- 网络策略控制

## 开发指南

### 项目结构

```
agent/
├── main.go              # 程序入口和服务器设置
├── agent.go             # Agent核心逻辑和API处理
├── executor.go          # k6脚本执行器
├── config.yaml          # 配置文件模板
├── go.mod              # Go模块依赖
├── Dockerfile          # 容器镜像构建
├── docker-compose.yml  # 本地开发环境
├── k8s-deployment.yaml # Kubernetes部署配置
├── nginx.conf          # 负载均衡配置
└── README.md           # 项目文档
```

### 扩展开发

1. **添加新的执行器**
   - 实现 `Executor` 接口
   - 注册到 `ExecutorRegistry`

2. **自定义监控指标**
   - 使用 Prometheus Go客户端
   - 在 `/metrics` 端点暴露

3. **增强安全性**
   - 实现认证中间件
   - 添加API密钥验证

## 版本历史

- **v1.0.0**: 初始版本，基本功能实现
  - HTTP API接口
  - k6脚本执行
  - WebSocket实时日志
  - Docker容器化
  - Kubernetes部署支持

## 许可证

MIT License

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 联系方式

- 项目地址: https://github.com/your-org/k6-auto
- 问题反馈: https://github.com/your-org/k6-auto/issues
- 文档地址: https://docs.k6-auto.com