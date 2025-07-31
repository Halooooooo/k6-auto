import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'K6自动化压测平台',
      version: '1.0.0',
      description: '集成化、自动化、智能化的k6性能测试管理平台',
      author: 'K6 Auto Team',
      timestamp: new Date().toISOString(),
    };
  }

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }
}