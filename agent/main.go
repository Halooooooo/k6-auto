package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func main() {
	// 初始化配置
	initConfig()

	// 初始化日志
	initLogger()

	// 创建Agent实例
	agent := NewAgent()

	// 启动Agent（注册、心跳、任务轮询）
	if err := agent.Start(); err != nil {
		logrus.Fatalf("Agent启动失败: %v", err)
	}

	// 启动HTTP服务器
	server := setupHTTPServer(agent)

	// 优雅关闭
	gracefulShutdown(server, agent)
}

func initConfig() {
	// 服务器配置
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.host", "0.0.0.0")
	
	// 后端配置
	viper.SetDefault("backend.url", "http://localhost:3001")
	
	// Agent配置
	viper.SetDefault("agent.registration_token", "default-token")
	viper.SetDefault("agent.heartbeat_interval", 30)
	viper.SetDefault("agent.poll_interval", 5)
	viper.SetDefault("agent.tags", map[string]string{})
	
	// K6配置
	viper.SetDefault("k6.binary", "k6")
	
	// 日志配置
	viper.SetDefault("log.level", "info")

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/etc/k6-agent/")

	// 读取环境变量
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		logrus.Warnf("配置文件读取失败，使用默认配置: %v", err)
	}
}

func initLogger() {
	level, err := logrus.ParseLevel(viper.GetString("log.level"))
	if err != nil {
		level = logrus.InfoLevel
	}
	logrus.SetLevel(level)
	logrus.SetFormatter(&logrus.JSONFormatter{})
}

func setupHTTPServer(agent *Agent) *http.Server {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "timestamp": time.Now()})
	})

	// Agent信息
	r.GET("/info", agent.GetInfo)

	// 执行脚本
	r.POST("/execute", agent.ExecuteScript)

	// 获取执行状态
	r.GET("/status/:taskId", agent.GetTaskStatus)

	// 停止执行
	r.POST("/stop/:taskId", agent.StopTask)

	// WebSocket连接用于实时日志
	r.GET("/ws/:taskId", agent.HandleWebSocket)

	host := viper.GetString("server.host")
	port := viper.GetInt("server.port")
	addr := fmt.Sprintf("%s:%d", host, port)

	server := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		logrus.Infof("Agent服务器启动在 %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("服务器启动失败: %v", err)
		}
	}()

	return server
}

func gracefulShutdown(server *http.Server, agent *Agent) {
	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("正在关闭服务器...")

	// 停止Agent
	agent.Stop()

	// 设置5秒超时
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logrus.Errorf("服务器强制关闭: %v", err)
	}

	logrus.Info("服务器已关闭")
}