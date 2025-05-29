// src/country/country.service.ts
import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-patch-country.dto';
import { UpdatePutCountryDto } from './dto/update-put-country.dto';

@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);

  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  private readonly defaultRelations = ['provinces'];

  async create(createCountryDto: CreateCountryDto): Promise<Country> {
    this.logger.debug(`Creando país: ${createCountryDto.name}`);
    const { name, code } = createCountryDto;

    const existingByName = await this.countryRepository.findOne({ where: { name } });
    if (existingByName) {
      this.logger.warn(`País con nombre '${name}' ya existe.`);
      throw new ConflictException(`País con nombre '${name}' ya existe.`);
    }
    if (code) {
      const existingByCode = await this.countryRepository.findOne({ where: { code } });
      if (existingByCode) {
        this.logger.warn(`País con código '${code}' ya existe.`);
        throw new ConflictException(`País con código '${code}' ya existe.`);
      }
    }

    const country = this.countryRepository.create({ name, code });
    const savedCountry = await this.countryRepository.save(country);
    this.logger.log(`País creado ID: ${savedCountry.id}`);
    return savedCountry; // Devolver la entidad sin cargar relaciones por defecto al crear
  }

  async findAll(loadRelations: boolean = false): Promise<Country[]> {
    this.logger.debug('Buscando todos los países');
    return this.countryRepository.find({ relations: loadRelations ? this.defaultRelations : [] });
  }

  async findOne(id: number, loadRelations: boolean = false): Promise<Country> {
    this.logger.debug(`Buscando país ID: ${id}`);
    const country = await this.countryRepository.findOne({
      where: { id },
      relations: loadRelations ? this.defaultRelations : [],
    });
    if (!country) {
      this.logger.warn(`País ID ${id} no encontrado.`);
      throw new NotFoundException(`País con ID ${id} no encontrado.`);
    }
    return country;
  }

  async findOneByName(name: string, loadRelations: boolean = false): Promise<Country | null> {
    this.logger.debug(`Buscando país por nombre: ${name}`);
    return this.countryRepository.findOne({
      where: { name },
      relations: loadRelations ? this.defaultRelations : [],
    });
  }

  async searchByName(term: string, loadRelations: boolean = false): Promise<Country[]> {
    this.logger.debug(`Buscando países por término: ${term}`);
    if (!term || term.trim() === "") {
      throw new BadRequestException('El término de búsqueda no puede estar vacío.');
    }
    return this.countryRepository.find({
      where: { name: ILike(`%${term}%`) },
      relations: loadRelations ? this.defaultRelations : [],
    });
  }

  async updatePut(id: number, updateDto: UpdatePutCountryDto): Promise<Country> {
    this.logger.debug(`Actualizando (PUT) país ID: ${id}`);
    const countryToUpdate = await this.findOne(id, false);
    const { name, code } = updateDto;

    if (name !== countryToUpdate.name) {
      const existing = await this.countryRepository.findOne({ where: { name, id: Not(id) } });
      if (existing) throw new ConflictException(`País con nombre '${name}' ya existe.`);
    }
    if (code && code !== countryToUpdate.code) {
      const existing = await this.countryRepository.findOne({ where: { code, id: Not(id) } });
      if (existing) throw new ConflictException(`País con código '${code}' ya existe.`);
    }

    countryToUpdate.name = name;
    countryToUpdate.code = code === undefined ? countryToUpdate.code : code;

    const updatedCountry = await this.countryRepository.save(countryToUpdate);
    this.logger.log(`País ID ${updatedCountry.id} actualizado (PUT).`);
    return updatedCountry;
  }

  async updatePatch(id: number, updateDto: UpdateCountryDto): Promise<Country> {
    this.logger.debug(`Actualizando (PATCH) país ID: ${id}`);
    const countryToUpdate = await this.countryRepository.preload({ id, ...updateDto });
    if (!countryToUpdate) {
      this.logger.warn(`País ID ${id} no encontrado para PATCH.`);
      throw new NotFoundException(`País con ID ${id} no encontrado.`);
    }

    if (updateDto.name && updateDto.name !== countryToUpdate.name) {
      const existing = await this.countryRepository.findOne({ where: { name: updateDto.name, id: Not(id) } });
      if (existing) throw new ConflictException(`País con nombre '${updateDto.name}' ya existe.`);
    }
    if (updateDto.code && updateDto.code !== countryToUpdate.code) {
      const existing = await this.countryRepository.findOne({ where: { code: updateDto.code, id: Not(id) } });
      if (existing) throw new ConflictException(`País con código '${updateDto.code}' ya existe.`);
    }

    const updatedCountry = await this.countryRepository.save(countryToUpdate);
    this.logger.log(`País ID ${updatedCountry.id} actualizado (PATCH).`);
    return updatedCountry;
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.debug(`Eliminando país ID: ${id}`);
    const country = await this.findOne(id, true); // Cargar provincias para verificar
    if (country.provinces && country.provinces.length > 0) {
      this.logger.warn(`No se puede eliminar país ID ${id}, tiene provincias asociadas.`);
      throw new ConflictException(`No se puede eliminar el país '${country.name}' porque tiene provincias asociadas.`);
    }
    await this.countryRepository.remove(country);
    this.logger.log(`País ID: ${id} eliminado.`);
    return { message: `País con ID ${id} eliminado correctamente.` };
  }
}