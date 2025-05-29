// tpi\src\country\country.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'; // Añadir NotFoundException
import { InjectRepository } from '@nestjs/typeorm'; // Añadir InjectRepository
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-patch-country.dto.ts'; // Importar UpdateCountryDto

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country) // Inyectar el repositorio
    private readonly countryRepository: Repository<Country>,
  ) {}

  async create(createCountryDto: CreateCountryDto): Promise<Country> {
    // Puedes añadir lógica aquí para verificar si el país ya existe por nombre, si es necesario
    const country = this.countryRepository.create(createCountryDto);
    return await this.countryRepository.save(country);
  }

  async findAll(): Promise<Country[]> {
    // Puedes añadir opciones para cargar relaciones si es necesario, ej: { relations: ['provinces'] }
    return this.countryRepository.find();
  }

  async findOne(id: number): Promise<Country> {
    const country = await this.countryRepository.findOne({
       where: { id },
       // relations: ['provinces'] // Descomentar si quieres cargar las provincias asociadas
    });
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    return country;
  }

  async update(id: number, updateCountryDto: UpdateCountryDto): Promise<Country> {
    // preload busca la entidad por ID y fusiona los nuevos datos del DTO
    const country = await this.countryRepository.preload({
      id: id,
      ...updateCountryDto,
    });
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    // Guarda la entidad actualizada (o la original si no hubo cambios)
    return this.countryRepository.save(country);
  }

  async remove(id: number): Promise<void> {
    const country = await this.findOne(id); // Reutiliza findOne para verificar si existe
    // O usar delete: const result = await this.countryRepository.delete(id);
    // if (result.affected === 0) throw new NotFoundException(...)
    await this.countryRepository.remove(country);
    // Alternativamente, podrías devolver el país eliminado o un mensaje.
    // Devolver void es común para operaciones DELETE exitosas (se refleja con status 204 No Content).
  }
}