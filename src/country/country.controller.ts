// src/country/country.controller.ts
import {
  Controller, Get, Post, Body, Put, Patch, Param, Delete,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus, Logger, Query
} from '@nestjs/common';
import { CountriesService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-patch-country.dto'; // Para PATCH
import { UpdatePutCountryDto } from './dto/update-put-country.dto'; // Para PUT
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonRole } from '../person/entities/person.entity';

@Controller('countries')
@UseGuards(JwtAuthGuard) // Proteger todos los endpoints de países
export class CountriesController {
  private readonly logger = new Logger(CountriesController.name);

  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN) // Solo administradores pueden crear países
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCountryDto: CreateCountryDto) {
    this.logger.log(`Recibida solicitud para crear país: ${JSON.stringify(createCountryDto)}`);
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  // Cualquier usuario autenticado puede listar países
  findAll(@Query('loadProvinces') loadProvinces?: string) { // Opcional: query param para cargar provincias
    this.logger.log('Recibida solicitud para obtener todos los países.');
    const shouldLoadProvinces = loadProvinces === 'true';
    return this.countriesService.findAll(shouldLoadProvinces);
  }

  @Get('search')
  searchByName(@Query('name') name: string) { // Recibe el término de búsqueda como query param ?name=valor
    if (!name || name.trim() === '') {
        return []; // O lanzar un BadRequestException si prefieres
    }
    return this.countriesService.searchByName(name);
  }

  @Get(':id')
  // Cualquier usuario autenticado puede ver un país específico
  findOne(@Param('id', ParseIntPipe) id: number, @Query('loadProvinces') loadProvinces?: string) {
    this.logger.log(`Recibida solicitud para obtener país con ID: ${id}`);
    const shouldLoadProvinces = loadProvinces === 'true';
    return this.countriesService.findOne(id, shouldLoadProvinces);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePutCountryDto: UpdatePutCountryDto,
  ) {
    this.logger.log(`Recibida solicitud PUT para reemplazar país ID: ${id}`);
    return this.countriesService.updatePut(id, updatePutCountryDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatchCountryDto: UpdateCountryDto,
  ) {
    this.logger.log(`Recibida solicitud PATCH para actualizar país ID: ${id}`);
    return this.countriesService.updatePatch(id, updatePatchCountryDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Recibida solicitud para eliminar país ID: ${id}`);
    return this.countriesService.remove(id);
  }
}
