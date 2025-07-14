import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateParentDto } from 'src/users/dto/create-parent.dto';
import { LoginDto } from './dto/login.dto';
import { KidLoginDto } from './dto/kid-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({summary: "Register new parent"})
  register(@Body() dto: CreateParentDto){
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: "Parent login" })
  logn(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('kid/login')
  @ApiOperation({ summary: "Kid login" })
  kidLogin(@Body() dto: KidLoginDto) {
    return this.authService.kidLogin(dto);
  }
}
