import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from './entities/result.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(TestResult)
    private resultRepository: Repository<TestResult>,
  ) {}

  async findAll(query: any, user: User) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.task', 'task')
      .leftJoinAndSelect('task.creator', 'creator')
      .orderBy('result.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (user.role !== 'admin') {
      queryBuilder.where('creator.id = :userId', { userId: user.id });
    }

    const [results, total] = await queryBuilder.getManyAndCount();

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User) {
    const queryBuilder = this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.task', 'task')
      .leftJoinAndSelect('task.creator', 'creator')
      .where('result.id = :id', { id });

    if (user.role !== 'admin') {
      queryBuilder.andWhere('creator.id = :userId', { userId: user.id });
    }

    const result = await queryBuilder.getOne();

    if (!result) {
      throw new NotFoundException('测试结果不存在');
    }

    return result;
  }

  async remove(id: string, user: User) {
    const result = await this.findOne(id, user);
    await this.resultRepository.remove(result);
    return { message: '测试结果删除成功' };
  }
}