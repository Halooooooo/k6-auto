import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScriptVersionService } from './script-version.service';
import {
  CreateScriptVersionDto,
  UpdateScriptVersionDto,
  QueryScriptVersionDto,
} from './dto/script-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('script-versions')
@UseGuards(JwtAuthGuard)
export class ScriptVersionController {
  constructor(private readonly scriptVersionService: ScriptVersionService) {}

  @Post()
  create(@Body() createScriptVersionDto: CreateScriptVersionDto, @Request() req) {
    return this.scriptVersionService.create(createScriptVersionDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: QueryScriptVersionDto) {
    return this.scriptVersionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scriptVersionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScriptVersionDto: UpdateScriptVersionDto,
  ) {
    return this.scriptVersionService.update(id, updateScriptVersionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scriptVersionService.remove(id);
  }

  @Get('script/:scriptId/history')
  getVersionHistory(@Param('scriptId') scriptId: string) {
    return this.scriptVersionService.getVersionHistory(scriptId);
  }

  @Post('script/:scriptId/rollback/:versionId')
  rollback(
    @Param('scriptId') scriptId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.scriptVersionService.rollback(scriptId, versionId, req.user.id);
  }

  @Post('script/:scriptId/set-active/:versionId')
  setActiveVersion(
    @Param('scriptId') scriptId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.scriptVersionService.setActiveVersion(scriptId, versionId);
  }
}