// src/city/city.controller.ts
import {
  Controller, Get, Post, Body, Put, Patch, Param, Delete,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus, Logger, Query
} from '@nestjs/common';
import { CitiesService } from './city.service'; // Nombre del servicio singular como lo tienes
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-patch-city.dto'; // DTO para PATCH
import { UpdatePutCityDto } from './dto/update-put-city.dto';   // DTO para PUT
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';     // Ajustar ruta si es necesario
import { RolesGuard } from '../auth/guards/roles.guard';         // Ajustar ruta si es necesario
import { Roles } from '../auth/decorators/roles.decorator';       // Ajustar ruta si es necesario
import { PersonRole } from '../person/entities/person.entity'; // Ajustar ruta si es necesario

@Controller('city') // Ruta pluralizada
@UseGuards(JwtAuthGuard) // Proteger todos los endpoints de este controlador con autenticación JWT
export class CitiesController { // Nombre de clase pluralizado
  private readonly logger = new Logger(CitiesController.name);

  constructor(private readonly citiesService: CitiesService) {} // Nombre del servicio singular

  @Post()
  @UseGuards(RolesGuard) // Aplicar guardia de roles
  @Roles(PersonRole.ADMIN) // Solo usuarios con rol ADMIN pueden acceder
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCityDto: CreateCityDto) {
    this.logger.log(`Recibida solicitud para crear ciudad: ${JSON.stringify(createCityDto)}`);
    return this.citiesService.create(createCityDto);
  }

  @Get()
  findAll() {
    this.logger.log('Recibida solicitud para obtener todas las ciudades.');
    return this.citiesService.findAll();
  }

  @Get('search')
  searchByName(@Query('name') name: string) {
    if (!name || name.trim() === '') {
        return [];
    }
    return this.citiesService.searchByName(name);
  }
  
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Recibida solicitud para obtener ciudad con ID: ${id}`);
    return this.citiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePutCityDto: UpdatePutCityDto,
  ) {
    this.logger.log(`Recibida solicitud PUT para reemplazar ciudad ID: ${id}`);
    return this.citiesService.updatePut(id, updatePutCityDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatchCityDto: UpdateCityDto, // Usar UpdateCityDto (que es PartialType de CreateCityDto)
  ) {
    this.logger.log(`Recibida solicitud PATCH para actualizar ciudad ID: ${id}`);
    return this.citiesService.updatePatch(id, updatePatchCityDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.OK) // O HttpStatus.NO_CONTENT (204) si no se devuelve cuerpo
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Recibida solicitud para eliminar ciudad ID: ${id}`);
    return this.citiesService.remove(id);
  }
}