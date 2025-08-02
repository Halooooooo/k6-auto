import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      creatorId: userId,
      status: TaskStatus.PENDING,
    });
    return this.taskRepository.save(task);
  }

  async findAll(queryDto: QueryTaskDto, user: User): Promise<{ data: Task[]; total: number }> {
    const { page = 1, limit = 10, status, scriptId } = queryDto;
    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.script', 'script')
      .leftJoinAndSelect('task.results', 'results')
      .leftJoinAndSelect('task.agent', 'agent');

    // 非管理员只能查看自己的任务
    if (user.role !== 'admin') {
      queryBuilder.where('task.creatorId = :creatorId', { creatorId: user.id });
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (scriptId) {
      queryBuilder.andWhere('task.scriptId = :scriptId', { scriptId });
    }

    queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Task> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.script', 'script')
      .leftJoinAndSelect('task.results', 'results')
      .leftJoinAndSelect('task.agent', 'agent')
      .where('task.id = :id', { id });

    // 非管理员只能查看自己的任务
    if (user.role !== 'admin') {
      queryBuilder.andWhere('task.creatorId = :creatorId', { creatorId: user.id });
    }

    const task = await queryBuilder.getOne();
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    
    // 非管理员只能更新自己的任务
    if (user.role !== 'admin' && task.creatorId !== user.id) {
      throw new ForbiddenException('无权限更新此任务');
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    
    // 非管理员只能删除自己的任务
    if (user.role !== 'admin' && task.creatorId !== user.id) {
      throw new ForbiddenException('无权限删除此任务');
    }

    await this.taskRepository.remove(task);
  }

  async execute(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    
    // 非管理员只能执行自己的任务
    if (user.role !== 'admin' && task.creatorId !== user.id) {
      throw new ForbiddenException('无权限执行此任务');
    }

    if (task.status === TaskStatus.RUNNING) {
      throw new ForbiddenException('任务正在运行中');
    }

    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    
    // TODO: 实际执行K6测试的逻辑
    // 这里应该调用K6执行引擎
    
    return this.taskRepository.save(task);
  }

  async stop(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    
    // 非管理员只能停止自己的任务
    if (user.role !== 'admin' && task.creatorId !== user.id) {
      throw new ForbiddenException('无权限停止此任务');
    }

    if (task.status !== TaskStatus.RUNNING) {
      throw new ForbiddenException('任务未在运行中');
    }

    task.status = TaskStatus.CANCELLED;
    task.completedAt = new Date();
    
    // TODO: 实际停止K6测试的逻辑
    
    return this.taskRepository.save(task);
  }

  async getStatistics(user: User): Promise<any> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');
    
    // 非管理员只能查看自己的统计
    if (user.role !== 'admin') {
      queryBuilder.where('task.creatorId = :creatorId', { creatorId: user.id });
    }

    const total = await queryBuilder.getCount();
    const running = await queryBuilder.clone().andWhere('task.status = :status', { status: TaskStatus.RUNNING }).getCount();
    const completed = await queryBuilder.clone().andWhere('task.status = :status', { status: TaskStatus.COMPLETED }).getCount();
    const failed = await queryBuilder.clone().andWhere('task.status = :status', { status: TaskStatus.FAILED }).getCount();

    return {
      total,
      running,
      completed,
      failed,
    };
  }
}