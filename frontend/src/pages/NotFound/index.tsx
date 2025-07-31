import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './index.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <div className="not-found-actions">
            <Button type="primary" onClick={handleBackHome}>
              返回首页
            </Button>
            <Button onClick={handleGoBack}>
              返回上一页
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default NotFound;