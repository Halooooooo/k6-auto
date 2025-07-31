import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
// import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TriggerType } from '../entities/task.entity';

export class StageConfigDto {
  // @ApiProperty({ description: '阶段持续时间', example: '30s' })
  @IsString()
  duration: string;
  // @ApiProperty({ description: '目标VU数', example: 100 })
  @IsNumber()
  @Min(1)
  target: number;
}

export class TaskConfigDto {
  // @ApiProperty({ description: 'VU数量', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(10000)
  vus: number;
  // @ApiProperty({ description: '持续时间', example: '5m' })
  @IsString()
  duration: string;
  // @ApiProperty({ description: '阶段配置', required: false, type: [StageConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageConfigDto)
  stages?: StageConfigDto[];
  // @ApiProperty({ description: '性能阈值', required: false })
  @IsOptional()
  @IsObject()
  thresholds?: Record<string, string[]>;
  // @ApiProperty({ description: '环境变量', required: false })
  @IsOptional()
  @IsObject()
  env?: Record<string, string>;
  // @ApiProperty({ description: '其他选项', required: false })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class CreateTaskDto {
  // @ApiProperty({ description: '任务名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  // @ApiProperty({ description: '任务描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  // @ApiProperty({ description: '脚本ID' })
  @IsUUID()
  scriptId: string;
  // @ApiProperty({ description: 'Agent ID', required: false })
  @IsOptional()
  @IsUUID()
  agentId?: string;
  // @ApiProperty({ description: '触发类型', enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;
  // @ApiProperty({ description: '任务配置', type: TaskConfigDto })
  @ValidateNested()
  @Type(() => TaskConfigDto)
  config: TaskConfigDto;
  // @ApiProperty({ description: 'Cron表达式', required: false })
  @IsOptional()
  @IsString()
  cronExpression?: string;
  // @ApiProperty({ description: '计划执行时间', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateTaskDto {
  // @ApiProperty({ description: '任务名称', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
  // @ApiProperty({ description: '任务描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  // @ApiProperty({ description: '任务状态', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
  // @ApiProperty({ description: 'Agent ID', required: false })
  @IsOptional()
  @IsUUID()
  agentId?: string;
  // @ApiProperty({ description: '任务配置', type: TaskConfigDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  config?: TaskConfigDto;
  // @ApiProperty({ description: 'Cron表达式', required: false })
  @IsOptional()
  @IsString()
  cronExpression?: string;
  // @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
  // @ApiProperty({ description: '计划执行时间', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class QueryTaskDto {
  // @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;
  // @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
  // @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  search?: string;
  // @ApiProperty({ description: '任务状态', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
  // @ApiProperty({ description: '触发类型', enum: TriggerType, required: false })
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;
  // @ApiProperty({ description: '脚本ID', required: false })
  @IsOptional()
  @IsUUID()
  scriptId?: string;
  // @ApiProperty({ description: 'Agent ID', required: false })
  @IsOptional()
  @IsUUID()
  agentId?: string;
  // @ApiProperty({ description: '创建者ID', required: false })
  @IsOptional()
  @IsUUID()
  creatorId?: string;
}

export class ExecuteTaskDto {
  // @ApiProperty({ description: 'Agent ID', required: false })
  @IsOptional()
  @IsUUID()
  agentId?: string;
  // @ApiProperty({ description: '覆盖配置', required: false, type: TaskConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  overrideConfig?: Partial<TaskConfigDto>;
}