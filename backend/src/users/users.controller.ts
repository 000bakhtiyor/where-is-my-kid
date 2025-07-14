import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from './enums/roles.enum';
import { createKidDto } from './dto/create-kid.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a kid under parent' })
  createKid(@Body() dto: createKidDto, @Req() req) {
    return this.usersService.createKid({
      ...dto,
      parentId: req.user.id,
    });
  }


  @Get('me/kids')
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'List all kids of current parent' })
  getMyKids(@Req() req) {
    return this.usersService.getParentKids(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
