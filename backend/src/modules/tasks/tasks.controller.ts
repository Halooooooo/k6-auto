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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
// @ApiTags('任务管理')
// @ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  // @ApiOperation({ summary: '创建任务' })
  // @ApiResponse({ status: 201, description: '任务创建成功' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  // @ApiOperation({ summary: '获取任务列表' })
  // @ApiResponse({ status: 200, description: '获取任务列表成功' })
  async findAll(@Query() queryDto: QueryTaskDto, @Request() req) {
    return this.tasksService.findAll(queryDto, req.user);
  }

  @Get('statistics')
  // @ApiOperation({ summary: '获取任务统计' })
  // @ApiResponse({ status: 200, description: '获取任务统计成功' })
  async getStatistics(@Request() req) {
    return this.tasksService.getStatistics(req.user);
  }

  @Get(':id')
  // @ApiOperation({ summary: '获取任务详情' })
  // @ApiResponse({ status: 200, description: '获取任务详情成功' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user);
  }

  @Put(':id')
  // @ApiOperation({ summary: '更新任务' })
  // @ApiResponse({ status: 200, description: '任务更新成功' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Delete(':id')
  // @ApiOperation({ summary: '删除任务' })
  // @ApiResponse({ status: 200, description: '任务删除成功' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tasksService.remove(id, req.user);
  }

  @Post(':id/execute')
  // @ApiOperation({ summary: '执行任务' })
  // @ApiResponse({ status: 200, description: '任务执行成功' })
  async execute(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tasksService.execute(id, req.user);
  }

  @Post(':id/stop')
  // @ApiOperation({ summary: '停止任务' })
  // @ApiResponse({ status: 200, description: '任务停止成功' })
  async stop(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tasksService.stop(id, req.user);
  }
}