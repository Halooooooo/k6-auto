import React from 'react'
import { Spin } from 'antd'
import './index.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  spinning?: boolean
  children?: React.ReactNode
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  tip = '加载中...',
  spinning = true,
  children
}) => {
  if (children) {
    return (
      <Spin size={size} tip={tip} spinning={spinning}>
        {children}
      </Spin>
    )
  }

  return (
    <div className="loading-spinner-container">
      <Spin size={size} tip={tip} />
    </div>
  )
}

export default LoadingSpinner