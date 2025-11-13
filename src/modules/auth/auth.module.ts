import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersRepository } from './repositories/users.repository';
import { RoleRepository } from './repositories/role.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../shared/schemas/users.entity';
import { Role } from '../../shared/schemas/role.entity';
import { UserRole } from '../../shared/schemas/user-role.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth.constants';
import { JwtStrategy } from './jwt/jwt.strategy';
import { QueueModule } from '../../providers/queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Role, UserRole]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn as any },
    }),
    forwardRef(() => QueueModule),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    UsersRepository,
    RoleRepository,
    UserRoleRepository,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
