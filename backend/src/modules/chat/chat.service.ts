import { Injectable } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ChatService {
  async processMessage(message: string, user: User) {
    // 这里可以集成AI聊天功能
    // 目前返回一个简单的响应
    return {
      message: `你好 ${user.username}，我收到了你的消息：${message}`,
      timestamp: new Date(),
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}