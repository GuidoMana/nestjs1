// src/person/person.controller.ts
import {
  Controller, Get, Post, Body, Put, Patch, Param, Delete,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus, Logger, Query, Req, BadRequestException
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePutPersonDto } from './dto/update-put-person.dto';
import { UpdatePatchPersonDto } from './dto/update-patch-person.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonRole } from './entities/person.entity';
// Importar la interfaz desde el nuevo archivo
import { PersonResponseDto } from './interfaces/person.interfaces'; 

@Controller('persons')
@UseGuards(JwtAuthGuard)
export class PersonController {
  private readonly logger = new Logger(PersonController.name);

  constructor(private readonly personService: PersonService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPersonDto: CreatePersonDto): Promise<PersonResponseDto> {
    this.logger.log(`Creando persona: ${createPersonDto.email}`);
    return this.personService.create(createPersonDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN, PersonRole.MODERATOR)
  findAll(): Promise<PersonResponseDto[]> {
    this.logger.log('Buscando todas las personas');
    return this.personService.findAll();
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN, PersonRole.MODERATOR)
  searchByName(@Query('name') name: string): Promise<PersonResponseDto[]> {
    this.logger.log(`Buscando personas por nombre: ${name}`);
    if (!name || name.trim() === '') {
      throw new BadRequestException('El parámetro de búsqueda "name" no puede estar vacío.');
    }
    return this.personService.findByName(name);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN, PersonRole.MODERATOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PersonResponseDto> {
    this.logger.log(`Buscando persona ID: ${id}`);
    return this.personService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePutPersonDto: UpdatePutPersonDto,
  ): Promise<PersonResponseDto> {
    this.logger.log(`Actualizando (PUT) persona ID: ${id}`);
    return this.personService.updatePut(id, updatePutPersonDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  updatePatch( // Nombre del método en el controlador
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatchPersonDto: UpdatePatchPersonDto,
  ): Promise<PersonResponseDto> {
    this.logger.log(`Actualizando (PATCH) persona ID: ${id}`);
    return this.personService.update(id, updatePatchPersonDto); // Llama al método 'update' del servicio
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(PersonRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    this.logger.log(`Eliminando persona ID: ${id}`);
    return this.personService.remove(id);
  }
}
