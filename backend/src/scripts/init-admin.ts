import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { RegisterDto } from '../modules/auth/dto/auth.dto';
import { UserRole } from '../modules/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const authService = app.get(AuthService);

    // 检查是否已存在管理员用户
    const existingAdmin = await userRepository.findOne({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      console.log('管理员用户已存在:', existingAdmin.username);
      console.log('用户名:', existingAdmin.username);
      console.log('邮箱:', existingAdmin.email);
      return;
    }

    // 创建默认管理员用户
    const adminData: RegisterDto = {
      username: 'admin',
      email: 'admin@k6auto.com',
      password: 'admin123456'
    };

    console.log('正在创建默认管理员用户...');
    const result = await authService.register(adminData);
    
    // 将用户角色设置为管理员
    await userRepository.update(
      { username: adminData.username },
      { role: UserRole.ADMIN }
    );

    console.log('✅ 默认管理员用户创建成功!');
    console.log('用户名: admin');
    console.log('密码: admin123456');
    console.log('邮箱: admin@k6auto.com');
    console.log('角色: 管理员');
    
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
  } finally {
    await app.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };