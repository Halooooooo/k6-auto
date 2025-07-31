import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Script } from './entities/script.entity';
import { ScriptVersion } from './entities/script-version.entity';
import { CreateScriptDto, UpdateScriptDto, QueryScriptDto } from './dto/script.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ScriptsService {
  constructor(
    @InjectRepository(Script)
    private scriptRepository: Repository<Script>,
    @InjectRepository(ScriptVersion)
    private scriptVersionRepository: Repository<ScriptVersion>,
  ) {}

  async create(createScriptDto: CreateScriptDto, user: User) {
    // 检查脚本名称是否已存在
    const existingScript = await this.scriptRepository.findOne({
      where: { name: createScriptDto.name, authorId: user.id, isActive: true },
    });

    if (existingScript) {
      throw new ConflictException('脚本名称已存在');
    }

    const script = this.scriptRepository.create({
      ...createScriptDto,
      authorId: user.id,
      currentVersion: createScriptDto.currentVersion || '1.0.0',
      language: createScriptDto.language || 'javascript',
    });

    const savedScript = await this.scriptRepository.save(script);

    // 创建初始版本
    const initialVersion = this.scriptVersionRepository.create({
      scriptId: savedScript.id,
      version: savedScript.currentVersion,
      content: savedScript.content,
      changeLog: '初始版本',
      parameters: savedScript.parameters,
      tags: savedScript.tags,
      createdById: user.id,
      isActive: true,
    });

    await this.scriptVersionRepository.save(initialVersion);

    return savedScript;
  }

  async findAll(queryDto: QueryScriptDto, user?: User) {
    const { page = 1, limit = 10, search, type, tag, authorId } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.scriptRepository
      .createQueryBuilder('script')
      .leftJoinAndSelect('script.author', 'author')
      .where('script.isActive = :isActive', { isActive: true });

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(script.name ILIKE :search OR script.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('script.type = :type', { type });
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(script.tags)', { tag });
    }

    if (authorId) {
      queryBuilder.andWhere('script.authorId = :authorId', { authorId });
    }

    // 如果是普通用户，只能看到自己的脚本
    if (user && user.role !== 'admin') {
      queryBuilder.andWhere('script.authorId = :userId', { userId: user.id });
    }

    const [scripts, total] = await queryBuilder
      .orderBy('script.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: scripts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user?: User) {
    const script = await this.scriptRepository.findOne({
      where: { id, isActive: true },
      relations: ['author'],
    });

    if (!script) {
      throw new NotFoundException('脚本不存在');
    }

    // 权限检查
    if (user && user.role !== 'admin' && script.authorId !== user.id) {
      throw new ForbiddenException('无权访问此脚本');
    }

    return script;
  }

  async update(id: string, updateScriptDto: UpdateScriptDto, user: User) {
    const script = await this.findOne(id, user);

    // 检查脚本名称是否已存在（排除当前脚本）
    if (updateScriptDto.name) {
      const existingScript = await this.scriptRepository.findOne({
        where: {
          name: updateScriptDto.name,
          authorId: user.id,
          isActive: true,
        },
      });

      if (existingScript && existingScript.id !== id) {
        throw new ConflictException('脚本名称已存在');
      }
    }

    // 如果内容发生变化，创建新版本
    if (updateScriptDto.content && updateScriptDto.content !== script.content) {
      // 生成新版本号
      const newVersion = this.generateNextVersion(script.currentVersion);
      
      // 将当前活跃版本设为非活跃
      await this.scriptVersionRepository.update(
        { scriptId: id, isActive: true },
        { isActive: false },
      );

      // 创建新版本记录
      const newVersionRecord = this.scriptVersionRepository.create({
        scriptId: id,
        version: newVersion,
        content: updateScriptDto.content,
        changeLog: updateScriptDto.changeLog || '更新脚本内容',
        parameters: updateScriptDto.parameters || script.parameters,
        tags: updateScriptDto.tags || script.tags,
        createdById: user.id,
        isActive: true,
      });

      await this.scriptVersionRepository.save(newVersionRecord);
      
      // 更新脚本的当前版本
      updateScriptDto.currentVersion = newVersion;
    }

    Object.assign(script, updateScriptDto);
    return await this.scriptRepository.save(script);
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0', 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  async remove(id: string, user: User) {
    const script = await this.findOne(id, user);
    script.isActive = false;
    await this.scriptRepository.save(script);
    return { message: '脚本删除成功' };
  }

  async getVersions(id: string, user: User) {
    const script = await this.findOne(id, user);
    
    const versions = await this.scriptVersionRepository.find({
      where: { scriptId: script.id },
      order: { version: 'DESC' },
      relations: ['createdBy'],
    });

    return versions;
  }

  async restoreVersion(id: string, versionNumber: string, user: User) {
    const currentScript = await this.findOne(id, user);
    
    const targetVersion = await this.scriptVersionRepository.findOne({
      where: {
        scriptId: currentScript.id,
        version: versionNumber,
      },
    });

    if (!targetVersion) {
      throw new NotFoundException('指定版本不存在');
    }

    // 这段代码应该被移除，因为版本管理现在通过ScriptVersion实体处理
    // 历史版本的创建应该在update方法中通过ScriptVersion处理

    // 恢复到指定版本
    currentScript.content = targetVersion.content;
    currentScript.currentVersion = this.generateNextVersion(currentScript.currentVersion);
    
    return await this.scriptRepository.save(currentScript);
  }

  async duplicate(id: string, user: User) {
    const originalScript = await this.findOne(id, user);
    
    const duplicatedScript = this.scriptRepository.create({
      ...originalScript,
      id: undefined,
      name: `${originalScript.name} (副本)`,
      authorId: user.id,
      currentVersion: '1.0.0',
      parentId: null,
    });

    return await this.scriptRepository.save(duplicatedScript);
  }

  async getStatistics(user?: User) {
    const queryBuilder = this.scriptRepository
      .createQueryBuilder('script')
      .where('script.isActive = :isActive', { isActive: true });

    if (user && user.role !== 'admin') {
      queryBuilder.andWhere('script.authorId = :userId', { userId: user.id });
    }

    const total = await queryBuilder.getCount();
    
    const typeStats = await queryBuilder
      .select('script.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('script.type')
      .getRawMany();

    const recentScripts = await queryBuilder
      .orderBy('script.createdAt', 'DESC')
      .limit(5)
      .getMany();

    return {
      total,
      typeStats,
      recentScripts,
    };
  }
}