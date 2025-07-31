import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScriptVersion } from './entities/script-version.entity';
import { Script } from './entities/script.entity';
import {
  CreateScriptVersionDto,
  UpdateScriptVersionDto,
  QueryScriptVersionDto,
} from './dto/script-version.dto';

@Injectable()
export class ScriptVersionService {
  constructor(
    @InjectRepository(ScriptVersion)
    private scriptVersionRepository: Repository<ScriptVersion>,
    @InjectRepository(Script)
    private scriptRepository: Repository<Script>,
  ) {}

  async create(
    createScriptVersionDto: CreateScriptVersionDto,
    userId: string,
  ): Promise<ScriptVersion> {
    const { scriptId, version, content, changeLog, parameters, tags } = createScriptVersionDto;

    // 检查脚本是否存在
    const script = await this.scriptRepository.findOne({
      where: { id: scriptId },
    });
    if (!script) {
      throw new NotFoundException('脚本不存在');
    }

    // 检查版本号是否已存在
    const existingVersion = await this.scriptVersionRepository.findOne({
      where: { scriptId, version },
    });
    if (existingVersion) {
      throw new BadRequestException('该版本号已存在');
    }

    // 将之前的活跃版本设为非活跃
    await this.scriptVersionRepository.update(
      { scriptId, isActive: true },
      { isActive: false },
    );

    // 创建新版本
    const scriptVersion = this.scriptVersionRepository.create({
      ...createScriptVersionDto,
      createdById: userId,
      isActive: true,
    });

    const savedVersion = await this.scriptVersionRepository.save(scriptVersion);

    // 更新脚本的当前版本和内容
    await this.scriptRepository.update(scriptId, {
      currentVersion: version,
      content,
      parameters,
      tags,
    });

    return savedVersion;
  }

  async findAll(query: QueryScriptVersionDto): Promise<ScriptVersion[]> {
    const { scriptId, version, isActive } = query;
    const queryBuilder = this.scriptVersionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.createdBy', 'user')
      .orderBy('version.createdAt', 'DESC');

    if (scriptId) {
      queryBuilder.andWhere('version.scriptId = :scriptId', { scriptId });
    }

    if (version) {
      queryBuilder.andWhere('version.version LIKE :version', {
        version: `%${version}%`,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('version.isActive = :isActive', { isActive });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<ScriptVersion> {
    const version = await this.scriptVersionRepository.findOne({
      where: { id },
      relations: ['script', 'createdBy'],
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    return version;
  }

  async update(
    id: string,
    updateScriptVersionDto: UpdateScriptVersionDto,
  ): Promise<ScriptVersion> {
    const version = await this.findOne(id);
    Object.assign(version, updateScriptVersionDto);
    return this.scriptVersionRepository.save(version);
  }

  async remove(id: string): Promise<void> {
    const version = await this.findOne(id);
    await this.scriptVersionRepository.remove(version);
  }

  async rollback(scriptId: string, versionId: string, userId: string): Promise<Script> {
    const version = await this.scriptVersionRepository.findOne({
      where: { id: versionId, scriptId },
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    const script = await this.scriptRepository.findOne({
      where: { id: scriptId },
    });

    if (!script) {
      throw new NotFoundException('脚本不存在');
    }

    // 创建新版本记录（基于回滚的版本）
    const newVersionNumber = this.generateNextVersion(script.currentVersion);
    await this.create(
      {
        scriptId,
        version: newVersionNumber,
        content: version.content,
        changeLog: `回滚到版本 ${version.version}`,
        parameters: version.parameters,
        tags: version.tags,
      },
      userId,
    );

    return this.scriptRepository.findOne({ where: { id: scriptId } });
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0', 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  async getVersionHistory(scriptId: string): Promise<ScriptVersion[]> {
    return this.scriptVersionRepository.find({
      where: { scriptId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async setActiveVersion(scriptId: string, versionId: string): Promise<void> {
    // 将所有版本设为非活跃
    await this.scriptVersionRepository.update(
      { scriptId },
      { isActive: false },
    );

    // 设置指定版本为活跃
    const version = await this.scriptVersionRepository.findOne({
      where: { id: versionId, scriptId },
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    await this.scriptVersionRepository.update(versionId, { isActive: true });

    // 更新脚本的当前版本和内容
    await this.scriptRepository.update(scriptId, {
      currentVersion: version.version,
      content: version.content,
      parameters: version.parameters,
      tags: version.tags,
    });
  }
}