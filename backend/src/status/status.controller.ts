import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/enums/roles.enum';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Roles(Role.Kid)
  @Post('safe')
  markSafe(@Req() req) {
    return this.statusService.markSafe(req.user.id);
  }

  @Roles(Role.Parent)
  @Get('my-kids')
  getKidsStatuses(@Req() req) {
    return this.statusService.getAllStatuses(req.user.id);
  }

}
