import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { login } from '../../../store/slices/authSlice'
import { LoginDto } from '../../../types/auth'
import './index.css'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading } = useAppSelector(state => state.auth)
  const [form] = Form.useForm()

  const handleSubmit = async (values: LoginDto) => {
    try {
      const result = await dispatch(login(values)).unwrap()
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码')
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-overlay" />
      </div>
      
      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <img src="/logo.svg" alt="K6 Auto" className="login-logo" />
            <Title level={2} className="login-title">K6 Auto</Title>
            <Text type="secondary" className="login-subtitle">
              智能化性能测试平台
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="login-button"
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary">还没有账号？</Text>
          </Divider>

          <div className="login-footer">
            <Link to="/register" className="register-link">
              <Button type="link" block>
                立即注册
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login