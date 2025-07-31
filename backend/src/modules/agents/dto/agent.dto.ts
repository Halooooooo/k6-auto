import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
// import { ApiProperty } from '@nestjs/swagger';
import { AgentStatus } from '../entities/agent.entity';

export class CreateAgentDto {
  // @ApiProperty({ description: '代理名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  // @ApiProperty({ description: '主机名' })
  @IsString()
  hostname: string;

  // @ApiProperty({ description: 'IP地址' })
  @IsString()
  ipAddress: string;

  // @ApiProperty({ description: '端口', required: false, default: 8080 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  // @ApiProperty({ description: '代理描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // @ApiProperty({ description: '代理能力', required: false })
  @IsOptional()
  @IsObject()
  capabilities?: {
    maxConcurrentTasks: number;
    supportedScriptTypes: string[];
    k6Version: string;
    os: string;
    arch: string;
  };

  // @ApiProperty({ description: '是否启用', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateAgentDto {
  // @ApiProperty({ description: '代理名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  // @ApiProperty({ description: '主机名', required: false })
  @IsOptional()
  @IsString()
  hostname?: string;

  // @ApiProperty({ description: 'IP地址', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  // @ApiProperty({ description: '端口', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  // @ApiProperty({ description: '代理描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // @ApiProperty({ description: '代理能力', required: false })
  @IsOptional()
  @IsObject()
  capabilities?: {
    maxConcurrentTasks: number;
    supportedScriptTypes: string[];
    k6Version: string;
    os: string;
    arch: string;
  };

  // @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class QueryAgentDto {
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

  // @ApiProperty({ description: '代理状态', enum: AgentStatus, required: false })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  // @ApiProperty({ description: '主机名', required: false })
  @IsOptional()
  @IsString()
  hostname?: string;
}