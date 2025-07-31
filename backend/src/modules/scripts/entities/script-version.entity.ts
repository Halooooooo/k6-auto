import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Script } from './script.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('script_versions')
export class ScriptVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  version: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  changeLog: string;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Script, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scriptId' })
  script: Script;

  @Column()
  scriptId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @Column({ default: false })
  isActive: boolean;
}