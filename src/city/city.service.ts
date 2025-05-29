// src/city/city.service.ts
import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, FindOptionsWhere } from 'typeorm'; // Importar FindOptionsWhere
import { City } from './entities/city.entity';
import { Province } from '../province/entities/province.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-patch-city.dto';
import { UpdatePutCityDto } from './dto/update-put-city.dto';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  private readonly defaultRelations = ['province', 'province.country'];

  private async findProvinceById(provinceId: number): Promise<Province> {
    this.logger.debug(`Buscando provincia ID: ${provinceId}`);
    const province = await this.provinceRepository.findOne({
        where: { id: provinceId },
        relations: ['country'],
      });
    if (!province) {
      this.logger.warn(`Provincia ID ${provinceId} no encontrada.`);
      throw new NotFoundException(`Provincia con ID ${provinceId} no encontrada.`);
    }
    return province;
  }

  async create(createCityDto: CreateCityDto): Promise<City> {
    this.logger.debug(`Intentando crear ciudad: ${createCityDto.name}, Lat: ${createCityDto.latitude}, Lon: ${createCityDto.longitude}`);
    const province = await this.findProvinceById(createCityDto.provinceId);

    const existingCityByCoords = await this.cityRepository.findOne({
      where: {
        latitude: createCityDto.latitude,
        longitude: createCityDto.longitude,
      }
    });

    if (existingCityByCoords) {
      this.logger.log(`Ciudad en Lat: ${createCityDto.latitude}, Lon: ${createCityDto.longitude} (Nombre: ${existingCityByCoords.name}) ya existe. Se omite creación y se retorna la existente.`);
      return this.findOne(existingCityByCoords.id, true);
    }

    const existingNominalCity = await this.cityRepository.findOne({
        where: { name: createCityDto.name, provinceId: createCityDto.provinceId }
    });
    if (existingNominalCity) {
        this.logger.warn(`Conflicto nominal: La ciudad '${createCityDto.name}' ya existe en la provincia '${province.name}' (pero con diferentes coordenadas).`);
        // throw new ConflictException(`Una ciudad llamada '${createCityDto.name}' ya existe en la provincia '${province.name}'.`);
    }

    const city = this.cityRepository.create({
      name: createCityDto.name,
      province: province,
      provinceId: province.id,
      latitude: createCityDto.latitude,
      longitude: createCityDto.longitude,
      // georefId: createCityDto.georefId || null, // georefId eliminado
    });

    try {
        const savedCity = await this.cityRepository.save(city);
        this.logger.log(`Ciudad creada ID: ${savedCity.id}, Nombre: ${savedCity.name}, Lat: ${savedCity.latitude}, Lon: ${savedCity.longitude}`);
        return this.findOne(savedCity.id, true);
    } catch (error: any) {
        if (error.code === '23505') {
            this.logger.warn(`Conflicto de BD al guardar ciudad: ${error.detail}. Intentando encontrarla...`);
            const raceConditionCity = await this.cityRepository.findOne({
                where: { latitude: createCityDto.latitude, longitude: createCityDto.longitude }
            });
            if (raceConditionCity) return this.findOne(raceConditionCity.id, true);
            throw new ConflictException(`La ubicación (lat/lon) para esta ciudad ya existe.`);
        }
        this.logger.error(`Error al guardar la ciudad: ${error.message}`, error.stack);
        throw error;
    }
  }

  async findAll(): Promise<City[]> {
    this.logger.debug('Buscando todas las ciudades');
    return this.cityRepository.find({ relations: this.defaultRelations });
  }

  async findOne(id: number, loadRelations: boolean = true): Promise<City> {
    this.logger.debug(`Buscando ciudad ID: ${id}`);
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: loadRelations ? this.defaultRelations : ['province'],
    });
    if (!city) {
      this.logger.warn(`Ciudad ID ${id} no encontrada.`);
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada.`);
    }
    return city;
  }

  async searchByName(term: string): Promise<City[]> {
    this.logger.debug(`Buscando ciudades por término: ${term}`);
    if (!term || term.trim() === "") {
      throw new BadRequestException('El término de búsqueda no puede estar vacío.');
    }
    const cities = await this.cityRepository.find({
      where: {
        name: ILike(`%${term}%`),
      },
      relations: this.defaultRelations,
    });
    this.logger.log(`Encontradas ${cities.length} ciudades para el término: ${term}`);
    return cities;
  }

  async findOneByNameAndProvinceName(cityName: string, provinceName: string): Promise<City | null> {
    this.logger.debug(`Buscando ciudad por nombre '${cityName}'${provinceName ? ` en provincia '${provinceName}'` : ''}`);
    
    const queryOptions: FindOptionsWhere<City> | FindOptionsWhere<City>[] = {
        name: cityName, // Búsqueda exacta por nombre de ciudad
    };

    if (provinceName) {
      // Si se proporciona provinceName, necesitamos hacer un join o una subconsulta.
      // La forma más directa con TypeORM es filtrar por la relación.
      return this.cityRepository.findOne({
        where: {
            name: cityName,
            province: { // Filtrar por el nombre de la provincia relacionada
                name: provinceName,
            }
        },
        relations: ['province'], // Cargar la provincia para asegurar el filtro y para la respuesta
      });
    } else {
      // Si no se proporciona provinceName, buscar solo por nombre de ciudad.
      // Esto podría devolver múltiples resultados si varias provincias tienen una ciudad con ese nombre.
      // findOne devolverá la primera que encuentre. Si necesitas manejar múltiples, usa find.
      const cities = await this.cityRepository.find({
        where: queryOptions,
        relations: ['province'], // Cargar provincia para dar más contexto
      });
      if (cities.length > 1) {
        this.logger.warn(`Múltiples ciudades encontradas con el nombre '${cityName}'. Se recomienda especificar la provincia.`);
        // Podrías lanzar un error aquí o devolver la primera. Por ahora, devolvemos la primera.
        return cities[0];
      }
      return cities.length > 0 ? cities[0] : null;
    }
  }


  async findOneByNameAndProvinceId(name: string, provinceId: number, loadRelations: boolean = false): Promise<City | null> {
    this.logger.debug(`Buscando ciudad por nombre '${name}' y provinceId '${provinceId}'`);
    const city = await this.cityRepository.findOne({
        where: {
            name: name,
            provinceId: provinceId
        },
        relations: loadRelations ? this.defaultRelations : ['province'],
    });

    if (!city) {
        this.logger.log(`Ciudad con nombre '${name}' y provinceId '${provinceId}' no encontrada.`);
        return null;
    }
    return city;
  }

  async updatePut(id: number, updateDto: UpdatePutCityDto): Promise<City> {
    this.logger.debug(`Actualizando (PUT) ciudad ID: ${id}`);
    const cityToUpdate = await this.findOne(id, false);
    const province = await this.findProvinceById(updateDto.provinceId);

    if (updateDto.latitude !== cityToUpdate.latitude || updateDto.longitude !== cityToUpdate.longitude) {
        const existingByCoords = await this.cityRepository.findOne({
            where: { latitude: updateDto.latitude, longitude: updateDto.longitude, id: Not(id) }
        });
        if (existingByCoords) {
            throw new ConflictException(`La ubicación (latitud/longitud) ya está registrada para otra ciudad.`);
        }
    }
    if (updateDto.name !== cityToUpdate.name || updateDto.provinceId !== cityToUpdate.provinceId) {
        const existingNominal = await this.cityRepository.findOne({
            where: { name: updateDto.name, provinceId: updateDto.provinceId, id: Not(id) }
        });
        if (existingNominal) {
            throw new ConflictException(`La combinación de nombre '${updateDto.name}' y provincia ya existe para otra ciudad.`);
        }
    }

    cityToUpdate.name = updateDto.name;
    cityToUpdate.province = province;
    cityToUpdate.provinceId = province.id;
    cityToUpdate.latitude = updateDto.latitude;
    cityToUpdate.longitude = updateDto.longitude;

    const updatedCity = await this.cityRepository.save(cityToUpdate);
    this.logger.log(`Ciudad ID ${updatedCity.id} actualizada (PUT).`);
    return this.findOne(updatedCity.id, true);
  }

  async updatePatch(id: number, updateDto: UpdateCityDto): Promise<City> {
    this.logger.debug(`Actualizando (PATCH) ciudad ID: ${id}`);
    const cityToUpdate = await this.cityRepository.findOne({ where: {id}, relations: ['province']});

    if (!cityToUpdate) {
      this.logger.warn(`Ciudad ID ${id} no encontrada para PATCH.`);
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada.`);
    }

    let nameChanged = false;
    if (updateDto.name !== undefined && updateDto.name !== cityToUpdate.name) {
        cityToUpdate.name = updateDto.name;
        nameChanged = true;
    }
    let provinceChanged = false;
    if (updateDto.provinceId !== undefined && cityToUpdate.provinceId !== updateDto.provinceId) {
      const province = await this.findProvinceById(updateDto.provinceId);
      cityToUpdate.province = province;
      cityToUpdate.provinceId = province.id;
      provinceChanged = true;
    }
    let coordsChanged = false;
    if (updateDto.latitude !== undefined && updateDto.latitude !== cityToUpdate.latitude) {
        cityToUpdate.latitude = updateDto.latitude;
        coordsChanged = true;
    }
    if (updateDto.longitude !== undefined && updateDto.longitude !== cityToUpdate.longitude) {
        cityToUpdate.longitude = updateDto.longitude;
        coordsChanged = true;
    }

    if (coordsChanged) {
        const existingByCoords = await this.cityRepository.findOne({
            where: { latitude: cityToUpdate.latitude, longitude: cityToUpdate.longitude, id: Not(id) }
        });
        if (existingByCoords) {
            throw new ConflictException(`La ubicación (latitud/longitud) ya está registrada para otra ciudad.`);
        }
    }
    if ((nameChanged || provinceChanged) && !coordsChanged) {
        const existingNominal = await this.cityRepository.findOne({
            where: { name: cityToUpdate.name, provinceId: cityToUpdate.provinceId, id: Not(id) }
        });
        if (existingNominal) {
            throw new ConflictException(`La combinación de nombre '${cityToUpdate.name}' y provincia ya existe para otra ciudad.`);
        }
    }

    const updatedCity = await this.cityRepository.save(cityToUpdate);
    this.logger.log(`Ciudad ID ${updatedCity.id} actualizada (PATCH).`);
    return this.findOne(updatedCity.id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.debug(`Eliminando ciudad ID: ${id}`);
    const city = await this.findOne(id, true);
    if (city.persons && city.persons.length > 0) {
        this.logger.warn(`No se puede eliminar la ciudad ID ${id} porque tiene personas asociadas.`);
        throw new ConflictException(`No se puede eliminar la ciudad '${city.name}' porque tiene personas asociadas. Reasigne las personas primero.`);
    }
    await this.cityRepository.remove(city);
    this.logger.log(`Ciudad ID: ${id} eliminada.`);
    return { message: `Ciudad con ID ${id} eliminada correctamente.` };
  }
}
