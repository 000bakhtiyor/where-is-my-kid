// src/location/location.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/enums/roles.enum';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Location')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @Roles(Role.Kid)
  @ApiOperation({ summary: 'Kid sends current location' })
  @ApiBody({ type: CreateLocationDto })
  @ApiOkResponse({ description: 'Location saved successfully' })
  async updateMyLocation(@Body() dto: CreateLocationDto, @Req() req) {
    return this.locationService.saveLocation(req.user.id, dto);
  }

  @Get('my-kids/latest')
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'Get latest locations of all your kids' })
  @ApiOkResponse({ description: 'List of locations' })
  async getMyKidsLatest(@Req() req) {
    const kids = await this.usersService.getParentKids(req.user.id);
    const kidIds = kids.map((k) => k.id);
    return this.locationService.getLatestLocationsForParent(kidIds);
  }
  
  @Get(':kidId/latest')
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'Parent fetches latest location of kid' })
  @ApiParam({ name: 'kidId', required: true, description: 'UUID of kid' })
  @ApiOkResponse({ description: 'Latest location returned' })
  async getKidLocation(@Param('kidId') kidId: string) {
    return this.locationService.getLatestLocation(kidId);
  }

}
