import React, { useState, useEffect } from 'react';
import {
  Modal,
  List,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Divider,
} from 'antd';
import {
  HistoryOutlined,
  RollbackOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { scriptService } from '../../services';
import MonacoEditor from '../MonacoEditor';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface ScriptVersion {
  id: string;
  version: string;
  content: string;
  changeLog?: string;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
  };
  isActive: boolean;
}

interface VersionHistoryProps {
  visible: boolean;
  onClose: () => void;
  scriptId: string;
  onVersionRestore?: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  visible,
  onClose,
  scriptId,
  onVersionRestore,
}) => {
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewVersion, setPreviewVersion] = useState('');

  useEffect(() => {
    if (visible && scriptId) {
      fetchVersionHistory();
    }
  }, [visible, scriptId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const response = await scriptService.getVersionHistory(scriptId);
      setVersions(response.data || []);
    } catch (error) {
      message.error('获取版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (version: ScriptVersion) => {
    setPreviewContent(version.content);
    setPreviewVersion(version.version);
    setPreviewVisible(true);
  };

  const handleRollback = async (versionId: string) => {
    try {
      await scriptService.rollbackVersion(scriptId, versionId);
      message.success('版本回滚成功');
      fetchVersionHistory();
      onVersionRestore?.();
    } catch (error) {
      message.error('版本回滚失败');
    }
  };

  const handleSetActive = async (versionId: string) => {
    try {
      await scriptService.setActiveVersion(scriptId, versionId);
      message.success('设置当前版本成功');
      fetchVersionHistory();
      onVersionRestore?.();
    } catch (error) {
      message.error('设置当前版本失败');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await scriptService.deleteVersion(versionId);
      message.success('版本删除成功');
      fetchVersionHistory();
    } catch (error) {
      message.error('版本删除失败');
    }
  };



  return (
    <>
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            版本历史
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
      >
        <List
          loading={loading}
          dataSource={versions}
          renderItem={(version) => (
            <List.Item
              actions={[
                <Tooltip title="预览代码">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(version)}
                  />
                </Tooltip>,
                !version.isActive && (
                  <Tooltip title="设为当前版本">
                    <Popconfirm
                      title="确定要切换到此版本吗？"
                      onConfirm={() => handleSetActive(version.id)}
                    >
                      <Button type="text" icon={<CheckCircleOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                ),
                !version.isActive && (
                  <Tooltip title="回滚到此版本">
                    <Popconfirm
                      title="确定要回滚到此版本吗？这将创建一个新的版本。"
                      onConfirm={() => handleRollback(version.id)}
                    >
                      <Button type="text" icon={<RollbackOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                ),
                !version.isActive && (
                  <Tooltip title="删除版本">
                    <Popconfirm
                      title="确定要删除此版本吗？此操作不可恢复。"
                      onConfirm={() => handleDeleteVersion(version.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>版本 {version.version}</Text>
                    {version.isActive && (
                      <Tag color="green">当前版本</Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {version.changeLog || '无变更说明'}
                    </Paragraph>
                    <Text type="secondary">
                      {dayjs(version.createdAt).format('YYYY-MM-DD HH:mm:ss')} •{' '}
                      {version.createdBy.username}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={`版本 ${previewVersion} 代码预览`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <MonacoEditor
          value={previewContent}
          onChange={() => {}}
          height={500}
          readOnly
          language="javascript"
        />
      </Modal>
    </>
  );
};

export default VersionHistory;