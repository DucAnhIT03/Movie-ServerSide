import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Users } from '../../../shared/schemas/users.entity';
import { RegisterDto } from '../dtos/request/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/request/login.dto';
import { UsersRepository } from '../repositories/users.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { QueueService } from '../../../providers/queue/queue.service';
import { SendVerificationOtpDto } from '../dtos/request/send-verification-otp.dto';
import { VerifyOtpRegisterDto } from '../dtos/request/verify-otp-register.dto';

interface OtpData {
  code: string;
  email: string;
  expiresAt: Date;
  registrationData?: any;
}

@Injectable()
export class AuthService {
  // In-memory storage for OTP (in production, use Redis)
  private otpStore: Map<string, OtpData> = new Map();

  constructor(
    private usersRepo: UsersRepository,
    private rolesRepo: RoleRepository,
    private userRolesRepo: UserRoleRepository,
    private jwtService: JwtService,
    private queueService: QueueService,
  ) {
    // Clean up expired OTPs every minute
    setInterval(() => {
      this.cleanupExpiredOtps();
    }, 60000);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private cleanupExpiredOtps() {
    const now = new Date();
    for (const [email, data] of this.otpStore.entries()) {
      if (data.expiresAt < now) {
        this.otpStore.delete(email);
      }
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email } as any,
    } as any);
    if (existing) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
    });

    const saved = await this.usersRepo.save(user as any);
    try {
      const role = await this.rolesRepo.findOne({
        where: { roleName: 'ROLE_USER' } as any,
      } as any);
      if (role) {
        await this.userRolesRepo.save(
          this.userRolesRepo.create({
            userId: saved.id,
            roleId: role.id,
          } as any) as any,
        );
      }
    } catch (e) {
      /* empty */
    }
    const reloaded = await this.usersRepo.findOne({
      where: { id: saved.id } as any,
      relations: ['roles', 'roles.role'],
    } as any);
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });
    const { password, ...profile } = reloaded as any;
    const roleNames = (reloaded?.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }

  async validateUserByEmail(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email } as any,
    } as any);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    const { password: pw, ...profile } = user as any;
    return profile as any;
  }

  async login(dto: LoginDto) {
    let user: Users | null = null;
    if (dto.email) {
      user = await this.usersRepo.findOne({
        where: { email: dto.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);
    } else if (dto.phone) {
      user = await this.usersRepo.findOne({
        where: { phone: dto.phone } as any,
        relations: ['roles', 'roles.role'],
      } as any);
    }
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    // Kiểm tra tài khoản có bị khóa không
    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }
    
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user as any;
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }

  async sendVerificationOtp(dto: SendVerificationOtpDto) {
    try {
      // Check if email already exists
      const existing = await this.usersRepo.findOne({
        where: { email: dto.email } as any,
      } as any);
      if (existing) {
        throw new BadRequestException('Email already in use');
      }

      // Generate OTP
      const otpCode = this.generateOtp();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 60); // 60 seconds expiry

      // Store OTP
      this.otpStore.set(dto.email, {
        code: otpCode,
        email: dto.email,
        expiresAt,
      });

      // Send OTP email via queue
      try {
        await this.queueService.enqueueVerificationOtpEmail({
          to: dto.email,
          userName: dto.email.split('@')[0],
          otpCode,
          expiresIn: 1, // 1 minute
        });
      } catch (emailError) {
        // Log error but don't fail the request - OTP is still valid
        console.error('Failed to enqueue OTP email:', emailError);
        // In production, you might want to log this to a monitoring service
      }

      return {
        message: 'Verification OTP sent to email',
        expiresIn: 60,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in sendVerificationOtp:', error);
      throw new BadRequestException('Failed to send verification OTP. Please try again.');
    }
  }

  async verifyOtpAndRegister(dto: VerifyOtpRegisterDto) {
    // Check if email already exists
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email } as any,
    } as any);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // Verify OTP
    const otpData = this.otpStore.get(dto.email);
    if (!otpData) {
      throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    }

    if (otpData.expiresAt < new Date()) {
      this.otpStore.delete(dto.email);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (otpData.code !== dto.otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    // OTP verified, proceed with registration
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
    });

    const saved = await this.usersRepo.save(user as any);
    
    // Assign ROLE_USER
    try {
      const role = await this.rolesRepo.findOne({
        where: { roleName: 'ROLE_USER' } as any,
      } as any);
      if (role) {
        await this.userRolesRepo.save(
          this.userRolesRepo.create({
            userId: saved.id,
            roleId: role.id,
          } as any) as any,
        );
      }
    } catch (e) {
      /* empty */
    }

    // Remove used OTP
    this.otpStore.delete(dto.email);

    // Reload user with relations
    const reloaded = await this.usersRepo.findOne({
      where: { id: saved.id } as any,
      relations: ['roles', 'roles.role'],
    } as any);
    
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });
    const { password, ...profile } = reloaded as any;
    const roleNames = (reloaded?.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }
}
