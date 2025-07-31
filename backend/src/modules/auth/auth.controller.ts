import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
// // import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
  // @ApiTags('用户认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // @ApiOperation({ summary: '用户注册' })
  // @ApiResponse({ status: 201, description: '注册成功' })
  // @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      data: result,
      message: '注册成功',
      timestamp: new Date().toISOString()
    };
  }

  @Post('login')
  // @ApiOperation({ summary: '用户登录' })
  // @ApiResponse({ status: 200, description: '登录成功' })
  // @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: result,
      message: '登录成功',
      timestamp: new Date().toISOString()
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '获取用户信息' })
  // @ApiResponse({ status: 200, description: '获取成功' })
  // @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req) {
    const result = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      data: result,
      message: '获取成功',
      timestamp: new Date().toISOString()
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '更新用户信息' })
  // @ApiResponse({ status: 200, description: '更新成功' })
  // @ApiResponse({ status: 401, description: '未授权' })
  // @ApiResponse({ status: 409, description: '用户名或邮箱已被使用' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '修改密码' })
  // @ApiResponse({ status: 200, description: '修改成功' })
  // @ApiResponse({ status: 401, description: '当前密码错误' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}