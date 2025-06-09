// src/country/country.controller.ts
import {
  Controller, Get, Post, Body, Put, Patch, Param, Delete,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus, Logger, Query, BadRequestException
} from '@nestjs/common';
import { CountriesService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-patch-country.dto';
import { UpdatePutCountryDto } from './dto/update-put-country.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonRole } from '../person/entities/person.entity';
import { CountryResponseDto } from './interfaces/country.interfaces';

import { PaginationDto } from '../common/dto/pagination.dto'; // NUEVO
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto'; // NUEVO

@Controller('countries')
@UseGuards(JwtAuthGuard)
export class CountriesController {
  private readonly logger = new Logger(CountriesController.name);

  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCountryDto: CreateCountryDto): Promise<CountryResponseDto> {
    this.logger.log(`Recibida solicitud para crear país: ${JSON.stringify(createCountryDto)}`);
    return this.countriesService.create(createCountryDto, false) as Promise<CountryResponseDto>;
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<CountryResponseDto>> { // MODIFICADO
    this.logger.log(`Recibida solicitud para obtener todos los países con paginación: ${JSON.stringify(paginationDto)}`);
    return this.countriesService.findAll(false, paginationDto); // MODIFICADO (loadRelations es false aquí)
  }

  @Get('search')
  async searchByName( // MODIFICADO (se añadió async)
    @Query() paginationDto: PaginationDto // NUEVO: todos los params de búsqueda van en paginationDto
  ): Promise<PaginatedResponseDto<CountryResponseDto>> { // MODIFICADO
    const name = paginationDto.name; // Obtiene 'name' del DTO de paginación
    if (!name || name.trim() === '') {
        throw new BadRequestException('El término de búsqueda "name" no puede estar vacío para esta operación.');
    }
    return this.countriesService.searchByName(name, false, paginationDto); // MODIFICADO (loadRelations es false aquí)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CountryResponseDto> {
    this.logger.log(`Recibida solicitud para obtener país con ID: ${id}`);
    return this.countriesService.findOne(id, false) as Promise<CountryResponseDto>;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePutCountryDto: UpdatePutCountryDto,
  ): Promise<CountryResponseDto> {
    this.logger.log(`Recibida solicitud PUT para reemplazar país ID: ${id}`);
    return this.countriesService.updatePut(id, updatePutCountryDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatchCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
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