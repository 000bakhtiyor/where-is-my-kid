import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/users/enums/roles.enum';
import { CreateSafeZoneDto } from './dto/create-safe-zone.dto';
import { ZonesService } from './zones.service';


@ApiTags('SafeZones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Parent)
@Controller('zones')
export class ZonesController {
    constructor(private zonesService: ZonesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new safe zone (home, school, etc.)' })
    @ApiCreatedResponse({ description: 'Zone created successfully' })
    create(@Body() dto: CreateSafeZoneDto, @Req() req) {
        return this.zonesService.create(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all safe zones for logged-in parent' })
    @ApiOkResponse({ description: 'List of zones returned' })
    getAll(@Req() req) {
        return this.zonesService.findAllForParent(req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a specific safe zone by ID' })
    @ApiParam({ name: 'id', description: 'Zone ID (uuid)' })
    @ApiOkResponse({ description: 'Zone removed successfully' })
    remove(@Param('id') id: string, @Req() req) {
        return this.zonesService.remove(id, req.user.id);
    }
}
