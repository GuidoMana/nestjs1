// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // AuthGuard es la base para los guardias de autenticación de Passport
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { // Especifica la estrategia 'jwt' que configuramos
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Determina si la solicitud actual puede ser manejada por el endpoint.
   * Este método es llamado por NestJS antes de que el controlador o manejador de ruta sea ejecutado.
   * @param context El contexto de ejecución de la solicitud.
   * @returns true si la solicitud está autorizada, de lo contrario lanza una excepción o retorna false.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Llama al método canActivate de la clase base (AuthGuard('jwt'))
    // Este se encargará de ejecutar la lógica de la JwtStrategy.
    // this.logger.debug('JwtAuthGuard: Verificando activación...');
    return super.canActivate(context);
  }

  /**
   * Maneja el resultado de la autenticación.
   * Este método es llamado por AuthGuard después de que la estrategia (JwtStrategy) ha procesado la solicitud.
   * @param err Cualquier error ocurrido durante la autenticación.
   * @param user El objeto de usuario retornado por JwtStrategy.validate(), o false si la autenticación falló.
   * @param info Información adicional o mensaje de error de la estrategia.
   * @returns El objeto de usuario si la autenticación fue exitosa.
   * @throws UnauthorizedException si la autenticación falla.
   */
  handleRequest<TUser = any>(err: any, user: TUser, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      // this.logger.warn(`JwtAuthGuard: Autenticación fallida. Error: ${err}, Info: ${info?.message || info}`);
      // Puedes personalizar el mensaje de error o el tipo de excepción aquí.
      throw err || new UnauthorizedException(info?.message || 'No estás autorizado para acceder a este recurso.');
    }
    // this.logger.debug('JwtAuthGuard: Autenticación exitosa. Usuario adjuntado a la solicitud.');
    return user; // Si la autenticación es exitosa, 'user' se adjunta a request.user
  }
}