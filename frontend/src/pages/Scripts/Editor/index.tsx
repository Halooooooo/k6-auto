import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
  App,
  Row,
  Col,
  Switch,
  Tag,
  Divider,
  Modal,
  Upload,
  Tooltip
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CodeOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { scriptService } from '../../../services'
import MonacoEditor from '../../../components/MonacoEditor'
import VersionHistory from '../../../components/VersionHistory'
import { Script } from '../../../types/script'
import './index.css'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface EditorScript {
  id?: string
  name: string
  description: string
  content: string
  language: string
  type: string
  status: 'active' | 'inactive'
  tags: string[]
  currentVersion: string
  parameters?: Record<string, any>
}

const ScriptEditor: React.FC = () => {
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [script, setScript] = useState<EditorScript | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [changeLog, setChangeLog] = useState('')

  const isEdit = !!id

  useEffect(() => {
    if (isEdit) {
      fetchScript()
    } else {
      // 新建脚本的默认值
      form.setFieldsValue({
        language: 'javascript',
        type: 'load_test',
        status: true,
        currentVersion: '1.0.0',
        content: getDefaultContent('javascript')
      })
    }
  }, [id, isEdit, form])

  const fetchScript = async () => {
    try {
      setLoading(true)
      const response = await scriptService.getScript(id!)
      const scriptData = response.data
      setScript({
        ...scriptData,
        status: scriptData.isActive ? 'active' : 'inactive'
      })
      setTags(scriptData.tags || [])
      form.setFieldsValue({
        ...scriptData,
        status: scriptData.isActive
      })
    } catch (error) {
      message.error('获取脚本信息失败')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultContent = (language: string) => {
    switch (language) {
      case 'javascript':
        return `import http from 'k6/http';
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
}`
      case 'python':
        return `import requests
import time

def test_api():
    response = requests.get('https://httpbin.org/get')
    assert response.status_code == 200
    time.sleep(1)

if __name__ == '__main__':
    test_api()`
      default:
        return '// 请输入您的脚本内容'
    }
  }

  const handleLanguageChange = (language: string) => {
    const currentContent = form.getFieldValue('content')
    if (!currentContent || currentContent.trim() === '' || currentContent === getDefaultContent(form.getFieldValue('language'))) {
      form.setFieldValue('content', getDefaultContent(language))
    }
  }

  const handleSave = async (values: any) => {
    try {
      setSaving(true)
      const scriptData = {
        ...values,
        isActive: values.status !== false, // 转换为后端期望的isActive字段
        tags,
        changeLog: changeLog || '更新脚本内容'
      }
      
      // 移除前端特有的status字段
      delete scriptData.status

      if (isEdit) {
        await scriptService.updateScript(id!, scriptData)
        message.success('脚本更新成功')
        setChangeLog('')
        // 更新成功后跳转到脚本管理页面
        navigate('/scripts')
      } else {
        await scriptService.createScript(scriptData)
        message.success('脚本创建成功')
        navigate('/scripts')
      }
    } catch (error: any) {
      const errorMessage = error.message || (isEdit ? '脚本更新失败' : '脚本创建失败')
      message.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      const values = await form.validateFields()
      const scriptData = {
        ...values,
        isActive: values.status !== false,
        tags
      }
      
      // 移除前端特有的status字段
      delete scriptData.status
      
      message.loading('正在测试脚本...', 0)
      await scriptService.testScript(scriptData)
      message.destroy()
      message.success('脚本测试通过')
    } catch (error) {
      message.destroy()
      message.error('脚本测试失败')
    }
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleVersionHistoryClose = () => {
    setVersionHistoryVisible(false)
  }

  const handleVersionRestore = async (versionId: string) => {
    try {
      await scriptService.rollbackVersion(id!, versionId)
      message.success('版本回滚成功')
      setVersionHistoryVisible(false)
      fetchScript() // 重新获取脚本数据
    } catch (error) {
      message.error('版本回滚失败')
    }
  }

  const handleVersionSetActive = async (versionId: string) => {
    try {
      await scriptService.setActiveVersion(id!, versionId)
      message.success('设置活跃版本成功')
      fetchScript() // 重新获取脚本数据
    } catch (error) {
      message.error('设置活跃版本失败')
    }
  }

  const handleVersionDelete = async (versionId: string) => {
    try {
      await scriptService.deleteVersion(id!, versionId)
      message.success('删除版本成功')
    } catch (error) {
      message.error('删除版本失败')
    }
  }

  return (
    <div className="script-editor">
      <Card className="editor-header">
        <div className="header-content">
          <div className="header-left">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/scripts')}
              className="back-button"
            >
              返回
            </Button>
            <Title level={2} className="editor-title">
              {isEdit ? '编辑脚本' : '新建脚本'}
            </Title>
          </div>
          <div className="header-actions">
            <Space>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? '编辑模式' : '预览模式'}
              </Button>
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={handleTest}
              >
                测试脚本
              </Button>
              {isEdit && (
                <Button 
                  icon={<HistoryOutlined />}
                  onClick={() => setVersionHistoryVisible(true)}
                >
                  版本历史
                </Button>
              )}
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => form.submit()}
              >
                {isEdit ? '更新' : '保存'}
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <div className="editor-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card title={<span><CodeOutlined />脚本内容</span>} className="content-card">
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: '请输入脚本内容' }]}
                >
                  {previewMode ? (
                    <div className="script-preview">
                      <pre><code>{form.getFieldValue('content')}</code></pre>
                    </div>
                  ) : (
                    <MonacoEditor
                      height="500px"
                      language={form.getFieldValue('language') || 'javascript'}
                      value={form.getFieldValue('content')}
                      onChange={(value) => form.setFieldValue('content', value)}
                      theme="vs-dark"
                    />
                  )}
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title="基本信息" className="info-card">
                <Form.Item
                  name="name"
                  label="脚本名称"
                  rules={[{ required: true, message: '请输入脚本名称' }]}
                >
                  <Input placeholder="输入脚本名称" />
                </Form.Item>
                
                <Form.Item
                  name="description"
                  label="脚本描述"
                >
                  <TextArea rows={3} placeholder="输入脚本描述" />
                </Form.Item>
                
                <Form.Item
                  name="language"
                  label="脚本语言"
                  rules={[{ required: true, message: '请选择脚本语言' }]}
                >
                  <Select placeholder="选择脚本语言" onChange={handleLanguageChange}>
                    <Option value="javascript">JavaScript</Option>
                    <Option value="python">Python</Option>
                    <Option value="go">Go</Option>
                    <Option value="java">Java</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="type"
                  label="脚本类型"
                  rules={[{ required: true, message: '请选择脚本类型' }]}
                >
                  <Select placeholder="选择脚本类型">
                    <Option value="load_test">负载测试</Option>
                    <Option value="stress_test">压力测试</Option>
                    <Option value="spike_test">峰值测试</Option>
                    <Option value="volume_test">容量测试</Option>
                    <Option value="endurance_test">持久性测试</Option>
                  </Select>
                </Form.Item>
                
                {isEdit && (
                  <Form.Item
                    label="当前版本"
                  >
                    <Input value={script?.currentVersion} disabled />
                  </Form.Item>
                )}
                
                {isEdit && (
                  <Form.Item
                    label="变更日志"
                  >
                    <TextArea
                      rows={2}
                      value={changeLog}
                      onChange={(e) => setChangeLog(e.target.value)}
                      placeholder="描述本次更改的内容..."
                    />
                  </Form.Item>
                )}
                
                <Form.Item
                  name="status"
                  label="状态"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="活跃" 
                    unCheckedChildren="非活跃" 
                  />
                </Form.Item>
                
                <Divider />
                
                <div className="tags-section">
                  <label className="tags-label">标签</label>
                  <div className="tags-container">
                    {tags.map(tag => (
                      <Tag 
                        key={tag} 
                        closable 
                        onClose={() => removeTag(tag)}
                        color="blue"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <div className="add-tag">
                    <Input
                      size="small"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="添加标签"
                      suffix={
                        <Button 
                          size="small" 
                          type="link" 
                          onClick={addTag}
                          disabled={!newTag}
                        >
                          添加
                        </Button>
                      }
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
      
      {/* 版本历史组件 */}
      {script?.id && (
        <VersionHistory
          visible={versionHistoryVisible}
          onClose={handleVersionHistoryClose}
          scriptId={script.id}
          onVersionRestore={() => {
            fetchScript(); // 重新获取脚本数据
          }}
        />
      )}
    </div>
  )
}

export default ScriptEditor