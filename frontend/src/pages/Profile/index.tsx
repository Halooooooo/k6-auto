import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  Typography,
  message,
  Row,
  Col,
  Divider,
  Switch,
  Select,
  DatePicker,
  Modal,
  Tabs
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  LockOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { authService } from '../../services';
import dayjs from 'dayjs';
import './index.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  timezone: string;
  language: string;
  createdAt: string;
  lastLoginAt: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      setProfile(response.data);
      setAvatarUrl(response.data.avatar || '');
      form.setFieldsValue({
        ...response.data,
        createdAt: dayjs(response.data.createdAt),
      });
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await authService.getPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error('获取用户偏好设置失败:', error);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await authService.updateProfile(values);
      message.success('个人信息更新成功');
      fetchProfile();
    } catch (error) {
      message.error('更新个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (newPreferences: UserPreferences) => {
    try {
      await authService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      message.success('偏好设置更新成功');
    } catch (error) {
      message.error('更新偏好设置失败');
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await authService.uploadAvatar(formData);
      setAvatarUrl(response.data.avatarUrl);
      message.success('头像上传成功');
      return false; // 阻止默认上传行为
    } catch (error) {
      message.error('头像上传失败');
      return false;
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      if (enabled) {
        // 启用双因子认证
        const response = await authService.enable2FA();
        Modal.info({
          title: '双因子认证设置',
          content: (
            <div>
              <p>请使用认证应用扫描以下二维码：</p>
              <img src={response.data.qrCode} alt="QR Code" style={{ width: '200px' }} />
              <p>或手动输入密钥：{response.data.secret}</p>
            </div>
          ),
        });
      } else {
        // 禁用双因子认证
        await authService.disable2FA();
        message.success('双因子认证已禁用');
      }
      fetchPreferences();
    } catch (error) {
      message.error('双因子认证设置失败');
    }
  };

  if (!profile || !preferences) {
    return (
      <div className="profile-loading">
        <Card loading={true} />
      </div>
    );
  }

  return (
    <div className="profile">
      <Card className="profile-header">
        <div className="header-content">
          <div className="avatar-section">
            <Avatar
              size={80}
              src={avatarUrl}
              icon={<UserOutlined />}
              className="user-avatar"
            />
            <Upload
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} size="small">
                更换头像
              </Button>
            </Upload>
          </div>
          <div className="user-info">
            <Title level={2}>{profile.fullName || profile.username}</Title>
            <Text type="secondary">{profile.email}</Text>
            <div className="user-meta">
              <Text type="secondary">
                {profile.department && `${profile.department} · `}
                {profile.position}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="profile-tabs">
        <TabPane tab={<span><UserOutlined />个人信息</span>} key="profile">
          <Card title="基本信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              initialValues={profile}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="姓名"
                    name="fullName"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="手机号" name="phone">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="部门" name="department">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="职位" name="position">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="地区" name="location">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="时区" name="timezone">
                    <Select>
                      <Option value="Asia/Shanghai">Asia/Shanghai</Option>
                      <Option value="America/New_York">America/New_York</Option>
                      <Option value="Europe/London">Europe/London</Option>
                      <Option value="Asia/Tokyo">Asia/Tokyo</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="个人简介" name="bio">
                    <TextArea rows={4} placeholder="介绍一下自己..." />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                    保存更改
                  </Button>
                  <Button icon={<LockOutlined />} onClick={() => setPasswordModalVisible(true)}>
                    修改密码
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span><SettingOutlined />偏好设置</span>} key="preferences">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="界面设置">
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>主题</Text>
                    <Text type="secondary">选择您喜欢的界面主题</Text>
                  </div>
                  <Select
                    value={preferences.theme}
                    onChange={(value) => handlePreferencesUpdate({
                      ...preferences,
                      theme: value
                    })}
                    style={{ width: 120 }}
                  >
                    <Option value="light">浅色</Option>
                    <Option value="dark">深色</Option>
                    <Option value="auto">自动</Option>
                  </Select>
                </div>
                
                <Divider />
                
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>语言</Text>
                    <Text type="secondary">选择界面语言</Text>
                  </div>
                  <Select defaultValue="zh-CN" style={{ width: 120 }}>
                    <Option value="zh-CN">中文</Option>
                    <Option value="en-US">English</Option>
                  </Select>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="通知设置" icon={<BellOutlined />}>
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>邮件通知</Text>
                    <Text type="secondary">接收重要事件的邮件通知</Text>
                  </div>
                  <Switch
                    checked={preferences.notifications.email}
                    onChange={(checked) => handlePreferencesUpdate({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        email: checked
                      }
                    })}
                  />
                </div>
                
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>浏览器通知</Text>
                    <Text type="secondary">在浏览器中显示通知</Text>
                  </div>
                  <Switch
                    checked={preferences.notifications.browser}
                    onChange={(checked) => handlePreferencesUpdate({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        browser: checked
                      }
                    })}
                  />
                </div>
                
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>移动端通知</Text>
                    <Text type="secondary">在移动设备上接收推送通知</Text>
                  </div>
                  <Switch
                    checked={preferences.notifications.mobile}
                    onChange={(checked) => handlePreferencesUpdate({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        mobile: checked
                      }
                    })}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><SecurityScanOutlined />安全设置</span>} key="security">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="账户安全">
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>双因子认证</Text>
                    <Text type="secondary">为您的账户添加额外的安全保护</Text>
                  </div>
                  <Switch
                    checked={preferences.security.twoFactorEnabled}
                    onChange={handleToggle2FA}
                  />
                </div>
                
                <Divider />
                
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>会话超时</Text>
                    <Text type="secondary">自动登出时间（分钟）</Text>
                  </div>
                  <Select
                    value={preferences.security.sessionTimeout}
                    onChange={(value) => handlePreferencesUpdate({
                      ...preferences,
                      security: {
                        ...preferences.security,
                        sessionTimeout: value
                      }
                    })}
                    style={{ width: 120 }}
                  >
                    <Option value={30}>30分钟</Option>
                    <Option value={60}>1小时</Option>
                    <Option value={120}>2小时</Option>
                    <Option value={480}>8小时</Option>
                  </Select>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="隐私设置">
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>个人资料可见性</Text>
                    <Text type="secondary">其他用户是否可以查看您的个人资料</Text>
                  </div>
                  <Switch
                    checked={preferences.privacy.profileVisible}
                    onChange={(checked) => handlePreferencesUpdate({
                      ...preferences,
                      privacy: {
                        ...preferences.privacy,
                        profileVisible: checked
                      }
                    })}
                  />
                </div>
                
                <div className="preference-item">
                  <div className="preference-label">
                    <Text strong>活动记录可见性</Text>
                    <Text type="secondary">其他用户是否可以查看您的活动记录</Text>
                  </div>
                  <Switch
                    checked={preferences.privacy.activityVisible}
                    onChange={(checked) => handlePreferencesUpdate({
                      ...preferences,
                      privacy: {
                        ...preferences.privacy,
                        activityVisible: checked
                      }
                    })}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;