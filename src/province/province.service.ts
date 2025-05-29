// src/province/province.service.ts
import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { Province } from './entities/province.entity';
import { Country } from '../country/entities/country.entity';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-patch-province.dto';
import { UpdatePutProvinceDto } from './dto/update-put-province.dto';

@Injectable()
export class ProvincesService {
  private readonly logger = new Logger(ProvincesService.name);

  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  private readonly defaultRelations = ['country', 'cities'];

  private async findCountryById(countryId: number): Promise<Country> {
    this.logger.debug(`Buscando país ID: ${countryId}`);
    const country = await this.countryRepository.findOne({ where: { id: countryId } });
    if (!country) {
      this.logger.warn(`País ID ${countryId} no encontrado.`);
      throw new NotFoundException(`País con ID ${countryId} no encontrado.`);
    }
    return country;
  }

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    this.logger.debug(`Creando provincia: ${createProvinceDto.name}, Lat: ${createProvinceDto.latitude}, Lon: ${createProvinceDto.longitude}`);
    const country = await this.findCountryById(createProvinceDto.countryId);

    const existingByCoords = await this.provinceRepository.findOne({
      where: { latitude: createProvinceDto.latitude, longitude: createProvinceDto.longitude }
    });
    if (existingByCoords) {
      this.logger.log(`Provincia en Lat: ${createProvinceDto.latitude}, Lon: ${createProvinceDto.longitude} (Nombre: ${existingByCoords.name}) ya existe. Retornando existente.`);
      return this.findOne(existingByCoords.id, true);
    }

    const existingNominal = await this.provinceRepository.findOne({
        where: { name: createProvinceDto.name, countryId: createProvinceDto.countryId }
    });
    if (existingNominal) {
        this.logger.warn(`Conflicto nominal: Provincia '${createProvinceDto.name}' ya existe en país '${country.name}' (coords difieren).`);
    }

    const province = this.provinceRepository.create({
      name: createProvinceDto.name,
      country,
      countryId: country.id,
      latitude: createProvinceDto.latitude,
      longitude: createProvinceDto.longitude,
    });

    try {
        const savedProvince = await this.provinceRepository.save(province);
        this.logger.log(`Provincia '${savedProvince.name}' creada ID: ${savedProvince.id}`);
        return this.findOne(savedProvince.id, true);
    } catch (error: any) {
        if (error.code === '23505') {
            this.logger.warn(`Conflicto BD al guardar provincia: ${error.detail}. Buscando de nuevo...`);
            const raceCondition = await this.provinceRepository.findOne({
                where: { latitude: createProvinceDto.latitude, longitude: createProvinceDto.longitude }
            });
            if (raceCondition) return this.findOne(raceCondition.id, true);
            throw new ConflictException(`Ubicación (lat/lon) para esta provincia ya existe.`);
        }
        this.logger.error(`Error al guardar provincia: ${error.message}`, error.stack);
        throw error;
    }
  }

  async findAll(loadRelations: boolean = true): Promise<Province[]> {
    this.logger.debug('Buscando todas las provincias');
    return this.provinceRepository.find({ relations: loadRelations ? this.defaultRelations : ['country'] });
  }

  async findOne(id: number, loadRelations: boolean = true): Promise<Province> {
    this.logger.debug(`Buscando provincia ID: ${id}`);
    const province = await this.provinceRepository.findOne({
      where: { id },
      relations: loadRelations ? this.defaultRelations : ['country'],
    });
    if (!province) {
      this.logger.warn(`Provincia ID ${id} no encontrada.`);
      throw new NotFoundException(`Provincia con ID ${id} no encontrada.`);
    }
    return province;
  }

  async findOneByNameAndCountryId(name: string, countryId: number, loadRelations: boolean = false): Promise<Province | null> {
    this.logger.debug(`Buscando provincia: ${name}, país ID: ${countryId}`);
    return this.provinceRepository.findOne({
      where: { name, countryId },
      relations: loadRelations ? this.defaultRelations : ['country'],
    });
  }

  async searchByName(term: string, loadRelations: boolean = false): Promise<Province[]> {
    this.logger.debug(`Buscando provincias por término: ${term}`);
    if (!term || term.trim() === "") {
      throw new BadRequestException('Término de búsqueda vacío.');
    }
    return this.provinceRepository.find({
      where: { name: ILike(`%${term}%`) },
      relations: loadRelations ? this.defaultRelations : ['country'],
    });
  }

  async updatePut(id: number, updateDto: UpdatePutProvinceDto): Promise<Province> {
    this.logger.debug(`Actualizando (PUT) provincia ID: ${id}`);
    const provinceToUpdate = await this.findOne(id, false);
    const country = await this.findCountryById(updateDto.countryId);

    if (updateDto.latitude !== provinceToUpdate.latitude || updateDto.longitude !== provinceToUpdate.longitude) {
        const existing = await this.provinceRepository.findOne({
            where: { latitude: updateDto.latitude, longitude: updateDto.longitude, id: Not(id) }
        });
        if (existing) throw new ConflictException(`Ubicación (lat/lon) ya registrada para otra provincia.`);
    }
    if (updateDto.name !== provinceToUpdate.name || updateDto.countryId !== provinceToUpdate.countryId) {
        const existing = await this.provinceRepository.findOne({
            where: { name: updateDto.name, countryId: updateDto.countryId, id: Not(id) }
        });
        if (existing) throw new ConflictException(`Provincia '${updateDto.name}' ya existe en el país.`);
    }

    provinceToUpdate.name = updateDto.name;
    provinceToUpdate.country = country;
    provinceToUpdate.countryId = country.id;
    provinceToUpdate.latitude = updateDto.latitude;
    provinceToUpdate.longitude = updateDto.longitude;

    const updated = await this.provinceRepository.save(provinceToUpdate);
    this.logger.log(`Provincia ID ${updated.id} actualizada (PUT).`);
    return this.findOne(updated.id, true);
  }

  async updatePatch(id: number, updateDto: UpdateProvinceDto): Promise<Province> {
    this.logger.debug(`Actualizando (PATCH) provincia ID: ${id}`);
    const provinceToUpdate = await this.provinceRepository.findOne({ where: {id}, relations: ['country'] });
    if (!provinceToUpdate) {
      this.logger.warn(`Provincia ID ${id} no encontrada para PATCH.`);
      throw new NotFoundException(`Provincia con ID ${id} no encontrada.`);
    }

    let nameChanged = false, countryChanged = false, coordsChanged = false;
    if (updateDto.name !== undefined) { provinceToUpdate.name = updateDto.name; nameChanged = true; }
    if (updateDto.countryId !== undefined && provinceToUpdate.countryId !== updateDto.countryId) {
      const country = await this.findCountryById(updateDto.countryId);
      provinceToUpdate.country = country;
      provinceToUpdate.countryId = country.id;
      countryChanged = true;
    }
    if (updateDto.latitude !== undefined) { provinceToUpdate.latitude = updateDto.latitude; coordsChanged = true; }
    if (updateDto.longitude !== undefined) { provinceToUpdate.longitude = updateDto.longitude; coordsChanged = true; }

    if (coordsChanged) {
        const existing = await this.provinceRepository.findOne({
            where: { latitude: provinceToUpdate.latitude, longitude: provinceToUpdate.longitude, id: Not(id) }
        });
        if (existing) throw new ConflictException(`Ubicación (lat/lon) ya registrada para otra provincia.`);
    }
    if ((nameChanged || countryChanged) && !coordsChanged) {
        const existing = await this.provinceRepository.findOne({
            where: { name: provinceToUpdate.name, countryId: provinceToUpdate.countryId, id: Not(id) }
        });
        if (existing) throw new ConflictException(`Provincia '${provinceToUpdate.name}' ya existe en el país.`);
    }
    // georefId eliminado

    const updated = await this.provinceRepository.save(provinceToUpdate);
    this.logger.log(`Provincia ID ${updated.id} actualizada (PATCH).`);
    return this.findOne(updated.id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.debug(`Eliminando provincia ID: ${id}`);
    const province = await this.findOne(id, true);
    if (province.cities && province.cities.length > 0) {
      this.logger.warn(`No se puede eliminar provincia ID ${id}, tiene ciudades asociadas.`);
      throw new ConflictException(`No se puede eliminar provincia '${province.name}', tiene ciudades asociadas.`);
    }
    await this.provinceRepository.remove(province);
    this.logger.log(`Provincia ID: ${id} eliminada.`);
    return { message: `Provincia con ID ${id} eliminada correctamente.` };
  }
}