import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  // @ApiProperty({ description: '用户名或邮箱' })
  @IsString()
  username: string;
  // @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  // @ApiProperty({ description: '用户名' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;
  // @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string;
  // @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}

export class UpdateProfileDto {
  // @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;
  // @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
  // @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ChangePasswordDto {
  // @ApiProperty({ description: '当前密码' })
  @IsString()
  currentPassword: string;
  // @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}