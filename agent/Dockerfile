# 多阶段构建
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的包
RUN apk add --no-cache git ca-certificates tzdata

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o k6-agent .

# 运行阶段
FROM alpine:latest

# 安装k6和其他必要工具
RUN apk add --no-cache ca-certificates tzdata curl && \
    # 安装k6
    curl -L https://github.com/grafana/k6/releases/latest/download/k6-linux-amd64.tar.gz | tar xz && \
    mv k6-*/k6 /usr/local/bin/ && \
    rm -rf k6-* && \
    # 创建非root用户
    addgroup -g 1000 k6agent && \
    adduser -D -s /bin/sh -u 1000 -G k6agent k6agent

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/k6-agent .
COPY --from=builder /app/config.yaml .

# 创建必要的目录
RUN mkdir -p /app/logs /app/temp && \
    chown -R k6agent:k6agent /app

# 切换到非root用户
USER k6agent

# 暴露端口
EXPOSE 8080 9090

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动命令
CMD ["./k6-agent"]