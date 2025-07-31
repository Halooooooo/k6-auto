# K6 自动化压测平台

一个集成化、自动化、智能化的k6性能测试管理平台，提供脚本管理、任务调度、结果可视化和智能对话功能。

## 功能特性

- 📝 **脚本管理**: 在线编辑、上传、版本控制k6脚本
- ⏰ **任务调度**: 支持手动触发和定时触发
- 🤖 **智能Agent**: 分布式执行节点，支持多环境部署
- 📊 **结果可视化**: 嵌入k6 HTML报告和自定义图表
- 💬 **智能对话**: 通过自然语言触发和管理压测任务
- 🔒 **安全可靠**: 用户认证、权限控制、环境隔离

## 技术架构

### 前端
- React + TypeScript + Vite
- Monaco Editor (代码编辑器)
- ECharts (数据可视化)
- WebSocket (实时通信)

### 后端
- Node.js + NestJS
- PostgreSQL (主数据库)
- Redis (缓存/队列)
- MinIO (对象存储)

### Agent
- Go语言实现
- Docker容器化部署
- gRPC通信协议

### AI服务
- 阿里云通义千问 API
- 自然语言理解和对话管理

## 项目结构

```
k6-auto/
├── frontend/          # React前端应用
├── backend/           # NestJS后端服务
├── agent/             # Go Agent执行器
├── docker/            # Docker配置文件
├── docs/              # 项目文档
└── scripts/           # 部署和工具脚本
```

## 快速开始

### 环境要求
- Node.js 18+
- Go 1.19+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd k6-auto
```

2. 启动后端服务
```bash
cd backend
npm install
npm run start:dev
```

3. 启动前端应用
```bash
cd frontend
npm install
npm run dev
```

4. 构建和部署Agent
```bash
cd agent
go build -o k6-agent
./k6-agent
```

5. 使用Docker Compose一键启动
```bash
docker-compose up -d
```

## 使用指南

### 脚本管理
1. 登录平台后，进入"脚本管理"页面
2. 点击"新建脚本"或"上传脚本"
3. 使用内置编辑器编写k6脚本
4. 保存并添加标签和描述

### 创建压测任务
1. 进入"任务管理"页面
2. 选择要执行的脚本
3. 配置VU数、持续时间等参数
4. 选择触发方式（立即执行或定时执行）

### 查看测试结果
1. 在"任务列表"中查看执行状态
2. 点击"查看报告"查看详细结果
3. 支持历史结果对比和趋势分析

### 智能对话
1. 点击右下角的对话图标
2. 使用自然语言描述需求，如：
   - "用登录脚本运行100个VU的压测"
   - "查看最近的测试结果"
   - "每天上午10点定时执行API测试"

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License