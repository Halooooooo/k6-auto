import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto/agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/agents')
// @ApiTags('代理管理')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('register')
  // @ApiOperation({ summary: 'Agent注册' })
  // @ApiResponse({ status: 201, description: 'Agent注册成功' })
  async register(@Body() registerRequest: any) {
    // 转换Agent注册请求格式到CreateAgentDto
    const createAgentDto: CreateAgentDto = {
      name: registerRequest.agent_id || registerRequest.hostname,
      hostname: registerRequest.hostname,
      ipAddress: registerRequest.ip,
      port: 8080, // 默认端口
      description: `Agent ${registerRequest.agent_id}`,
      tags: registerRequest.tags ? Object.keys(registerRequest.tags) : [],
      capabilities: {
        maxConcurrentTasks: 10,
        supportedScriptTypes: ['k6', 'shell', 'python', 'docker'],
        k6Version: registerRequest.k6_version || 'unknown',
        os: registerRequest.os || 'unknown',
        arch: registerRequest.arch || 'unknown'
      },
      isEnabled: true
    };
    
    // Agent注册不需要用户认证，使用系统用户ID
    return this.agentsService.registerOrUpdate(createAgentDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '创建代理' })
  // @ApiResponse({ status: 201, description: '代理创建成功' })
  async create(@Body() createAgentDto: CreateAgentDto, @Request() req) {
    return this.agentsService.create(createAgentDto, req.user.id);
  }

  @Get()
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '获取代理列表' })
  // @ApiResponse({ status: 200, description: '获取代理列表成功' })
  async findAll(@Query() queryDto: QueryAgentDto) {
    return this.agentsService.findAll(queryDto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '获取代理统计' })
  // @ApiResponse({ status: 200, description: '获取代理统计成功' })
  async getStatistics(@Request() req) {
    return this.agentsService.getStatistics(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '获取代理详情' })
  // @ApiResponse({ status: 200, description: '获取代理详情成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.findOne(id, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '更新代理' })
  // @ApiResponse({ status: 200, description: '代理更新成功' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @Request() req,
  ) {
    return this.agentsService.update(id, updateAgentDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '删除代理' })
  // @ApiResponse({ status: 200, description: '代理删除成功' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.remove(id, req.user);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '启动代理' })
  // @ApiResponse({ status: 200, description: '代理启动成功' })
  async start(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.start(id, req.user);
  }

  @Post(':id/stop')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '停止代理' })
  // @ApiResponse({ status: 200, description: '代理停止成功' })
  async stop(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.stop(id, req.user);
  }

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '启用代理' })
  // @ApiResponse({ status: 200, description: '代理启用成功' })
  async enable(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.start(id, req.user);
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '禁用代理' })
  // @ApiResponse({ status: 200, description: '代理禁用成功' })
  async disable(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.stop(id, req.user);
  }

  @Post('batch/enable')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '批量启用代理' })
  // @ApiResponse({ status: 200, description: '批量启用成功' })
  async batchEnable(@Body() body: { ids: string[] }, @Request() req) {
    return this.agentsService.batchEnable(body.ids, req.user);
  }

  @Post('batch/disable')
  @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: '批量禁用代理' })
  // @ApiResponse({ status: 200, description: '批量禁用成功' })
  async batchDisable(@Body() body: { ids: string[] }, @Request() req) {
    return this.agentsService.batchDisable(body.ids, req.user);
  }

  @Post('heartbeat')
  // @ApiOperation({ summary: 'Agent心跳' })
  // @ApiResponse({ status: 200, description: '心跳成功' })
  async heartbeat(@Body() heartbeatData: any) {
    const { agent_id, timestamp, resources } = heartbeatData;
    return this.agentsService.updateHeartbeat(agent_id, timestamp, resources);
  }

  @Get('jobs/poll')
  // @ApiOperation({ summary: 'Agent轮询任务' })
  // @ApiResponse({ status: 200, description: '轮询成功' })
  async pollJobs(@Query('agent_id') agentId: string) {
    return this.agentsService.pollJobs(agentId);
  }

  @Post('jobs/:jobId/status')
  // @ApiOperation({ summary: 'Agent更新任务状态' })
  // @ApiResponse({ status: 200, description: '状态更新成功' })
  async updateJobStatus(
    @Param('jobId') jobId: string,
    @Body() statusData: any
  ) {
    const { agent_id, status, result, error } = statusData;
    return this.agentsService.updateJobStatus(jobId, agent_id, status, result, error);
  }
}