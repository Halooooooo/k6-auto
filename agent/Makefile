# K6 Agent Makefile

# 变量定义
APP_NAME := k6-agent
VERSION := 1.0.0
GIT_COMMIT := $(shell git rev-parse --short HEAD)
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
GO_VERSION := $(shell go version | awk '{print $$3}')

# Docker相关
DOCKER_IMAGE := $(APP_NAME):$(VERSION)
DOCKER_LATEST := $(APP_NAME):latest
REGISTRY := your-registry.com

# 构建标志
LDFLAGS := -ldflags "-X main.Version=$(VERSION) -X main.GitCommit=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME) -X main.GoVersion=$(GO_VERSION)"

# 默认目标
.PHONY: all
all: clean build

# 帮助信息
.PHONY: help
help:
	@echo "K6 Agent 构建工具"
	@echo ""
	@echo "可用命令:"
	@echo "  build          构建二进制文件"
	@echo "  build-linux    构建Linux二进制文件"
	@echo "  build-windows  构建Windows二进制文件"
	@echo "  build-darwin   构建macOS二进制文件"
	@echo "  test           运行测试"
	@echo "  test-coverage  运行测试并生成覆盖率报告"
	@echo "  lint           代码检查"
	@echo "  fmt            格式化代码"
	@echo "  clean          清理构建文件"
	@echo "  run            运行应用"
	@echo "  docker-build   构建Docker镜像"
	@echo "  docker-run     运行Docker容器"
	@echo "  docker-push    推送Docker镜像"
	@echo "  k8s-deploy     部署到Kubernetes"
	@echo "  k8s-delete     从Kubernetes删除"
	@echo "  compose-up     启动Docker Compose"
	@echo "  compose-down   停止Docker Compose"
	@echo "  deps           安装依赖"
	@echo "  mod-tidy       整理Go模块"
	@echo "  install        安装到系统"

# 依赖管理
.PHONY: deps
deps:
	@echo "安装依赖..."
	go mod download
	go mod verify

.PHONY: mod-tidy
mod-tidy:
	@echo "整理Go模块..."
	go mod tidy

# 代码质量
.PHONY: fmt
fmt:
	@echo "格式化代码..."
	go fmt ./...
	goimports -w .

.PHONY: lint
lint:
	@echo "代码检查..."
	golangci-lint run

.PHONY: vet
vet:
	@echo "代码审查..."
	go vet ./...

# 测试
.PHONY: test
test:
	@echo "运行测试..."
	go test -v ./...

.PHONY: test-coverage
test-coverage:
	@echo "运行测试并生成覆盖率报告..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "覆盖率报告已生成: coverage.html"

.PHONY: test-race
test-race:
	@echo "运行竞态检测测试..."
	go test -race -v ./...

# 构建
.PHONY: build
build:
	@echo "构建 $(APP_NAME)..."
	go build $(LDFLAGS) -o bin/$(APP_NAME) .

.PHONY: build-linux
build-linux:
	@echo "构建Linux版本..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-linux-amd64 .

.PHONY: build-windows
build-windows:
	@echo "构建Windows版本..."
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-windows-amd64.exe .

.PHONY: build-darwin
build-darwin:
	@echo "构建macOS版本..."
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(APP_NAME)-darwin-amd64 .

.PHONY: build-all
build-all: build-linux build-windows build-darwin
	@echo "所有平台构建完成"

# 运行
.PHONY: run
run:
	@echo "运行 $(APP_NAME)..."
	go run $(LDFLAGS) .

.PHONY: run-dev
run-dev:
	@echo "开发模式运行..."
	LOG_LEVEL=debug go run $(LDFLAGS) .

# 安装
.PHONY: install
install: build
	@echo "安装到系统..."
	cp bin/$(APP_NAME) /usr/local/bin/

# 清理
.PHONY: clean
clean:
	@echo "清理构建文件..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	docker rmi $(DOCKER_IMAGE) $(DOCKER_LATEST) 2>/dev/null || true

# Docker相关
.PHONY: docker-build
docker-build:
	@echo "构建Docker镜像..."
	docker build -t $(DOCKER_IMAGE) -t $(DOCKER_LATEST) .
	@echo "Docker镜像构建完成: $(DOCKER_IMAGE)"

.PHONY: docker-run
docker-run:
	@echo "运行Docker容器..."
	docker run -d \
		--name $(APP_NAME) \
		-p 8080:8080 \
		-p 9090:9090 \
		-e LOG_LEVEL=debug \
		$(DOCKER_LATEST)

.PHONY: docker-stop
docker-stop:
	@echo "停止Docker容器..."
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

.PHONY: docker-logs
docker-logs:
	@echo "查看Docker容器日志..."
	docker logs -f $(APP_NAME)

.PHONY: docker-push
docker-push: docker-build
	@echo "推送Docker镜像..."
	docker tag $(DOCKER_IMAGE) $(REGISTRY)/$(DOCKER_IMAGE)
	docker tag $(DOCKER_LATEST) $(REGISTRY)/$(DOCKER_LATEST)
	docker push $(REGISTRY)/$(DOCKER_IMAGE)
	docker push $(REGISTRY)/$(DOCKER_LATEST)

# Docker Compose
.PHONY: compose-up
compose-up:
	@echo "启动Docker Compose..."
	docker-compose up -d

.PHONY: compose-down
compose-down:
	@echo "停止Docker Compose..."
	docker-compose down

.PHONY: compose-logs
compose-logs:
	@echo "查看Compose日志..."
	docker-compose logs -f

.PHONY: compose-multi
compose-multi:
	@echo "启动多实例环境..."
	docker-compose --profile multi-agent --profile load-balancer up -d

# Kubernetes
.PHONY: k8s-deploy
k8s-deploy:
	@echo "部署到Kubernetes..."
	kubectl create namespace k6-system --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f k8s-deployment.yaml

.PHONY: k8s-delete
k8s-delete:
	@echo "从Kubernetes删除..."
	kubectl delete -f k8s-deployment.yaml

.PHONY: k8s-status
k8s-status:
	@echo "查看Kubernetes状态..."
	kubectl get pods,svc,hpa -n k6-system

.PHONY: k8s-logs
k8s-logs:
	@echo "查看Kubernetes日志..."
	kubectl logs -f deployment/k6-agent -n k6-system

.PHONY: k8s-scale
k8s-scale:
	@echo "扩缩容到$(REPLICAS)个副本..."
	kubectl scale deployment k6-agent --replicas=$(REPLICAS) -n k6-system

# 监控和调试
.PHONY: health-check
health-check:
	@echo "健康检查..."
	curl -f http://localhost:8080/health || echo "健康检查失败"

.PHONY: metrics
metrics:
	@echo "获取监控指标..."
	curl http://localhost:9090/metrics

.PHONY: info
info:
	@echo "获取Agent信息..."
	curl http://localhost:8080/info | jq .

# 开发工具
.PHONY: dev-setup
dev-setup:
	@echo "设置开发环境..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/air-verse/air@latest

.PHONY: dev-watch
dev-watch:
	@echo "监听文件变化并自动重启..."
	air

# 性能测试
.PHONY: benchmark
benchmark:
	@echo "运行性能测试..."
	go test -bench=. -benchmem ./...

.PHONY: profile
profile:
	@echo "生成性能分析文件..."
	go test -cpuprofile=cpu.prof -memprofile=mem.prof -bench=. ./...
	@echo "使用 'go tool pprof cpu.prof' 查看CPU分析"
	@echo "使用 'go tool pprof mem.prof' 查看内存分析"

# 发布
.PHONY: release
release: clean test build-all docker-build
	@echo "发布版本 $(VERSION)"
	@echo "构建完成，可以推送镜像和部署"

# 版本信息
.PHONY: version
version:
	@echo "应用名称: $(APP_NAME)"
	@echo "版本: $(VERSION)"
	@echo "Git提交: $(GIT_COMMIT)"
	@echo "构建时间: $(BUILD_TIME)"
	@echo "Go版本: $(GO_VERSION)"

# 环境检查
.PHONY: check-env
check-env:
	@echo "检查环境..."
	@which go > /dev/null || (echo "Go未安装" && exit 1)
	@which docker > /dev/null || (echo "Docker未安装" && exit 1)
	@which kubectl > /dev/null || (echo "kubectl未安装" && exit 1)
	@echo "环境检查通过"