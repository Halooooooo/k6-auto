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
import { Task } from '../../tasks/entities/task.entity';
import { ScriptVersion } from './script-version.entity';

export enum ScriptType {
  LOAD_TEST = 'load_test',
  STRESS_TEST = 'stress_test',
  SPIKE_TEST = 'spike_test',
  VOLUME_TEST = 'volume_test',
  ENDURANCE_TEST = 'endurance_test',
}

@Entity('scripts')
export class Script {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    default: ScriptType.LOAD_TEST,
  })
  type: ScriptType;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column({ default: '1.0.0' })
  currentVersion: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ default: 'javascript' })
  language: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.scripts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Task, (task) => task.script)
  tasks: Task[];

  @OneToMany(() => ScriptVersion, (version) => version.script)
  versions: ScriptVersion[];
}