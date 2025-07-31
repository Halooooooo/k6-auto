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
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// // import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
//   ApiConsumes,
// } from '@nestjs/swagger';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto, UpdateScriptDto, QueryScriptDto } from './dto/script.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
  // @ApiTags('脚本管理')
@Controller('scripts')
@UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @Post()
  // @ApiOperation({ summary: '创建脚本' })
  // @ApiResponse({ status: 201, description: '创建成功' })
  // @ApiResponse({ status: 409, description: '脚本名称已存在' })
  async create(@Body() createScriptDto: CreateScriptDto, @Request() req) {
    return this.scriptsService.create(createScriptDto, req.user);
  }

  @Post('upload')
  // @ApiOperation({ summary: '上传脚本文件' })
  // @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/scripts',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/javascript' || 
            file.originalname.endsWith('.js') || 
            file.originalname.endsWith('.ts')) {
          cb(null, true);
        } else {
          cb(new Error('只支持 .js 和 .ts 文件'), false);
        }
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
    }),
  )
  async uploadScript(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('请选择要上传的文件');
    }

    // 读取文件内容
    const content = fs.readFileSync(file.path, 'utf-8');
    
    // 删除临时文件
    fs.unlinkSync(file.path);

    // 创建脚本记录
    const createScriptDto: CreateScriptDto = {
      name: file.originalname.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
      content,
      type: 'load_test' as any,
      description: `从文件 ${file.originalname} 上传`,
    };

    return this.scriptsService.create(createScriptDto, req.user);
  }

  @Get()
  // @ApiOperation({ summary: '获取脚本列表' })
  // @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() queryDto: QueryScriptDto, @Request() req) {
    return this.scriptsService.findAll(queryDto, req.user);
  }

  @Get('statistics')
  // @ApiOperation({ summary: '获取脚本统计信息' })
  // @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics(@Request() req) {
    return this.scriptsService.getStatistics(req.user);
  }

  @Get(':id')
  // @ApiOperation({ summary: '获取脚本详情' })
  // @ApiResponse({ status: 200, description: '获取成功' })
  // @ApiResponse({ status: 404, description: '脚本不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.scriptsService.findOne(id, req.user);
  }

  @Put(':id')
  // @ApiOperation({ summary: '更新脚本' })
  // @ApiResponse({ status: 200, description: '更新成功' })
  // @ApiResponse({ status: 404, description: '脚本不存在' })
  // @ApiResponse({ status: 409, description: '脚本名称已存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScriptDto: UpdateScriptDto,
    @Request() req,
  ) {
    return this.scriptsService.update(id, updateScriptDto, req.user);
  }

  @Delete(':id')
  // @ApiOperation({ summary: '删除脚本' })
  // @ApiResponse({ status: 200, description: '删除成功' })
  // @ApiResponse({ status: 404, description: '脚本不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.scriptsService.remove(id, req.user);
  }

  @Get(':id/versions')
  // @ApiOperation({ summary: '获取脚本版本历史' })
  // @ApiResponse({ status: 200, description: '获取成功' })
  async getVersions(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.scriptsService.getVersions(id, req.user);
  }

  @Post(':id/versions/:version/restore')
  // @ApiOperation({ summary: '恢复到指定版本' })
  // @ApiResponse({ status: 200, description: '恢复成功' })
  async restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('version') version: string,
    @Request() req,
  ) {
    return this.scriptsService.restoreVersion(id, version, req.user);
  }

  @Post(':id/duplicate')
  // @ApiOperation({ summary: '复制脚本' })
  // @ApiResponse({ status: 201, description: '复制成功' })
  async duplicate(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.scriptsService.duplicate(id, req.user);
  }
}