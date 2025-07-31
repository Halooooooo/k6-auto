// API 相关常量
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  SCRIPTS: {
    LIST: '/scripts',
    CREATE: '/scripts',
    UPDATE: (id: string) => `/scripts/${id}`,
    DELETE: (id: string) => `/scripts/${id}`,
    UPLOAD: '/scripts/upload',
    DOWNLOAD: (id: string) => `/scripts/${id}/download`
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    UPDATE: (id: string) => `/tasks/${id}`,
    DELETE: (id: string) => `/tasks/${id}`,
    EXECUTE: (id: string) => `/tasks/${id}/execute`,
    STOP: (id: string) => `/tasks/${id}/stop`
  },
  AGENTS: {
    LIST: '/agents',
    CREATE: '/agents',
    UPDATE: (id: string) => `/agents/${id}`,
    DELETE: (id: string) => `/agents/${id}`,
    ENABLE: (id: string) => `/agents/${id}/enable`,
    DISABLE: (id: string) => `/agents/${id}/disable`
  },
  RESULTS: {
    LIST: '/results',
    DETAIL: (id: string) => `/results/${id}`,
    DELETE: (id: string) => `/results/${id}`,
    DOWNLOAD: (id: string) => `/results/${id}/download`
  },
  CHAT: {
    MESSAGES: '/chat/messages',
    HISTORY: '/chat/history',
    SUGGESTIONS: '/chat/suggestions'
  }
} as const

// 状态常量
export const STATUS = {
  SCRIPT: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived'
  },
  TASK: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    PAUSED: 'paused'
  },
  AGENT: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    BUSY: 'busy',
    ERROR: 'error',
    MAINTENANCE: 'maintenance'
  },
  RESULT: {
    SUCCESS: 'success',
    FAILED: 'failed',
    PARTIAL: 'partial'
  }
} as const

// 脚本类型
export const SCRIPT_TYPES = {
  LOAD_TEST: 'load_test',
  STRESS_TEST: 'stress_test',
  SPIKE_TEST: 'spike_test',
  VOLUME_TEST: 'volume_test',
  ENDURANCE_TEST: 'endurance_test',
  API_TEST: 'api_test',
  SMOKE_TEST: 'smoke_test'
} as const

// 触发器类型
export const TRIGGER_TYPES = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  WEBHOOK: 'webhook',
  API: 'api'
} as const

// 消息类型
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error'
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

// 主题配置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

// 语言配置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US'
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000
} as const

// 文件上传配置
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    SCRIPT: ['.js', '.ts', '.json'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.md']
  },
  CHUNK_SIZE: 1024 * 1024 // 1MB
} as const

// 缓存配置
export const CACHE = {
  TTL: {
    SHORT: 5 * 60 * 1000, // 5分钟
    MEDIUM: 30 * 60 * 1000, // 30分钟
    LONG: 24 * 60 * 60 * 1000 // 24小时
  },
  KEYS: {
    USER_PROFILE: 'user_profile',
    SCRIPTS: 'scripts',
    TASKS: 'tasks',
    AGENTS: 'agents',
    RESULTS: 'results',
    CHAT_HISTORY: 'chat_history'
  }
} as const

// WebSocket 事件
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  TASK_UPDATE: 'task_update',
  AGENT_UPDATE: 'agent_update',
  RESULT_UPDATE: 'result_update',
  CHAT_MESSAGE: 'chat_message',
  TYPING: 'typing',
  NOTIFICATION: 'notification'
} as const

// 错误代码
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/
} as const

// 默认配置
export const DEFAULTS = {
  SCRIPT: {
    TYPE: SCRIPT_TYPES.LOAD_TEST,
    CONTENT: `import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let response = http.get('https://httpbin.org/get');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
`
  },
  TASK: {
    TRIGGER_TYPE: TRIGGER_TYPES.MANUAL,
    CONFIG: {
      vus: 10,
      duration: '30s',
      rps: null,
      stages: []
    }
  },
  AGENT: {
    RESOURCES: {
      cpu: 2,
      memory: 4096,
      disk: 10240
    },
    CAPABILITIES: ['k6', 'javascript', 'typescript']
  }
} as const

// 图表配置
export const CHART_COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
  INFO: '#13c2c2',
  PURPLE: '#722ed1',
  ORANGE: '#fa8c16',
  PINK: '#eb2f96',
  CYAN: '#13c2c2',
  LIME: '#a0d911'
} as const

// 性能指标
export const METRICS = {
  HTTP_REQ_DURATION: 'http_req_duration',
  HTTP_REQ_RATE: 'http_reqs',
  HTTP_REQ_FAILED: 'http_req_failed',
  VUS: 'vus',
  VUS_MAX: 'vus_max',
  ITERATIONS: 'iterations',
  ITERATION_DURATION: 'iteration_duration',
  DATA_RECEIVED: 'data_received',
  DATA_SENT: 'data_sent'
} as const

// 阈值配置
export const THRESHOLDS = {
  HTTP_REQ_DURATION: {
    P95: 'p(95)<500',
    P99: 'p(99)<1000',
    AVG: 'avg<200'
  },
  HTTP_REQ_FAILED: {
    RATE: 'rate<0.01'
  },
  HTTP_REQS: {
    RATE: 'rate>100'
  }
} as const

// 本地存储键
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TABLE_SETTINGS: 'table_settings',
  RECENT_SCRIPTS: 'recent_scripts',
  RECENT_TASKS: 'recent_tasks',
  CHAT_HISTORY: 'chat_history'
} as const

// 快捷键
export const SHORTCUTS = {
  SAVE: 'Ctrl+S',
  NEW: 'Ctrl+N',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  FIND: 'Ctrl+F',
  REPLACE: 'Ctrl+H',
  RUN: 'Ctrl+R',
  STOP: 'Ctrl+Shift+S',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  TOGGLE_CHAT: 'Ctrl+Shift+C'
} as const

// 环境变量
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'K6 Auto',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.MODE || 'development'
} as const