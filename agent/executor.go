package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// Executor K6执行器
type Executor struct {
	agent *Agent
}

// NewExecutor 创建新的执行器
func NewExecutor() *Executor {
	return &Executor{}
}

// SetAgent 设置Agent引用
func (e *Executor) SetAgent(agent *Agent) {
	e.agent = agent
}

// K6Result k6执行结果
type K6Result struct {
	Metrics map[string]interface{} `json:"metrics"`
	Checks  map[string]interface{} `json:"checks"`
	State   map[string]interface{} `json:"state"`
}

// Execute 执行k6脚本
func (e *Executor) Execute(task *Task, req ExecuteRequest) error {
	logrus.Infof("开始执行k6任务 %s", task.Status.ID)
	task.Status.Status = "running"

	defer func() {
		if r := recover(); r != nil {
			logrus.Errorf("任务执行异常: %v", r)
			task.Status.Status = "failed"
			task.Status.Error = fmt.Sprintf("执行异常: %v", r)
			now := time.Now()
			task.Status.EndTime = &now
		}
	}()

	// 1. 准备脚本文件
	scriptPath, err := e.prepareScript(task, req)
	if err != nil {
		e.handleTaskError(task, "脚本准备失败", err)
		return err
	}
	defer os.Remove(scriptPath) // 清理临时文件

	// 2. 构建k6命令
	cmd, err := e.buildK6Command(task, scriptPath, req)
	if err != nil {
		e.handleTaskError(task, "命令构建失败", err)
		return err
	}

	task.Cmd = cmd

	// 3. 执行命令
	err = e.runK6Command(task, cmd)
	if err != nil {
		e.handleTaskError(task, "执行失败", err)
		return err
	}

	// 4. 处理结果
	e.processResult(task, req)

	logrus.Infof("任务 %s 执行完成", task.Status.ID)
	return nil
}

// prepareScript 准备脚本文件
func (e *Executor) prepareScript(task *Task, req ExecuteRequest) (string, error) {
	e.addLog(task, "正在准备脚本文件...")

	var scriptContent string

	// 如果有脚本内容，直接使用
	if req.ScriptContent != "" {
		scriptContent = req.ScriptContent
		e.addLog(task, "使用提供的脚本内容")
	} else if req.ScriptID != "" {
		// 从后端下载脚本
		content, err := e.downloadScript(req.ScriptID)
		if err != nil {
			return "", fmt.Errorf("下载脚本失败: %v", err)
		}
		scriptContent = content
		e.addLog(task, fmt.Sprintf("已下载脚本 ID: %s", req.ScriptID))
	} else {
		return "", fmt.Errorf("未提供脚本内容或脚本ID")
	}

	// 创建临时脚本文件
	tempDir := os.TempDir()
	scriptPath := filepath.Join(tempDir, fmt.Sprintf("k6-script-%s.js", task.Status.ID))

	err := os.WriteFile(scriptPath, []byte(scriptContent), 0644)
	if err != nil {
		return "", fmt.Errorf("写入脚本文件失败: %v", err)
	}

	e.addLog(task, fmt.Sprintf("脚本文件已准备: %s", scriptPath))
	return scriptPath, nil
}

// downloadScript 从后端下载脚本
func (e *Executor) downloadScript(scriptID string) (string, error) {
	backendURL := viper.GetString("backend.url")
	url := fmt.Sprintf("%s/api/scripts/%s/content", backendURL, scriptID)

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// 解析响应
	var response struct {
		Content string `json:"content"`
	}
	err = json.Unmarshal(body, &response)
	if err != nil {
		return "", err
	}

	return response.Content, nil
}

// buildK6Command 构建k6命令
func (e *Executor) buildK6Command(task *Task, scriptPath string, req ExecuteRequest) (*exec.Cmd, error) {
	e.addLog(task, "正在构建k6命令...")

	k6Binary := viper.GetString("k6.binary")
	args := []string{"run"}

	// 添加输出格式
	args = append(args, "--out", "json=results.json")

	// 处理执行选项
	if req.Options != nil {
		// VUs (虚拟用户数)
		if vus, ok := req.Options["vus"]; ok {
			args = append(args, "--vus", fmt.Sprintf("%v", vus))
		}

		// Duration (持续时间)
		if duration, ok := req.Options["duration"]; ok {
			args = append(args, "--duration", fmt.Sprintf("%v", duration))
		}

		// Iterations (迭代次数)
		if iterations, ok := req.Options["iterations"]; ok {
			args = append(args, "--iterations", fmt.Sprintf("%v", iterations))
		}

		// Stages (阶段配置)
		if stages, ok := req.Options["stages"]; ok {
			stagesJSON, _ := json.Marshal(stages)
			args = append(args, "--stage", string(stagesJSON))
		}
	}

	// 处理环境变量参数
	if req.Parameters != nil {
		for key, value := range req.Parameters {
			args = append(args, "-e", fmt.Sprintf("%s=%v", key, value))
		}
	}

	// 添加脚本文件
	args = append(args, scriptPath)

	cmd := exec.CommandContext(task.Ctx, k6Binary, args...)
	cmd.Dir = filepath.Dir(scriptPath)

	e.addLog(task, fmt.Sprintf("k6命令: %s %s", k6Binary, strings.Join(args, " ")))
	return cmd, nil
}

// runK6Command 运行k6命令
func (e *Executor) runK6Command(task *Task, cmd *exec.Cmd) error {
	e.addLog(task, "开始执行k6测试...")

	// 创建管道获取输出
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	// 启动命令
	err = cmd.Start()
	if err != nil {
		return err
	}

	// 实时读取输出
	go e.readOutput(task, stdout, "stdout")
	go e.readOutput(task, stderr, "stderr")

	// 等待命令完成
	err = cmd.Wait()

	now := time.Now()
	task.Status.EndTime = &now

	if err != nil {
		if task.Ctx.Err() == nil { // 不是被取消的
			task.Status.Status = "failed"
			task.Status.Error = err.Error()
			e.addLog(task, fmt.Sprintf("执行失败: %v", err))
		} else {
			task.Status.Status = "stopped"
			e.addLog(task, "执行已停止")
		}
		return err
	}

	task.Status.Status = "completed"
	task.Status.Progress = 100
	e.addLog(task, "k6测试执行完成")
	return nil
}

// readOutput 读取命令输出
func (e *Executor) readOutput(task *Task, reader io.Reader, source string) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		logLine := fmt.Sprintf("[%s] %s", source, line)
		e.addLog(task, logLine)

		// 解析进度信息
		e.parseProgress(task, line)
	}
}

// parseProgress 解析执行进度
func (e *Executor) parseProgress(task *Task, line string) {
	// 简单的进度解析，可以根据k6输出格式进行优化
	if strings.Contains(line, "running") && strings.Contains(line, "/") {
		// 尝试解析类似 "running (1m30s/2m0s)" 的格式
		parts := strings.Split(line, "/")
		if len(parts) >= 2 {
			// 这里可以添加更复杂的进度计算逻辑
			if progress, err := strconv.Atoi("50"); err == nil {
				task.Status.Progress = float64(progress)
			}
		}
	}
}

// processResult 处理执行结果
func (e *Executor) processResult(task *Task, req ExecuteRequest) {
	e.addLog(task, "正在处理执行结果...")

	// 读取结果文件
	resultPath := filepath.Join(filepath.Dir(task.Cmd.Dir), "results.json")
	if _, err := os.Stat(resultPath); err == nil {
		resultData, err := os.ReadFile(resultPath)
		if err == nil {
			// 解析JSON结果
			var result map[string]interface{}
			if err := json.Unmarshal(resultData, &result); err == nil {
				task.Status.Result = result
				e.addLog(task, "结果解析成功")
			} else {
				e.addLog(task, fmt.Sprintf("结果解析失败: %v", err))
			}
		}
		os.Remove(resultPath) // 清理结果文件
	}

	// 回调后端
	if req.CallbackURL != "" {
		go e.sendCallback(task, req.CallbackURL)
	}
}

// sendCallback 发送回调
func (e *Executor) sendCallback(task *Task, callbackURL string) {
	payload := map[string]interface{}{
		"taskId":    task.Status.ID,
		"status":    task.Status.Status,
		"result":    task.Status.Result,
		"error":     task.Status.Error,
		"startTime": task.Status.StartTime,
		"endTime":   task.Status.EndTime,
		"logs":      task.Status.Logs,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		logrus.Errorf("序列化回调数据失败: %v", err)
		return
	}

	resp, err := http.Post(callbackURL, "application/json", bytes.NewBuffer(data))
	if err != nil {
		logrus.Errorf("发送回调失败: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		logrus.Errorf("回调响应错误: %d", resp.StatusCode)
	} else {
		logrus.Infof("回调发送成功: %s", callbackURL)
	}
}

// addLog 添加日志
func (e *Executor) addLog(task *Task, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] %s", timestamp, message)

	task.Status.Logs = append(task.Status.Logs, logLine)

	// 发送到WebSocket客户端
	select {
	case task.LogChan <- logLine:
	default:
		// 如果通道满了，跳过
	}

	logrus.Info(logLine)
}

// handleTaskError 处理任务错误
func (e *Executor) handleTaskError(task *Task, message string, err error) {
	task.Status.Status = "failed"
	task.Status.Error = fmt.Sprintf("%s: %v", message, err)
	now := time.Now()
	task.Status.EndTime = &now
	e.addLog(task, task.Status.Error)
	logrus.Errorf("任务 %s 失败: %s", task.Status.ID, task.Status.Error)
}