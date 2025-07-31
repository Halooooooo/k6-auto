import { IsString, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';

export class CreateScriptVersionDto {
  @IsString()
  version: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  changeLog?: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  scriptId: string;
}

export class UpdateScriptVersionDto {
  @IsOptional()
  @IsString()
  changeLog?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryScriptVersionDto {
  @IsOptional()
  @IsString()
  scriptId?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}