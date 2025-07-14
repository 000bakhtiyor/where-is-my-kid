import { Controller, Get, Req } from '@nestjs/common';
import { AlertService } from './alert.service';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/enums/roles.enum';
import { UsersService } from 'src/users/users.service';

@Controller('alert')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private usersService: UsersService
  ) {}

  @Get('my-kids')
  @Roles(Role.Parent)
  async getMyKidsAlerts(@Req() req) {
    const kids = await this.usersService.getParentKids(req.user.id);
    const kidIds = kids.map(k => k.id);
    return this.alertService.getAlertsForParent(kidIds);
  }

}
