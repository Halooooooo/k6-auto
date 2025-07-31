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
  Statistic,
  Progress,
  Tabs,
  Timeline,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { resultService } from '../../../services';
import './index.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface TestResult {
  id: string;
  name: string;
  taskId: string;
  taskName: string;
  scriptId: string;
  scriptName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    rps: number;
    errorRate: number;
  };
  metrics: {
    vus: number;
    iterations: number;
    dataReceived: string;
    dataSent: string;
  };
  errors: Array<{
    type: string;
    message: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    timestamp: string;
    event: string;
    details: string;
  }>;
}

interface DetailedMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold?: {
    warning: number;
    critical: number;
  };
}

const ResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchResult();
      fetchDetailedMetrics();
    }
  }, [id]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await resultService.getResult(id!);
      setResult(response.data);
    } catch (error) {
      message.error('获取测试结果详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedMetrics = async () => {
    try {
      const response = await resultService.getDetailedMetrics(id!);
      setDetailedMetrics(response.data);
    } catch (error) {
      console.error('获取详细指标失败:', error);
    }
  };

  const handleDownload = async () => {
    try {
      await resultService.downloadReport(id!);
      message.success('报告下载成功');
    } catch (error) {
      message.error('下载报告失败');
    }
  };

  const handleShare = async () => {
    try {
      const response = await resultService.shareResult(id!);
      navigator.clipboard.writeText(response.data.shareUrl);
      message.success('分享链接已复制到剪贴板');
    } catch (error) {
      message.error('生成分享链接失败');
    }
  };

  const handleDelete = async () => {
    try {
      await resultService.deleteResult(id!);
      message.success('删除成功');
      navigate('/results');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'processing';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'running':
        return <ClockCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      case 'cancelled':
        return <WarningOutlined />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '运行中';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const errorColumns = [
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage.toFixed(2)}%`,
      sorter: (a: any, b: any) => a.percentage - b.percentage,
    },
  ];

  const metricColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: DetailedMetric) => (
        <span>
          {value.toLocaleString()} {record.unit}
        </span>
      ),
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => {
        const color = trend === 'up' ? 'red' : trend === 'down' ? 'green' : 'blue';
        const text = trend === 'up' ? '上升' : trend === 'down' ? '下降' : '稳定';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record: DetailedMetric) => {
        if (!record.threshold) return <Tag color="blue">正常</Tag>;
        
        if (record.value >= record.threshold.critical) {
          return <Tag color="red">严重</Tag>;
        } else if (record.value >= record.threshold.warning) {
          return <Tag color="orange">警告</Tag>;
        } else {
          return <Tag color="green">正常</Tag>;
        }
      },
    },
  ];

  if (loading) {
    return (
      <div className="result-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-detail-error">
        <Text>测试结果不存在</Text>
      </div>
    );
  }

  return (
    <div className="result-detail">
      <Card className="detail-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/results')}
              className="back-button"
            >
              返回
            </Button>
            <div className="result-info">
              <Title level={2} className="result-title">{result.name}</Title>
              <Space>
                <Tag color={getStatusColor(result.status)} icon={getStatusIcon(result.status)}>
                  {getStatusText(result.status)}
                </Tag>
                <Text type="secondary">任务: {result.taskName}</Text>
                <Text type="secondary">脚本: {result.scriptName}</Text>
              </Space>
            </div>
          </div>
          <div className="header-actions">
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                下载报告
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
              >
                分享
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchResult}
              >
                刷新
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

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="detail-tabs">
        <TabPane tab="概览" key="overview">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="基本信息" className="info-card">
                <Descriptions column={2}>
                  <Descriptions.Item label="测试ID">{result.id}</Descriptions.Item>
                  <Descriptions.Item label="任务ID">{result.taskId}</Descriptions.Item>
                  <Descriptions.Item label="脚本ID">{result.scriptId}</Descriptions.Item>
                  <Descriptions.Item label="开始时间">
                    {new Date(result.startTime).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="结束时间">
                    {result.endTime ? new Date(result.endTime).toLocaleString() : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="持续时间">
                    {result.duration ? `${(result.duration / 1000).toFixed(2)}s` : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              
              {result.errors.length > 0 && (
                <Card title="错误统计" className="errors-card">
                  <Alert
                    message={`共发现 ${result.errors.length} 种错误类型`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    columns={errorColumns}
                    dataSource={result.errors}
                    rowKey="type"
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}
            </Col>
            
            <Col xs={24} lg={8}>
              <Card title="性能指标" className="metrics-card">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="总请求数"
                      value={result.summary.totalRequests}
                      suffix="次"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="成功率"
                      value={((result.summary.successfulRequests / result.summary.totalRequests) * 100)}
                      suffix="%"
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="平均响应时间"
                      value={result.summary.avgResponseTime}
                      suffix="ms"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="RPS"
                      value={result.summary.rps}
                      suffix="/s"
                      precision={1}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="error-rate">
                  <Text strong>错误率</Text>
                  <Progress
                    percent={result.summary.errorRate}
                    status={result.summary.errorRate > 5 ? 'exception' : 'success'}
                    strokeColor={{
                      '0%': '#87d068',
                      '100%': '#ff6b6b',
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="详细指标" key="metrics">
          <Card title="详细性能指标">
            <Table
              columns={metricColumns}
              dataSource={detailedMetrics}
              rowKey="name"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="执行时间线" key="timeline">
          <Card title="执行时间线">
            <Timeline>
              {result.timeline.map((item, index) => (
                <Timeline.Item
                  key={index}
                  color={item.event.includes('error') ? 'red' : 'blue'}
                >
                  <div className="timeline-item">
                    <div className="timeline-time">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="timeline-event">{item.event}</div>
                    <div className="timeline-details">{item.details}</div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除测试结果 "{result.name}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default ResultDetail;