import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/request/register.dto';
import { LoginDto } from '../dtos/request/login.dto';
import { SendVerificationOtpDto } from '../dtos/request/send-verification-otp.dto';
import { VerifyOtpRegisterDto } from '../dtos/request/verify-otp-register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới với email, số điện thoại và mật khẩu'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Nguyen',
          lastName: 'Van A'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email already in use',
        error: 'Bad Request'
      }
    }
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      basic: {
        summary: 'Basic registration',
        value: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@example.com',
          phone: '0912345678',
          password: 'P@ssw0rd',
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  @ApiOperation({ 
    summary: 'Đăng nhập (email hoặc số điện thoại)',
    description: 'Đăng nhập bằng email hoặc số điện thoại kèm mật khẩu. Trả về JWT token để sử dụng cho các API cần authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: { 
      example: { 
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzODAwMDAwMCwiZXhwIjoxNjM4NjA0ODAwfQ...'
      } 
    } 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Thông tin đăng nhập không đúng',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      emailLogin: {
        summary: 'Login with email',
        value: { email: 'user@example.com', password: 'P@ssw0rd' },
      },
      phoneLogin: {
        summary: 'Login with phone (VN)',
        value: { phone: '0912345678', password: 'P@ssw0rd' },
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('send-verification-otp')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Gửi mã xác thực OTP qua email',
    description: 'Gửi mã OTP 6 chữ số đến email để xác thực đăng ký. Mã có hiệu lực trong 60 giây.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP đã được gửi thành công',
    schema: {
      example: {
        message: 'Verification OTP sent to email',
        expiresIn: 60,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email đã tồn tại hoặc không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email already in use',
        error: 'Bad Request',
      },
    },
  })
  @ApiBody({
    type: SendVerificationOtpDto,
    examples: {
      basic: {
        summary: 'Send OTP',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  async sendVerificationOtp(@Body() dto: SendVerificationOtpDto) {
    return this.authService.sendVerificationOtp(dto);
  }

  @Post('verify-otp-register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Xác thực OTP và hoàn tất đăng ký',
    description: 'Xác thực mã OTP và tạo tài khoản người dùng mới. OTP phải còn hiệu lực (trong vòng 60 giây).',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Nguyen',
          lastName: 'Van A',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'OTP không đúng, đã hết hạn, hoặc dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid OTP code.',
        error: 'Bad Request',
      },
    },
  })
  @ApiBody({
    type: VerifyOtpRegisterDto,
    examples: {
      basic: {
        summary: 'Verify OTP and Register',
        value: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@example.com',
          phone: '0912345678',
          password: 'P@ssw0rd',
          otp: '123456',
        },
      },
    },
  })
  async verifyOtpAndRegister(@Body() dto: VerifyOtpRegisterDto) {
    return this.authService.verifyOtpAndRegister(dto);
  }
}
