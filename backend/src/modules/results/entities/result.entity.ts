import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column({ nullable: true })
  executionId: string;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number; // 执行时长（秒）

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  summary: {
    vus: number;
    vus_max: number;
    iterations: number;
    iteration_duration: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    dropped_iterations: number;
    data_received: number;
    data_sent: number;
    checks: {
      passes: number;
      fails: number;
    };
    http_reqs: {
      count: number;
      rate: number;
    };
    http_req_duration: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
      p99: number;
    };
    http_req_blocked: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_req_connecting: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_req_tls_handshaking: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_req_sending: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_req_waiting: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_req_receiving: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
  };

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  thresholds: Record<string, {
    ok: boolean;
    okRate: number;
    thresholds: {
      threshold: string;
      ok: boolean;
    }[];
  }>;

  @Column({ nullable: true })
  htmlReportPath: string;

  @Column({ nullable: true })
  jsonReportPath: string;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @Column({ type: 'json', nullable: true })
  environment: {
    agentId: string;
    agentName: string;
    k6Version: string;
    os: string;
    arch: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Task, (task) => task.results)
  @JoinColumn({ name: 'taskId' })
  task: Task;
}