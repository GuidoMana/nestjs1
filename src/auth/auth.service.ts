// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PersonService } from '../person/person.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Person, PersonRole } from '../person/entities/person.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterPersonDto } from './dto/register-person.dto';
import { CreatePersonDto } from '../person/dto/create-person.dto';
import { CitiesService } from '../city/city.service'; // Importar CitiesService

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly personsService: PersonService,
    private readonly jwtService: JwtService,
    private readonly citiesService: CitiesService, // Inyectar CitiesService
  ) {}

  async login(email: string, pass: string): Promise<{ access_token: string }> {
    this.logger.debug(`Procesando login para: ${email}`);
    const person = await this.personsService.findByEmailForAuth(email);

    if (!person) {
      this.logger.warn(`Login fallido: Email no encontrado - ${email}`);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordIsValid = await bcrypt.compare(pass, person.password);
    if (!passwordIsValid) {
      this.logger.warn(`Login fallido: Contraseña incorrecta para - ${email}`);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload: JwtPayload = {
        sub: person.id,
        email: person.email,
        role: person.role,
    };
    this.logger.log(`Login exitoso para: ${email}. Generando token.`);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerPersonDto: RegisterPersonDto): Promise<{ message: string; userId?: number }> {
    this.logger.debug(`Intentando registrar nueva persona con email: ${registerPersonDto.email}`);
    const { cityName, provinceName, ...personData } = registerPersonDto;
    let cityIdToAssign: number | undefined = undefined;

    if (cityName) {
      // Buscar la ciudad por nombre y, opcionalmente, por nombre de provincia
      const city = await this.citiesService.findOneByNameAndProvinceName(cityName, provinceName);
      if (!city) {
        this.logger.warn(`Registro fallido: Ciudad '${cityName}' ${provinceName ? `en provincia '${provinceName}'` : ''} no encontrada.`);
        throw new BadRequestException(`La ciudad '${cityName}' ${provinceName ? `en la provincia '${provinceName}'` : ''} no fue encontrada. Por favor, verifique los datos o contacte al administrador si cree que debería existir.`);
      }
      cityIdToAssign = city.id;
      this.logger.log(`Ciudad encontrada para el registro: ID ${cityIdToAssign}, Nombre: ${city.name}`);
    }

    const createPersonData: CreatePersonDto = {
      firstName: personData.firstName,
      lastName: personData.lastName,
      email: personData.email,
      password: personData.password,
      birthDate: personData.birthDate,
      role: PersonRole.USER, // Asignar rol USER por defecto
      cityId: cityIdToAssign, // Asignar el ID de la ciudad encontrada, o undefined si no se proporcionó cityName
    };

    try {
      const newPersonResponse = await this.personsService.create(createPersonData);
      this.logger.log(`Persona registrada exitosamente con ID: ${newPersonResponse.id}`);
      return {
        message: 'Usuario registrado exitosamente.',
        userId: newPersonResponse.id,
      };
    } catch (error: unknown) { // Especificar 'error' como tipo 'unknown'
      if (error instanceof ConflictException) {
        this.logger.warn(`Registro fallido: ${error.message}`);
      } else if (error instanceof Error) { // Verificar si es una instancia de Error para acceder a .message y .stack
        this.logger.error(`Error durante el registro: ${error.message}`, error.stack);
      } else { // Si no es una instancia de Error, loguear el error de forma genérica
        this.logger.error('Error desconocido durante el registro.', String(error));
      }
      throw error; // Re-lanzar el error para que sea manejado por el ExceptionHandler global de NestJS
    }
  }

  async validatePersonCredentials(email: string, pass: string): Promise<Omit<Person, 'password' | 'hashPassword'> | null> {
    const person = await this.personsService.findByEmailForAuth(email);
    if (person && await bcrypt.compare(pass, person.password)) {
      const { password, hashPassword, ...result } = person; 
      return result as Omit<Person, 'password' | 'hashPassword'>;
    }
    return null;
  }
}