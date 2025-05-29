// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PersonService } from '../../person/person.service'; // RUTA CORREGIDA
import { JwtPayload } from '../interfaces/jwt-payload.interface';
// PersonRole se infiere de JwtPayload

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly personsService: PersonService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      console.error('Error Crítico: La variable de entorno JWT_SECRET no está definida.');
      throw new Error('La variable de entorno JWT_SECRET no está definida. La aplicación no puede iniciar de forma segura.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.jwt,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    this.logger.debug(`Validando payload JWT para sub: ${payload.sub}`);
    // personsService.findOne ahora devuelve Omit<Person, 'password'>
    // Para verificar existencia, es suficiente.
    const person = await this.personsService.findOne(payload.sub, false); // No cargar relaciones
    if (!person) { // Si findOne devuelve null o lanza NotFoundException, el usuario no existe.
      this.logger.warn(`Validación JWT fallida: Persona con ID ${payload.sub} no encontrada.`);
      throw new UnauthorizedException('Token inválido o la persona ya no existe.');
    }
    // Lo que se retorna aquí se adjunta a request.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      // firstName: person.firstName, // Puedes añadir más campos si los necesitas
      // lastName: person.lastName,
    };
  }
}