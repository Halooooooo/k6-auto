import React, { useState } from 'react'
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Button, theme } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'
import './index.css'

const { Header, Sider, Content } = AntdLayout

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.auth)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  // 菜单项配置
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板'
    },
    {
      key: '/scripts',
      icon: <FileTextOutlined />,
      label: '脚本管理'
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: '任务管理'
    },
    {
      key: '/agents',
      icon: <CloudServerOutlined />,
      label: 'Agent管理'
    },
    {
      key: '/results',
      icon: <BarChartOutlined />,
      label: '测试结果'
    }
  ]

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    // 在移动端点击菜单项后关闭菜单
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <AntdLayout className="app-layout">
      {/* 移动端遮罩层 */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`app-sider ${mobileMenuOpen ? 'mobile-open' : ''}`}
        width={240}
        collapsedWidth={80}
      >
        <div className="app-logo">
          <img src="/logo.svg" alt="K6 Auto" className="logo-image" />
          {!collapsed && <span className="logo-text">K6 Auto</span>}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-menu"
        />
      </Sider>
      
      <AntdLayout>
        <Header className="app-header" style={{ background: colorBgContainer }}>
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileMenuOpen(!mobileMenuOpen)
                } else {
                  setCollapsed(!collapsed)
                }
              }}
              className="trigger-btn"
            />
          </div>
          
          <div className="header-right">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="notification-btn"
            />
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="user-info">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  className="user-avatar"
                />
                <span className="user-name">{user?.username || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="app-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </AntdLayout>
    </AntdLayout>
  )
}

export default Layout