import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { ApiTags, ApiOperation } from '@nestjs/swagger';
  // @ApiTags('应用信息')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // @ApiOperation({ summary: '获取应用信息' })
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Get('health')
  // @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return this.appService.healthCheck();
  }
}