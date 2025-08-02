import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentStatus } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto/agent.dto';
import { User } from '../auth/entities/user.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createAgentDto: CreateAgentDto, userId?: string): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      status: AgentStatus.OFFLINE,
    });
    return this.agentRepository.save(agent);
  }

  async registerOrUpdate(createAgentDto: CreateAgentDto): Promise<Agent> {
    // 先查找是否存在相同hostname的Agent
    const existingAgent = await this.agentRepository.findOne({
      where: { hostname: createAgentDto.hostname }
    });

    if (existingAgent) {
      // 如果存在，更新Agent信息
      Object.assign(existingAgent, {
        ...createAgentDto,
        status: AgentStatus.ONLINE, // 重新注册时设为在线
        lastHeartbeat: new Date(),
      });
      return this.agentRepository.save(existingAgent);
    } else {
      // 如果不存在，创建新Agent
      const agent = this.agentRepository.create({
        ...createAgentDto,
        status: AgentStatus.ONLINE, // 新注册的Agent设为在线
        lastHeartbeat: new Date(),
      });
      return this.agentRepository.save(agent);
    }
  }

  async findAll(queryDto: QueryAgentDto, user?: User): Promise<{ data: Agent[]; total: number }> {
    const { page = 1, limit = 10, status, hostname } = queryDto;
    const queryBuilder = this.agentRepository.createQueryBuilder('agent');

    if (status) {
      queryBuilder.where('agent.status = :status', { status });
    }

    if (hostname) {
      queryBuilder.andWhere('agent.hostname LIKE :hostname', { hostname: `%${hostname}%` });
    }

    queryBuilder
      .orderBy('agent.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException('代理不存在');
    }
    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto, user: User): Promise<Agent> {
    const agent = await this.findOne(id, user);
    
    Object.assign(agent, updateAgentDto);
    return this.agentRepository.save(agent);
  }

  async remove(id: string, user: User): Promise<void> {
    const agent = await this.findOne(id, user);
    
    await this.agentRepository.remove(agent);
  }

  async start(id: string, user: User): Promise<Agent> {
    const agent = await this.findOne(id, user);
    
    if (agent.status === AgentStatus.ONLINE) {
      throw new ForbiddenException('代理已在运行中');
    }

    agent.status = AgentStatus.ONLINE;
    agent.lastHeartbeat = new Date();
    
    // TODO: 实际启动代理的逻辑
    
    return this.agentRepository.save(agent);
  }

  async stop(id: string, user: User): Promise<Agent> {
    const agent = await this.findOne(id, user);
    
    if (agent.status === AgentStatus.OFFLINE) {
      throw new ForbiddenException('代理未在运行中');
    }

    agent.status = AgentStatus.OFFLINE;
    
    // TODO: 实际停止代理的逻辑
    
    return this.agentRepository.save(agent);
  }

  async batchEnable(ids: string[], user: User): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.start(id, user);
        success.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async batchDisable(ids: string[], user: User): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await this.stop(id, user);
        success.push(id);
      } catch (error) {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  async getStatistics(user: User): Promise<any> {
    const queryBuilder = this.agentRepository.createQueryBuilder('agent');

    const total = await queryBuilder.getCount();
    const online = await queryBuilder.clone().where('agent.status = :status', { status: AgentStatus.ONLINE }).getCount();
    const offline = await queryBuilder.clone().where('agent.status = :status', { status: AgentStatus.OFFLINE }).getCount();
    const busy = await queryBuilder.clone().where('agent.status = :status', { status: AgentStatus.BUSY }).getCount();
    const error = await queryBuilder.clone().where('agent.status = :status', { status: AgentStatus.ERROR }).getCount();

    return {
      total,
      online,
      offline,
      busy,
      error,
    };
  }

  async updateHeartbeat(agentId: string, timestamp: string, resources?: any): Promise<{ success: boolean; message: string }> {
    // 根据agent_id查找Agent
    const agent = await this.agentRepository.findOne({
      where: { id: agentId }
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} 不存在`);
    }

    // 更新心跳时间和资源信息
    agent.lastHeartbeat = new Date();
    agent.status = AgentStatus.ONLINE;
    
    if (resources) {
      agent.resources = resources;
    }

    await this.agentRepository.save(agent);

    return {
      success: true,
      message: '心跳更新成功'
    };
  }

  async pollJobs(agentId: string): Promise<{ jobs: any[]; hasMore: boolean }> {
    // 根据agent_id查找Agent
    const agent = await this.agentRepository.findOne({
      where: { id: agentId }
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} 不存在`);
    }

    // 检查Agent是否启用且在线
    if (!agent.isEnabled || agent.status !== AgentStatus.ONLINE) {
      return {
        jobs: [],
        hasMore: false
      };
    }

    // 检查Agent当前任务数是否达到上限
    if (agent.currentTasks >= agent.capabilities?.maxConcurrentTasks) {
      return {
        jobs: [],
        hasMore: false
      };
    }

    // 查找待执行的任务
    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.script', 'script')
      .where('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.isEnabled = :enabled', { enabled: true })
      .andWhere('(task.agentId IS NULL OR task.agentId = :agentId)', { agentId: agent.id });

    // 如果Agent有标签，优先匹配有相同标签要求的任务
    if (agent.tags && agent.tags.length > 0) {
      // 这里可以根据任务的标签要求进行匹配
      // 暂时简化处理，后续可以扩展
    }

    // 限制返回的任务数量
    const maxJobs = Math.min(5, agent.capabilities?.maxConcurrentTasks - agent.currentTasks);
    const tasks = await queryBuilder
      .orderBy('task.createdAt', 'ASC')
      .limit(maxJobs)
      .getMany();

    // 将任务分配给Agent
    const jobs = [];
    for (const task of tasks) {
      // 更新任务状态和分配的Agent
      task.status = TaskStatus.RUNNING;
      task.agentId = agent.id;
      task.startedAt = new Date();
      await this.taskRepository.save(task);

      // 更新Agent的当前任务数
      agent.currentTasks += 1;
      
      // 构造返回给Agent的任务信息
      jobs.push({
        id: task.id,
        name: task.name,
        description: task.description,
        script: {
          id: task.script.id,
          name: task.script.name,
          content: task.script.content,
          type: task.script.type
        },
        config: task.config,
        triggerType: task.triggerType
      });
    }

    // 保存Agent的更新
    if (jobs.length > 0) {
      await this.agentRepository.save(agent);
    }

    return {
      jobs,
      hasMore: false // 暂时设为false，后续可以根据实际情况判断
    };
  }

  async updateJobStatus(
    jobId: string, 
    agentId: string, 
    status: string, 
    result?: any, 
    error?: string
  ): Promise<{ success: boolean; message: string }> {
    // 查找任务
    const task = await this.taskRepository.findOne({
      where: { id: jobId },
      relations: ['agent']
    });

    if (!task) {
      throw new NotFoundException(`任务 ${jobId} 不存在`);
    }

    // 验证Agent权限
    if (task.agent?.name !== agentId) {
      throw new ForbiddenException('无权限更新此任务状态');
    }

    // 更新任务状态
    const oldStatus = task.status;
    task.status = status as TaskStatus;
    
    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.completedAt = new Date();
      
      // 减少Agent的当前任务数
      if (task.agent) {
        task.agent.currentTasks = Math.max(0, task.agent.currentTasks - 1);
        task.agent.totalTasksExecuted += 1;
        await this.agentRepository.save(task.agent);
      }
    }

    if (error) {
      task.errorMessage = error;
    }

    // 这里可以保存执行结果到results表
    // 暂时简化处理
    
    await this.taskRepository.save(task);

    return {
      success: true,
      message: `任务状态已更新为 ${status}`
    };
  }

  // 定期检查Agent状态，将长时间未发送心跳的Agent标记为离线
  async checkAgentStatus(): Promise<void> {
    const offlineThreshold = new Date(Date.now() - 60000); // 1分钟未心跳则认为离线
    
    await this.agentRepository
      .createQueryBuilder()
      .update(Agent)
      .set({ status: AgentStatus.OFFLINE })
      .where('lastHeartbeat < :threshold', { threshold: offlineThreshold })
      .andWhere('status != :offline', { offline: AgentStatus.OFFLINE })
      .execute();
  }
}