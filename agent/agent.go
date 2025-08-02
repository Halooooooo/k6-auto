package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// AgentInfo Agent信息结构
type AgentInfo struct {
	AgentID    string            `json:"agent_id"`
	Hostname   string            `json:"hostname"`
	IP         string            `json:"ip"`
	OS         string            `json:"os"`
	Arch       string            `json:"arch"`
	K6Version  string            `json:"k6_version"`
	Resources  map[string]int    `json:"resources"`
	Tags       map[string]string `json:"tags,omitempty"`
	Timestamp  time.Time         `json:"timestamp"`
}

// RegisterRequest Agent注册请求
type RegisterRequest struct {
	AgentInfo
	RegistrationToken string `json:"registration_token"`
}

// RegisterResponse Agent注册响应
type RegisterResponse struct {
	Status  string                 `json:"status"`
	Message string                 `json:"message"`
	Config  map[string]interface{} `json:"config,omitempty"`
}

// Job 任务结构
type Job struct {
	ID            string                 `json:"id"`
	Type          string                 `json:"type"` // k6, shell, python, docker
	ScriptID      string                 `json:"script_id,omitempty"`
	ScriptContent string                 `json:"script_content,omitempty"`
	Command       string                 `json:"command,omitempty"`
	Params        map[string]interface{} `json:"params,omitempty"`
	Timeout       string                 `json:"timeout,omitempty"`
	Priority      int                    `json:"priority,omitempty"`
	Tags          map[string]string      `json:"tags,omitempty"`
}

// JobPollResponse 任务轮询响应
type JobPollResponse struct {
	Job *Job `json:"job"`
}

// JobStatusRequest 任务状态上报请求
type JobStatusRequest struct {
	JobID     string    `json:"job_id"`
	Status    string    `json:"status"`
	Progress  float64   `json:"progress"`
	Log       string    `json:"log,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// JobResultRequest 任务结果回传请求
type JobResultRequest struct {
	JobID           string                 `json:"job_id"`
	Status          string                 `json:"status"`
	ExitCode        int                    `json:"exit_code"`
	MetricsJSON     string                 `json:"metrics_json,omitempty"`
	HTMLReportURL   string                 `json:"html_report_url,omitempty"`
	ExecutionTime   int64                  `json:"execution_time"`
	Log             string                 `json:"log"`
	Error           string                 `json:"error,omitempty"`
	Timestamp       time.Time              `json:"timestamp"`
}

// ExecuteRequest 执行请求结构（保持向后兼容）
type ExecuteRequest struct {
	ScriptID      string                 `json:"scriptId"`
	ScriptContent string                 `json:"scriptContent"`
	Parameters    map[string]interface{} `json:"parameters"`
	Options       map[string]interface{} `json:"options"`
	CallbackURL   string                 `json:"callbackUrl"`
}

// TaskStatus 任务状态
type TaskStatus struct {
	ID          string                 `json:"id"`
	Status      string                 `json:"status"` // pending, running, completed, failed, stopped
	StartTime   time.Time              `json:"startTime"`
	EndTime     *time.Time             `json:"endTime,omitempty"`
	Progress    float64                `json:"progress"`
	Logs        []string               `json:"logs"`
	Result      map[string]interface{} `json:"result,omitempty"`
	Error       string                 `json:"error,omitempty"`
	ScriptID    string                 `json:"scriptId"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// Task 执行任务
type Task struct {
	Status    *TaskStatus
	Cmd       *exec.Cmd
	Ctx       context.Context
	Cancel    context.CancelFunc
	LogChan   chan string
	Clients   map[*websocket.Conn]bool
	ClientsMu sync.RWMutex
}

// Agent 代理结构
type Agent struct {
	// 基本信息
	info     *AgentInfo
	serverURL string
	registrationToken string
	registered bool
	
	// 任务管理
	tasks   map[string]*Task
	tasksMu sync.RWMutex
	
	// WebSocket
	upgrader websocket.Upgrader
	
	// 控制
	ctx    context.Context
	cancel context.CancelFunc
	
	// HTTP客户端
	httpClient *http.Client
	
	// 配置
	heartbeatInterval time.Duration
	pollInterval      time.Duration
}

// NewAgent 创建新的Agent实例
func NewAgent() *Agent {
	ctx, cancel := context.WithCancel(context.Background())
	
	// 获取系统信息
	hostname, _ := os.Hostname()
	k6Version := getK6Version()
	
	// 生成Agent ID
	agentID := generateAgentID()
	
	info := &AgentInfo{
		AgentID:   agentID,
		Hostname:  hostname,
		IP:        getLocalIP(),
		OS:        runtime.GOOS,
		Arch:      runtime.GOARCH,
		K6Version: k6Version,
		Resources: map[string]int{
			"cpu":    runtime.NumCPU(),
			"memory": getMemoryMB(),
		},
		Tags:      make(map[string]string),
		Timestamp: time.Now(),
	}
	
	// 从配置读取标签
	if viper.IsSet("agent.tags") {
		info.Tags = viper.GetStringMapString("agent.tags")
	}
	
	return &Agent{
		info:              info,
		serverURL:         viper.GetString("backend.url"),
		registrationToken: viper.GetString("agent.registration_token"),
		registered:        false,
		tasks:             make(map[string]*Task),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // 允许跨域
			},
		},
		ctx:               ctx,
		cancel:            cancel,
		httpClient:        &http.Client{Timeout: 30 * time.Second},
		heartbeatInterval: time.Duration(viper.GetInt("agent.heartbeat_interval")) * time.Second,
		pollInterval:      time.Duration(viper.GetInt("agent.poll_interval")) * time.Second,
	}
}

// Start 启动Agent
func (a *Agent) Start() error {
	// 注册到后端
	if err := a.register(); err != nil {
		logrus.Errorf("Agent注册失败: %v", err)
		return err
	}
	
	// 启动心跳
	go a.startHeartbeat()
	
	// 启动任务轮询
	go a.startJobPolling()
	
	logrus.Infof("Agent %s 启动成功", a.info.AgentID)
	return nil
}

// Stop 停止Agent
func (a *Agent) Stop() {
	a.cancel()
	logrus.Infof("Agent %s 已停止", a.info.AgentID)
}

// register 注册到后端
func (a *Agent) register() error {
	req := RegisterRequest{
		AgentInfo:         *a.info,
		RegistrationToken: a.registrationToken,
	}
	
	reqBody, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("序列化注册请求失败: %v", err)
	}
	
	resp, err := a.httpClient.Post(
		a.serverURL+"/api/v1/agents/register",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return fmt.Errorf("发送注册请求失败: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("注册失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 读取响应体并解析，更新Agent ID为后端返回的ID
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取注册响应失败: %v", err)
	}

	// 解析返回的Agent对象来获取分配的ID
	var agentData map[string]interface{}
	if err := json.Unmarshal(body, &agentData); err == nil {
		if id, ok := agentData["id"]; ok {
			if idStr, ok := id.(string); ok {
				// 更新Agent ID为后端返回的UUID
				a.info.AgentID = idStr
				logrus.Infof("Agent ID已更新为: %s", idStr)
			}
		}
	}

	a.registered = true
	logrus.Infof("Agent注册成功，响应: %s", string(body))
	
	return nil
}

// startHeartbeat 启动心跳
func (a *Agent) startHeartbeat() {
	ticker := time.NewTicker(a.heartbeatInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			if err := a.sendHeartbeat(); err != nil {
				logrus.Errorf("发送心跳失败: %v", err)
			}
		}
	}
}

// sendHeartbeat 发送心跳
func (a *Agent) sendHeartbeat() error {
	a.info.Timestamp = time.Now()
	
	// 构造心跳请求数据，匹配后端期望的格式
	heartbeatData := map[string]interface{}{
		"agent_id":  a.info.AgentID,
		"timestamp": a.info.Timestamp.Format(time.RFC3339),
		"resources": a.info.Resources,
	}
	
	reqBody, err := json.Marshal(heartbeatData)
	if err != nil {
		return fmt.Errorf("序列化心跳请求失败: %v", err)
	}
	
	resp, err := a.httpClient.Post(
		a.serverURL+"/api/v1/agents/heartbeat",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return fmt.Errorf("发送心跳请求失败: %v", err)
	}
	defer resp.Body.Close()
	
	// 接受200和201状态码作为成功响应
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("心跳失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}
	
	// 读取并记录成功响应
	body, _ := io.ReadAll(resp.Body)
	logrus.Debugf("心跳成功，响应: %s", string(body))
	
	return nil
}

// startJobPolling 启动任务轮询
func (a *Agent) startJobPolling() {
	ticker := time.NewTicker(a.pollInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			if err := a.pollJob(); err != nil {
				logrus.Errorf("轮询任务失败: %v", err)
			}
		}
	}
}

// pollJob 轮询任务
func (a *Agent) pollJob() error {
	if !a.registered {
		return nil // 未注册时不轮询
	}
	
	resp, err := a.httpClient.Get(
		fmt.Sprintf("%s/api/v1/agents/jobs/poll?agent_id=%s", a.serverURL, a.info.AgentID),
	)
	if err != nil {
		return fmt.Errorf("发送轮询请求失败: %v", err)
	}
	defer resp.Body.Close()
	
	// 接受200和201状态码作为成功响应
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("轮询失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}
	
	var pollResp JobPollResponse
	if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
		return fmt.Errorf("解析轮询响应失败: %v", err)
	}
	
	// 如果有新任务，执行它
	if pollResp.Job != nil {
		logrus.Infof("接收到新任务: %s", pollResp.Job.ID)
		go a.executeJob(pollResp.Job)
	} else {
		logrus.Debugf("暂无新任务")
	}
	
	return nil
}

// GetInfo 获取Agent信息
func (a *Agent) GetInfo(c *gin.Context) {
	a.tasksMu.RLock()
	taskCount := len(a.tasks)
	a.tasksMu.RUnlock()

	runningTasks := 0
	a.tasksMu.RLock()
	for _, task := range a.tasks {
		if task.Status.Status == "running" {
			runningTasks++
		}
	}
	a.tasksMu.RUnlock()

	c.JSON(200, gin.H{
		"agentId":      a.info.AgentID,
		"hostname":     a.info.Hostname,
		"version":      "1.0.0",
		"status":       "online",
		"registered":   a.registered,
		"totalTasks":   taskCount,
		"runningTasks": runningTasks,
		"timestamp":    time.Now(),
		"capabilities": []string{"k6", "shell", "websocket", "realtime-logs"},
		"resources":    a.info.Resources,
		"tags":         a.info.Tags,
	})
}

// executeJob 执行任务
func (a *Agent) executeJob(job *Job) {
	logrus.Infof("开始执行任务: %s, 类型: %s", job.ID, job.Type)
	
	// 创建任务
	task := &Task{
		Status: &TaskStatus{
			ID:         job.ID,
			Status:     "pending",
			StartTime:  time.Now(),
			Progress:   0,
			Logs:       []string{},
			ScriptID:   job.ScriptID,
			Parameters: job.Params,
		},
		LogChan: make(chan string, 100),
		Clients: make(map[*websocket.Conn]bool),
	}
	
	// 创建上下文
	task.Ctx, task.Cancel = context.WithCancel(context.Background())
	
	// 设置超时
	if job.Timeout != "" {
		if timeout, err := time.ParseDuration(job.Timeout); err == nil {
			task.Ctx, task.Cancel = context.WithTimeout(task.Ctx, timeout)
		}
	}
	
	// 保存任务
	a.tasksMu.Lock()
	a.tasks[job.ID] = task
	a.tasksMu.Unlock()
	
	// 上报任务开始
	a.reportJobStatus(job.ID, "running", 0, "任务开始执行")
	
	// 根据任务类型执行
	var err error
	switch job.Type {
	case "k6":
		err = a.executeK6Job(task, job)
	case "shell":
		err = a.executeShellJob(task, job)
	case "python":
		err = a.executePythonJob(task, job)
	case "docker":
		err = a.executeDockerJob(task, job)
	default:
		err = fmt.Errorf("不支持的任务类型: %s", job.Type)
	}
	
	// 处理执行结果
	now := time.Now()
	task.Status.EndTime = &now
	
	if err != nil {
		task.Status.Status = "failed"
		task.Status.Error = err.Error()
		logrus.Errorf("任务执行失败: %s, 错误: %v", job.ID, err)
	} else {
		task.Status.Status = "completed"
		task.Status.Progress = 1.0
		logrus.Infof("任务执行完成: %s", job.ID)
	}
	
	// 回传结果
	a.reportJobResult(job.ID, task)
	
	// 清理
	close(task.LogChan)
}

// reportJobStatus 上报任务状态
func (a *Agent) reportJobStatus(jobID, status string, progress float64, log string) {
	req := JobStatusRequest{
		JobID:     jobID,
		Status:    status,
		Progress:  progress,
		Log:       log,
		Timestamp: time.Now(),
	}
	
	reqBody, err := json.Marshal(req)
	if err != nil {
		logrus.Errorf("序列化状态上报请求失败: %v", err)
		return
	}
	
	resp, err := a.httpClient.Post(
		a.serverURL+"/api/v1/agents/jobs/status",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		logrus.Errorf("发送状态上报请求失败: %v", err)
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.Errorf("状态上报失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}
}

// reportJobResult 回传任务结果
func (a *Agent) reportJobResult(jobID string, task *Task) {
	executionTime := int64(0)
	if task.Status.EndTime != nil {
		executionTime = task.Status.EndTime.Sub(task.Status.StartTime).Milliseconds()
	}
	
	// 收集日志
	allLogs := strings.Join(task.Status.Logs, "\n")
	
	req := JobResultRequest{
		JobID:         jobID,
		Status:        task.Status.Status,
		ExitCode:      0,
		ExecutionTime: executionTime,
		Log:           allLogs,
		Error:         task.Status.Error,
		Timestamp:     time.Now(),
	}
	
	// 如果有结果数据，添加到请求中
	if task.Status.Result != nil {
		if metricsJSON, ok := task.Status.Result["metrics_json"]; ok {
			if str, ok := metricsJSON.(string); ok {
				req.MetricsJSON = str
			}
		}
		if htmlURL, ok := task.Status.Result["html_report_url"]; ok {
			if str, ok := htmlURL.(string); ok {
				req.HTMLReportURL = str
			}
		}
	}
	
	reqBody, err := json.Marshal(req)
	if err != nil {
		logrus.Errorf("序列化结果回传请求失败: %v", err)
		return
	}
	
	resp, err := a.httpClient.Post(
		a.serverURL+"/api/v1/agents/jobs/result",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		logrus.Errorf("发送结果回传请求失败: %v", err)
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.Errorf("结果回传失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	} else {
		logrus.Infof("任务结果回传成功: %s", jobID)
	}
}

// ExecuteScript 执行脚本（保持向后兼容）
func (a *Agent) ExecuteScript(c *gin.Context) {
	var req ExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求参数: " + err.Error()})
		return
	}

	// 转换为Job格式
	job := &Job{
		ID:            generateTaskID(),
		Type:          "k6",
		ScriptID:      req.ScriptID,
		ScriptContent: req.ScriptContent,
		Params:        req.Parameters,
	}

	// 异步执行
	go a.executeJob(job)

	c.JSON(200, gin.H{
		"taskId": job.ID,
		"status": "pending",
		"message": "任务已创建，开始执行",
	})
}

// GetTaskStatus 获取任务状态
func (a *Agent) GetTaskStatus(c *gin.Context) {
	taskID := c.Param("taskId")

	a.tasksMu.RLock()
	task, exists := a.tasks[taskID]
	a.tasksMu.RUnlock()

	if !exists {
		c.JSON(404, gin.H{"error": "任务不存在"})
		return
	}

	c.JSON(200, task.Status)
}

// StopTask 停止任务
func (a *Agent) StopTask(c *gin.Context) {
	taskID := c.Param("taskId")

	a.tasksMu.RLock()
	task, exists := a.tasks[taskID]
	a.tasksMu.RUnlock()

	if !exists {
		c.JSON(404, gin.H{"error": "任务不存在"})
		return
	}

	if task.Status.Status == "running" {
		task.Cancel()
		task.Status.Status = "stopped"
		now := time.Now()
		task.Status.EndTime = &now
		logrus.Infof("任务 %s 已停止", taskID)
	}

	c.JSON(200, gin.H{"message": "任务已停止"})
}

// HandleWebSocket 处理WebSocket连接
func (a *Agent) HandleWebSocket(c *gin.Context) {
	taskID := c.Param("taskId")

	a.tasksMu.RLock()
	task, exists := a.tasks[taskID]
	a.tasksMu.RUnlock()

	if !exists {
		c.JSON(404, gin.H{"error": "任务不存在"})
		return
	}

	conn, err := a.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logrus.Errorf("WebSocket升级失败: %v", err)
		return
	}
	defer conn.Close()

	// 添加客户端
	task.ClientsMu.Lock()
	task.Clients[conn] = true
	task.ClientsMu.Unlock()

	// 发送历史日志
	for _, log := range task.Status.Logs {
		conn.WriteMessage(websocket.TextMessage, []byte(log))
	}

	// 监听日志
	go func() {
		for log := range task.LogChan {
			task.ClientsMu.RLock()
			for client := range task.Clients {
				if err := client.WriteMessage(websocket.TextMessage, []byte(log)); err != nil {
					client.Close()
					delete(task.Clients, client)
				}
			}
			task.ClientsMu.RUnlock()
		}
	}()

	// 保持连接
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}

	// 移除客户端
	task.ClientsMu.Lock()
	delete(task.Clients, conn)
	task.ClientsMu.Unlock()
}

// executeK6Job 执行k6任务
func (a *Agent) executeK6Job(task *Task, job *Job) error {
	// 使用现有的executor.go中的逻辑
	executor := NewExecutor()
	executor.SetAgent(a)
	req := ExecuteRequest{
		ScriptID:      job.ScriptID,
		ScriptContent: job.ScriptContent,
		Parameters:    job.Params,
	}
	return executor.Execute(task, req)
}

// executeShellJob 执行Shell任务
func (a *Agent) executeShellJob(task *Task, job *Job) error {
	if job.Command == "" {
		return fmt.Errorf("Shell任务缺少命令")
	}
	
	task.Status.Status = "running"
	a.reportJobStatus(job.ID, "running", 0.1, "开始执行Shell命令")
	
	// 创建命令
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(task.Ctx, "powershell", "-Command", job.Command)
	} else {
		cmd = exec.CommandContext(task.Ctx, "/bin/sh", "-c", job.Command)
	}
	
	// 设置输出
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	
	// 执行命令
	err := cmd.Run()
	
	// 收集输出
	outputLog := stdout.String()
	errorLog := stderr.String()
	
	if outputLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDOUT: "+outputLog)
		a.broadcastLog(task, "STDOUT: "+outputLog)
	}
	if errorLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDERR: "+errorLog)
		a.broadcastLog(task, "STDERR: "+errorLog)
	}
	
	if err != nil {
		a.reportJobStatus(job.ID, "failed", 0.5, fmt.Sprintf("Shell命令执行失败: %v", err))
		return err
	}
	
	a.reportJobStatus(job.ID, "completed", 1.0, "Shell命令执行完成")
	return nil
}

// executePythonJob 执行Python任务
func (a *Agent) executePythonJob(task *Task, job *Job) error {
	if job.ScriptContent == "" {
		return fmt.Errorf("Python任务缺少脚本内容")
	}
	
	task.Status.Status = "running"
	a.reportJobStatus(job.ID, "running", 0.1, "开始执行Python脚本")
	
	// 创建临时脚本文件
	tempDir := filepath.Join(os.TempDir(), "k6-agent", job.ID)
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("创建临时目录失败: %v", err)
	}
	defer os.RemoveAll(tempDir)
	
	scriptFile := filepath.Join(tempDir, "script.py")
	if err := os.WriteFile(scriptFile, []byte(job.ScriptContent), 0644); err != nil {
		return fmt.Errorf("写入脚本文件失败: %v", err)
	}
	
	// 执行Python脚本
	cmd := exec.CommandContext(task.Ctx, "python", scriptFile)
	cmd.Dir = tempDir
	
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	
	// 收集输出
	outputLog := stdout.String()
	errorLog := stderr.String()
	
	if outputLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDOUT: "+outputLog)
		a.broadcastLog(task, "STDOUT: "+outputLog)
	}
	if errorLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDERR: "+errorLog)
		a.broadcastLog(task, "STDERR: "+errorLog)
	}
	
	if err != nil {
		a.reportJobStatus(job.ID, "failed", 0.5, fmt.Sprintf("Python脚本执行失败: %v", err))
		return err
	}
	
	a.reportJobStatus(job.ID, "completed", 1.0, "Python脚本执行完成")
	return nil
}

// executeDockerJob 执行Docker任务
func (a *Agent) executeDockerJob(task *Task, job *Job) error {
	if job.Command == "" {
		return fmt.Errorf("Docker任务缺少命令")
	}
	
	task.Status.Status = "running"
	a.reportJobStatus(job.ID, "running", 0.1, "开始执行Docker命令")
	
	// 解析Docker命令
	args := strings.Fields(job.Command)
	if len(args) == 0 {
		return fmt.Errorf("无效的Docker命令")
	}
	
	// 执行Docker命令
	cmd := exec.CommandContext(task.Ctx, "docker", args...)
	
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	
	// 收集输出
	outputLog := stdout.String()
	errorLog := stderr.String()
	
	if outputLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDOUT: "+outputLog)
		a.broadcastLog(task, "STDOUT: "+outputLog)
	}
	if errorLog != "" {
		task.Status.Logs = append(task.Status.Logs, "STDERR: "+errorLog)
		a.broadcastLog(task, "STDERR: "+errorLog)
	}
	
	if err != nil {
		a.reportJobStatus(job.ID, "failed", 0.5, fmt.Sprintf("Docker命令执行失败: %v", err))
		return err
	}
	
	a.reportJobStatus(job.ID, "completed", 1.0, "Docker命令执行完成")
	return nil
}

// broadcastLog 广播日志到WebSocket客户端
func (a *Agent) broadcastLog(task *Task, log string) {
	select {
	case task.LogChan <- log:
	default:
		// 如果通道满了，跳过这条日志
	}
}

// 辅助函数
func generateAgentID() string {
	hostname, _ := os.Hostname()
	return fmt.Sprintf("agent-%s-%d", hostname, time.Now().Unix())
}

func generateTaskID() string {
	return fmt.Sprintf("task-%d", time.Now().UnixNano())
}

func getK6Version() string {
	cmd := exec.Command("k6", "version")
	output, err := cmd.Output()
	if err != nil {
		return "unknown"
	}
	
	// 解析版本信息
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "k6 v") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				return strings.TrimPrefix(parts[1], "v")
			}
		}
	}
	return "unknown"
}

func getLocalIP() string {
	// 简单实现，实际可能需要更复杂的逻辑
	return "127.0.0.1"
}

func getMemoryMB() int {
	// 简单实现，返回固定值
	// 实际应该读取系统内存信息
	return 8192
}