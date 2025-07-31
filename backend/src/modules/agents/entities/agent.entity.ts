import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ERROR = 'error',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  hostname: string;

  @Column()
  ipAddress: string;

  @Column({ default: 8080 })
  port: number;

  @Column({
    type: 'varchar',
    default: AgentStatus.OFFLINE,
  })
  status: AgentStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  capabilities: {
    maxConcurrentTasks: number;
    supportedScriptTypes: string[];
    k6Version: string;
    os: string;
    arch: string;
  };

  @Column({ type: 'json', nullable: true })
  resources: {
    cpuCores: number;
    totalMemory: number;
    availableMemory: number;
    cpuUsage: number;
    memoryUsage: number;
  };

  @Column({ nullable: true })
  lastHeartbeat: Date;

  @Column({ nullable: true })
  version: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: 0 })
  currentTasks: number;

  @Column({ default: 0 })
  totalTasksExecuted: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.agent)
  tasks: Task[];
}