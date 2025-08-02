package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	// 设置测试模式
	gin.SetMode(gin.TestMode)
	m.Run()
}

func setupTestAgent() *Agent {
	return NewAgent()
}

func TestNewAgent(t *testing.T) {
	agent := NewAgent()
	assert.NotNil(t, agent)
	assert.NotNil(t, agent.tasks)
	assert.Equal(t, 0, len(agent.tasks))
}

func TestGetInfo(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.GET("/info", agent.GetInfo)

	req, _ := http.NewRequest("GET", "/info", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "agentId")
	assert.Contains(t, response, "version")
	assert.Contains(t, response, "status")
	assert.Equal(t, "online", response["status"])
	assert.Equal(t, float64(0), response["totalTasks"])
	assert.Equal(t, float64(0), response["runningTasks"])
}

func TestExecuteScript(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.POST("/execute", agent.ExecuteScript)

	// 测试有效请求
	reqBody := ExecuteRequest{
		ScriptContent: `
			import http from 'k6/http';
			export default function() {
				http.get('https://httpbin.org/get');
			}
		`,
		Parameters: map[string]interface{}{
			"BASE_URL": "https://httpbin.org",
		},
		Options: map[string]interface{}{
			"vus":      1,
			"duration": "5s",
		},
	}

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/execute", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "taskId")
	assert.Contains(t, response, "status")
	assert.Equal(t, "pending", response["status"])

	// 验证任务已创建
	taskID := response["taskId"].(string)
	agent.tasksMu.RLock()
	task, exists := agent.tasks[taskID]
	agent.tasksMu.RUnlock()

	assert.True(t, exists)
	assert.NotNil(t, task)
	assert.Equal(t, taskID, task.Status.ID)
}

func TestExecuteScriptInvalidRequest(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.POST("/execute", agent.ExecuteScript)

	// 测试无效请求
	req, _ := http.NewRequest("POST", "/execute", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")
}

func TestGetTaskStatus(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.GET("/status/:taskId", agent.GetTaskStatus)

	// 创建测试任务
	taskID := "test-task-123"
	task := &Task{
		Status: &TaskStatus{
			ID:        taskID,
			Status:    "running",
			StartTime: time.Now(),
			Progress:  50,
			Logs:      []string{"Test log entry"},
		},
		LogChan: make(chan string, 100),
		Clients: make(map[*websocket.Conn]bool),
	}

	agent.tasksMu.Lock()
	agent.tasks[taskID] = task
	agent.tasksMu.Unlock()

	// 测试获取存在的任务状态
	req, _ := http.NewRequest("GET", "/status/"+taskID, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response TaskStatus
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Equal(t, taskID, response.ID)
	assert.Equal(t, "running", response.Status)
	assert.Equal(t, float64(50), response.Progress)
	assert.Len(t, response.Logs, 1)
}

func TestGetTaskStatusNotFound(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.GET("/status/:taskId", agent.GetTaskStatus)

	// 测试获取不存在的任务状态
	req, _ := http.NewRequest("GET", "/status/nonexistent", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 404, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "error")
}

func TestStopTask(t *testing.T) {
	agent := setupTestAgent()
	router := gin.New()
	router.POST("/stop/:taskId", agent.StopTask)

	// 创建运行中的测试任务
	taskID := "test-task-456"
	ctx, cancel := context.WithCancel(context.Background())
	task := &Task{
		Status: &TaskStatus{
			ID:        taskID,
			Status:    "running",
			StartTime: time.Now(),
		},
		Ctx:     ctx,
		Cancel:  cancel,
		LogChan: make(chan string, 100),
		Clients: make(map[*websocket.Conn]bool),
	}

	agent.tasksMu.Lock()
	agent.tasks[taskID] = task
	agent.tasksMu.Unlock()

	// 测试停止任务
	req, _ := http.NewRequest("POST", "/stop/"+taskID, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "message")

	// 验证任务状态已更新
	assert.Equal(t, "stopped", task.Status.Status)
	assert.NotNil(t, task.Status.EndTime)
}

func TestGenerateTaskID(t *testing.T) {
	taskID1 := generateTaskID()
	time.Sleep(1 * time.Millisecond) // 确保时间戳不同
	taskID2 := generateTaskID()

	assert.NotEmpty(t, taskID1)
	assert.NotEmpty(t, taskID2)
	assert.NotEqual(t, taskID1, taskID2)
	assert.Contains(t, taskID1, "task-")
	assert.Contains(t, taskID2, "task-")
}

func TestGetAgentID(t *testing.T) {
	agentID := getAgentID()
	assert.NotEmpty(t, agentID)
	assert.Contains(t, agentID, "agent-")
}

// 基准测试
func BenchmarkGenerateTaskID(b *testing.B) {
	for i := 0; i < b.N; i++ {
		generateTaskID()
	}
}

func BenchmarkGetInfo(b *testing.B) {
	agent := setupTestAgent()
	router := gin.New()
	router.GET("/info", agent.GetInfo)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/info", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}