import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
// // import { ApiProperty } from '@nestjs/swagger';
import { ScriptType } from '../entities/script.entity';

export class CreateScriptDto {
  // @ApiProperty({ description: '脚本名称' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  // @ApiProperty({ description: '脚本描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  // @ApiProperty({ description: '脚本内容' })
  @IsString()
  @MinLength(1)
  content: string;
  // @ApiProperty({ description: '脚本类型', enum: ScriptType })
  @IsEnum(ScriptType)
  type: ScriptType;
  // @ApiProperty({ description: '标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  // @ApiProperty({ description: '参数配置', required: false })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
  // @ApiProperty({ description: '脚本语言', required: false })
  @IsOptional()
  @IsString()
  language?: string;
  // @ApiProperty({ description: '版本号', required: false })
  @IsOptional()
  @IsString()
  currentVersion?: string;
}

export class UpdateScriptDto {
  // @ApiProperty({ description: '脚本名称', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
  // @ApiProperty({ description: '脚本描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  // @ApiProperty({ description: '脚本内容', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
  // @ApiProperty({ description: '脚本类型', enum: ScriptType, required: false })
  @IsOptional()
  @IsEnum(ScriptType)
  type?: ScriptType;
  // @ApiProperty({ description: '标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  // @ApiProperty({ description: '参数配置', required: false })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
  // @ApiProperty({ description: '是否激活', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  // @ApiProperty({ description: '脚本语言', required: false })
  @IsOptional()
  @IsString()
  language?: string;
  // @ApiProperty({ description: '版本号', required: false })
  @IsOptional()
  @IsString()
  currentVersion?: string;
  
  // @ApiProperty({ description: '变更日志', required: false })
  @IsOptional()
  @IsString()
  changeLog?: string;
}

export class QueryScriptDto {
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
  // @ApiProperty({ description: '脚本类型', enum: ScriptType, required: false })
  @IsOptional()
  @IsEnum(ScriptType)
  type?: ScriptType;
  // @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsString()
  tag?: string;
  // @ApiProperty({ description: '作者ID', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;
}