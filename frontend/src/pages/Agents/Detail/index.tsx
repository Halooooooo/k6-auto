import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  Table,
  Modal,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Progress,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { agentService } from '../../../services';
import './index.css';

const { Title, Text } = Typography;

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  endpoint: string;
  version: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
  lastHeartbeat: string;
  metrics: {
    totalTasks: number;
    successRate: number;
    avgResponseTime: number;
    uptime: number;
  };
}

interface Task {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: string;
}

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAgent();
      fetchTasks();
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAgent(id!);
      setAgent(response.data);
    } catch (error) {
      message.error('获取智能体详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await agentService.getAgentTasks(id!);
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await agentService.startAgent(id!);
      message.success('智能体启动成功');
      fetchAgent();
    } catch (error) {
      message.error('启动智能体失败');
    }
  };

  const handleStop = async () => {
    try {
      await agentService.stopAgent(id!);
      message.success('智能体停止成功');
      fetchAgent();
    } catch (error) {
      message.error('停止智能体失败');
    }
  };

  const handleRestart = async () => {
    try {
      await agentService.restartAgent(id!);
      message.success('智能体重启成功');
      fetchAgent();
    } catch (error) {
      message.error('重启智能体失败');
    }
  };

  const handleDelete = async () => {
    try {
      await agentService.deleteAgent(id!);
      message.success('删除成功');
      navigate('/agents');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getTaskStatusColor(status)}>
          {status === 'running' ? '运行中' :
           status === 'completed' ? '已完成' :
           status === 'failed' ? '失败' : '等待中'}
        </Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Task) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="agent-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="agent-detail-error">
        <Text>智能体不存在</Text>
      </div>
    );
  }

  return (
    <div className="agent-detail">
      <Card className="detail-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/agents')}
              className="back-button"
            >
              返回
            </Button>
            <div className="agent-info">
              <Title level={2} className="agent-title">{agent.name}</Title>
              <Space>
                <Tag color={getStatusColor(agent.status)}>
                  {agent.status === 'active' ? '运行中' :
                   agent.status === 'inactive' ? '已停止' : '错误'}
                </Tag>
                <Text type="secondary">{agent.type}</Text>
              </Space>
            </div>
          </div>
          <div className="header-actions">
            <Space>
              {agent.status === 'active' ? (
                <Button
                  icon={<StopOutlined />}
                  onClick={handleStop}
                  danger
                >
                  停止
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                >
                  启动
                </Button>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRestart}
              >
                重启
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/agents/${id}/edit`)}
              >
                编辑
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => setDeleteModalVisible(true)}
              >
                删除
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" className="info-card">
            <Descriptions column={2}>
              <Descriptions.Item label="智能体ID">{agent.id}</Descriptions.Item>
              <Descriptions.Item label="类型">{agent.type}</Descriptions.Item>
              <Descriptions.Item label="版本">{agent.version}</Descriptions.Item>
              <Descriptions.Item label="端点">{agent.endpoint}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(agent.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(agent.updatedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="最后心跳">
                {new Date(agent.lastHeartbeat).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">描述</Divider>
            <Text>{agent.description || '暂无描述'}</Text>
            
            <Divider orientation="left">能力</Divider>
            <Space wrap>
              {agent.capabilities.map((capability, index) => (
                <Tag key={index} color="blue">{capability}</Tag>
              ))}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="性能指标" className="metrics-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总任务数"
                  value={agent.metrics.totalTasks}
                  suffix="个"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="成功率"
                  value={agent.metrics.successRate}
                  suffix="%"
                  precision={1}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均响应时间"
                  value={agent.metrics.avgResponseTime}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="运行时间"
                  value={agent.metrics.uptime}
                  suffix="h"
                  precision={1}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <div className="uptime-progress">
              <Text strong>可用性</Text>
              <Progress
                percent={Math.min(agent.metrics.uptime / 24 * 100, 100)}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="执行任务"
        className="tasks-card"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTasks}
            loading={tasksLoading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey="id"
          loading={tasksLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除智能体 "{agent.name}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default AgentDetail;