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

@Controller('agents')
@UseGuards(JwtAuthGuard)
// @ApiTags('代理管理')
// @ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  // @ApiOperation({ summary: '创建代理' })
  // @ApiResponse({ status: 201, description: '代理创建成功' })
  async create(@Body() createAgentDto: CreateAgentDto, @Request() req) {
    return this.agentsService.create(createAgentDto, req.user.id);
  }

  @Get()
  // @ApiOperation({ summary: '获取代理列表' })
  // @ApiResponse({ status: 200, description: '获取代理列表成功' })
  async findAll(@Query() queryDto: QueryAgentDto, @Request() req) {
    return this.agentsService.findAll(queryDto, req.user);
  }

  @Get('statistics')
  // @ApiOperation({ summary: '获取代理统计' })
  // @ApiResponse({ status: 200, description: '获取代理统计成功' })
  async getStatistics(@Request() req) {
    return this.agentsService.getStatistics(req.user);
  }

  @Get(':id')
  // @ApiOperation({ summary: '获取代理详情' })
  // @ApiResponse({ status: 200, description: '获取代理详情成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.findOne(id, req.user);
  }

  @Put(':id')
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
  // @ApiOperation({ summary: '删除代理' })
  // @ApiResponse({ status: 200, description: '代理删除成功' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.remove(id, req.user);
  }

  @Post(':id/start')
  // @ApiOperation({ summary: '启动代理' })
  // @ApiResponse({ status: 200, description: '代理启动成功' })
  async start(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.start(id, req.user);
  }

  @Post(':id/stop')
  // @ApiOperation({ summary: '停止代理' })
  // @ApiResponse({ status: 200, description: '代理停止成功' })
  async stop(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.agentsService.stop(id, req.user);
  }
}