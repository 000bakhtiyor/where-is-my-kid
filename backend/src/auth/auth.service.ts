import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { CreateParentDto } from 'src/users/dto/create-parent.dto';
import { LoginDto } from './dto/login.dto';
import { KidLoginDto } from './dto/kid-login.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async register(createParentDto: CreateParentDto) {
    const existing = await this.usersService.findByPhone(createParentDto.phoneNumber);
    if (existing) throw new ConflictException('Phone number already in use');
    const passwordHash = await bcrypt.hash(createParentDto.password, 10);
    const parent = await this.usersService.createParent({
      ...createParentDto,
      passwordHash,
    });

    const token = this.jwtService.sign({
      sub: parent.id,
      role: parent.role,
    });

    return {
      accessToken: token,
      user: parent,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByPhone(loginDto.phoneNumber);

    if (!user) {
      throw new UnauthorizedException('Phone number not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('User has no password set');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken: token,
      user,
    };
  }


  async kidLogin(dto: KidLoginDto) {
    if (!dto.setupToken) {
      throw new UnauthorizedException('Setup token is required');
    }
    console.log('Attempting kid login with setup token:', dto.setupToken);
    const kid = await this.usersService.findByToken(dto.setupToken);
    console.log('Kid found:', kid);
    if (!kid) throw new UnauthorizedException('Invalid setup token');

    // await this.usersService.clearKidToken(kid.id);

    const token = this.jwtService.sign({
      sub: kid.id,
      role: kid.role,
    });

    return {
      accessToken: token,
      user: kid,
    };
  }
}
