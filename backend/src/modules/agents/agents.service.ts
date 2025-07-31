import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentStatus } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto/agent.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async create(createAgentDto: CreateAgentDto, userId: string): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      status: AgentStatus.OFFLINE,
    });
    return this.agentRepository.save(agent);
  }

  async findAll(queryDto: QueryAgentDto, user: User): Promise<{ data: Agent[]; total: number }> {
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
}