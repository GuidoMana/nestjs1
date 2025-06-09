// src/person/person.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, FindManyOptions } from 'typeorm';
import { Person, PersonRole } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePatchPersonDto } from './dto/update-patch-person.dto';
import { UpdatePutPersonDto } from './dto/update-put-person.dto';
import { City } from '../city/entities/city.entity';
import { PersonResponseDto } from './interfaces/person.interfaces';
import { PaginationDto } from '../common/dto/pagination.dto'; 
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto'; 

@Injectable()
export class PersonService {
  private readonly logger = new Logger(PersonService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  private readonly defaultRelations = ['city', 'city.province', 'city.province.country'];

  private mapToResponseDto(person: Person): PersonResponseDto {
    return {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      birthDate: person.birthDate,
      role: person.role,
      city: person.city ? {
        id: person.city.id,
        name: person.city.name,
      } : null,
      cityId: person.cityId,
    };
  }

  async create(createPersonDto: CreatePersonDto): Promise<PersonResponseDto> {
    this.logger.debug(`Creando persona: ${createPersonDto.email}`);
    const { email, password, cityId, role, birthDate, firstName, lastName } = createPersonDto;

    const existingPerson = await this.personRepository.findOne({ where: { email } });
    if (existingPerson) {
      this.logger.warn(`Email '${email}' ya existe.`);
      throw new ConflictException(`El email '${email}' ya está en uso.`);
    }

    let cityEntity: City | null = null;
    if (cityId !== undefined && cityId !== null) {
      cityEntity = await this.cityRepository.findOne({ where: { id: cityId } });
      if (!cityEntity) {
        this.logger.warn(`Ciudad con ID ${cityId} no encontrada.`);
        throw new NotFoundException(`Ciudad con ID ${cityId} no encontrada.`);
      }
    }

    const newPersonEntity = this.personRepository.create({
      firstName,
      lastName,
      email,
      password,
      role: role || PersonRole.USER,
      city: cityEntity,
      cityId: cityEntity ? cityEntity.id : null,
      birthDate: birthDate ? new Date(birthDate) : null,
    });

    const savedPerson = await this.personRepository.save(newPersonEntity);
    this.logger.log(`Persona creada con ID: ${savedPerson.id}`);
    const reloadedPerson = await this.personRepository.findOne({ where: {id: savedPerson.id }, relations: this.defaultRelations });
    if (!reloadedPerson) {
        this.logger.error(`Error crítico: No se pudo recargar la persona creada con ID ${savedPerson.id}`);
        throw new NotFoundException('No se pudo recargar la persona creada.');
    }
    return this.mapToResponseDto(reloadedPerson);
  }

  // MODIFICADO: Añadido paginationDto y PaginatedResponseDto como tipo de retorno
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PersonResponseDto>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<Person> = {
      relations: this.defaultRelations,
      skip: skip,
      take: limit,
    };

    if (sortBy) {
      const allowedSortFields = ['id', 'firstName', 'lastName', 'email', 'role', 'birthDate', 'cityId'];
      if (!allowedSortFields.includes(sortBy)) {
        throw new BadRequestException(`El campo de ordenamiento '${sortBy}' no es válido.`);
      }
      findOptions.order = { [sortBy]: sortOrder || 'ASC' };
    } else {
      findOptions.order = { id: 'ASC' };
    }

    const [persons, total] = await this.personRepository.findAndCount(findOptions);

    const mappedPersons = persons.map(person => this.mapToResponseDto(person));

    return new PaginatedResponseDto<PersonResponseDto>(mappedPersons, total, page, limit);
  }

  async findOne(id: number, loadRelations: boolean = true): Promise<PersonResponseDto> {
    this.logger.debug(`Buscando persona ID: ${id}`);
    const person = await this.personRepository.findOne({
      where: { id },
      relations: loadRelations ? this.defaultRelations : (this.defaultRelations.includes('city') ? ['city'] : []),
    });
    if (!person) {
      this.logger.warn(`Persona ID ${id} no encontrada.`);
      throw new NotFoundException(`Persona con ID ${id} no encontrada.`);
    }
    return this.mapToResponseDto(person);
  }

  async findByEmailForAuth(email: string): Promise<Person | null> {
    this.logger.debug(`Buscando persona por email para auth: ${email}`);
    return this.personRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'cityId', 'birthDate']
    });
  }

  async update(id: number, updateDto: UpdatePatchPersonDto): Promise<PersonResponseDto> {
    this.logger.debug(`Actualizando (PATCH) persona ID: ${id}`);
    const { cityId, newPassword, email, birthDate, ...updateData } = updateDto;

    const personToUpdate = await this.personRepository.preload({
      id: id,
      ...updateData,
      ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
    });

    if (!personToUpdate) {
      this.logger.warn(`Persona ID ${id} no encontrada para PATCH.`);
      throw new NotFoundException(`Persona con ID ${id} no encontrada.`);
    }

    if (email && email !== personToUpdate.email) {
      const existing = await this.personRepository.findOne({ where: { email, id: Not(id) } });
      if (existing) {
        this.logger.warn(`Email '${email}' ya en uso para PATCH.`);
        throw new ConflictException(`El email '${email}' ya está en uso por otra persona.`);
      }
      personToUpdate.email = email;
    }

    if (newPassword) {
      personToUpdate.password = newPassword;
    }

    if (cityId !== undefined) {
      if (cityId === null) {
        personToUpdate.city = null;
        personToUpdate.cityId = null;
      } else {
        const cityEntity = await this.cityRepository.findOne({ where: { id: cityId } });
        if (!cityEntity) {
          this.logger.warn(`Ciudad con ID ${cityId} no encontrada.`);
          throw new NotFoundException(`Ciudad con ID ${cityId} no encontrada.`);
        }
        personToUpdate.city = cityEntity;
        personToUpdate.cityId = cityId;
      }
    }

    const updatedPersonEntity = await this.personRepository.save(personToUpdate);
    this.logger.log(`Persona ID ${updatedPersonEntity.id} actualizada (PATCH).`);
    const reloadedPerson = await this.personRepository.findOne({ where: {id: updatedPersonEntity.id }, relations: this.defaultRelations });
    if (!reloadedPerson) throw new NotFoundException('No se pudo recargar la persona actualizada.');
    return this.mapToResponseDto(reloadedPerson);
  }

  async updatePut(id: number, updateDto: UpdatePutPersonDto): Promise<PersonResponseDto> {
    this.logger.debug(`Actualizando (PUT) persona ID: ${id}`);
    let personToUpdate = await this.personRepository.findOne({ where: { id }, relations: ['city'] });
    if (!personToUpdate) {
      this.logger.warn(`Persona ID ${id} no encontrada para PUT.`);
      throw new NotFoundException(`Persona con ID ${id} no encontrada.`);
    }

    if (updateDto.email !== personToUpdate.email) {
      const existing = await this.personRepository.findOne({ where: { email: updateDto.email, id: Not(id) } });
      if (existing) {
        this.logger.warn(`Email '${updateDto.email}' ya en uso para PUT.`);
        throw new ConflictException(`El email '${updateDto.email}' ya está en uso por otra persona.`);
      }
    }

    personToUpdate.firstName = updateDto.firstName;
    personToUpdate.lastName = updateDto.lastName;
    personToUpdate.email = updateDto.email;
    personToUpdate.role = updateDto.role;
    personToUpdate.birthDate = updateDto.birthDate ? new Date(updateDto.birthDate) : null;

    if (updateDto.cityId !== undefined) {
      if (updateDto.cityId === null) {
        personToUpdate.city = null;
        personToUpdate.cityId = null;
      } else if (personToUpdate.cityId !== updateDto.cityId) {
        const cityEntity = await this.cityRepository.findOne({ where: { id: updateDto.cityId } });
        if (!cityEntity) {
          this.logger.warn(`Ciudad ID ${updateDto.cityId} no encontrada para PUT.`);
          throw new NotFoundException(`Ciudad con ID ${updateDto.cityId} no encontrada.`);
        }
        personToUpdate.city = cityEntity;
        personToUpdate.cityId = cityEntity.id;
      }
    }

    const updatedPersonEntity = await this.personRepository.save(personToUpdate);
    this.logger.log(`Persona ID ${updatedPersonEntity.id} actualizada (PUT).`);
    const reloadedPerson = await this.personRepository.findOne({ where: {id: updatedPersonEntity.id }, relations: this.defaultRelations });
    if (!reloadedPerson) throw new NotFoundException('No se pudo recargar la persona actualizada.');
    return this.mapToResponseDto(reloadedPerson);
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.debug(`Eliminando persona ID: ${id}`);
    const person = await this.personRepository.findOne({ where: {id} });
    if (!person) {
      this.logger.warn(`Persona ID ${id} no encontrada para eliminar.`);
      throw new NotFoundException(`Persona con ID ${id} no encontrada.`);
    }
    await this.personRepository.remove(person);
    this.logger.log(`Persona ID: ${id} eliminada.`);
    return { message: `Persona con ID ${id} eliminada correctamente.` };
  }

  // MODIFICADO: Añadido paginationDto y PaginatedResponseDto como tipo de retorno
  async findByName(nameQuery: string, paginationDto: PaginationDto): Promise<PaginatedResponseDto<PersonResponseDto>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<Person> = {
      where: [
        { firstName: ILike(`%${nameQuery}%`) },
        { lastName: ILike(`%${nameQuery}%`) },
      ],
      relations: this.defaultRelations,
      skip: skip,
      take: limit,
    };

    if (sortBy) {
      const allowedSortFields = ['id', 'firstName', 'lastName', 'email', 'role', 'birthDate', 'cityId'];
      if (!allowedSortFields.includes(sortBy)) {
        throw new BadRequestException(`El campo de ordenamiento '${sortBy}' no es válido.`);
      }
      findOptions.order = { [sortBy]: sortOrder || 'ASC' };
    } else {
      findOptions.order = { id: 'ASC' };
    }

    const [persons, total] = await this.personRepository.findAndCount(findOptions);

    this.logger.log(`Encontradas ${persons.length} personas para: ${nameQuery} (Total: ${total})`);
    const mappedPersons = persons.map(person => this.mapToResponseDto(person));

    return new PaginatedResponseDto<PersonResponseDto>(mappedPersons, total, page, limit);
  }
}