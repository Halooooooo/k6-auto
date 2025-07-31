import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Script } from '../../scripts/entities/script.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { TestResult } from '../../results/entities/result.entity';

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  API = 'api',
  CHAT = 'chat',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'varchar',
    default: TriggerType.MANUAL,
  })
  triggerType: TriggerType;

  @Column({ type: 'json' })
  config: {
    vus: number;
    duration: string;
    stages?: Array<{ duration: string; target: number }>;
    thresholds?: Record<string, string[]>;
    env?: Record<string, string>;
    options?: Record<string, any>;
  };

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  logs: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;

  @ManyToOne(() => Script, (script) => script.tasks)
  @JoinColumn({ name: 'scriptId' })
  script: Script;

  @Column()
  scriptId: string;

  @ManyToOne(() => Agent, (agent) => agent.tasks, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({ nullable: true })
  agentId: string;

  @OneToMany(() => TestResult, (result) => result.task)
  results: TestResult[];
}