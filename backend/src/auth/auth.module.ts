import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtConfigModule } from 'src/jwt-config/jwt-config.module';
import { UsersModule } from 'src/users/users.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    UsersModule,
    JwtConfigModule,    
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], 
})
export class AuthModule { }
