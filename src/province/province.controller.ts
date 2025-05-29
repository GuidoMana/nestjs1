// src/province/province.controller.ts
import {
  Controller, Get, Post, Body, Put, Patch, Param, Delete,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus, Logger, Query
} from '@nestjs/common';
import { ProvincesService } from './province.service';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-patch-province.dto'; // Para PATCH
import { UpdatePutProvinceDto } from './dto/update-put-province.dto'; // Para PUT
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonRole } from '../person/entities/person.entity';

@Controller('provinces')
@UseGuards(JwtAuthGuard) // Proteger todos los endpoints de provincias
export class ProvincesController {
  private readonly logger = new Logger(ProvincesController.name);

  constructor(private readonly provincesService: ProvincesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN) // Solo administradores pueden crear provincias
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProvinceDto: CreateProvinceDto) {
    this.logger.log(`Recibida solicitud para crear provincia: ${JSON.stringify(createProvinceDto)}`);
    return this.provincesService.create(createProvinceDto);
  }

  @Get()
  // Cualquier usuario autenticado puede listar provincias
  findAll(@Query('loadRelations') loadRelations?: string) {
    this.logger.log('Recibida solicitud para obtener todas las provincias.');
    const shouldLoadRelations = loadRelations === 'true';
    return this.provincesService.findAll(shouldLoadRelations);
  }

  @Get('search')
  searchByName(@Query('name') name: string) {
    if (!name || name.trim() === '') {
        return [];
    }
    return this.provincesService.searchByName(name);
  }

  @Get(':id')
  // Cualquier usuario autenticado puede ver una provincia específica
  findOne(@Param('id', ParseIntPipe) id: number, @Query('loadRelations') loadRelations?: string) {
    this.logger.log(`Recibida solicitud para obtener provincia con ID: ${id}`);
    const shouldLoadRelations = loadRelations === 'true';
    return this.provincesService.findOne(id, shouldLoadRelations);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePutProvinceDto: UpdatePutProvinceDto,
  ) {
    this.logger.log(`Recibida solicitud PUT para reemplazar provincia ID: ${id}`);
    return this.provincesService.updatePut(id, updatePutProvinceDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatchProvinceDto: UpdateProvinceDto,
  ) {
    this.logger.log(`Recibida solicitud PATCH para actualizar provincia ID: ${id}`);
    return this.provincesService.updatePatch(id, updatePatchProvinceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Recibida solicitud para eliminar provincia ID: ${id}`);
    return this.provincesService.remove(id);
  }
}
