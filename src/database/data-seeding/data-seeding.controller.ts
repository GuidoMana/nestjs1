// src/database/data-seeding/data-seeding.controller.ts
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger, UnauthorizedException } from '@nestjs/common';
import { DataSeedingService } from './data-seeding.service';
import { TriggerSeedingDto } from './dto/trigger-seeding.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Ajusta la ruta si es necesario
import { RolesGuard } from '../../auth/guards/roles.guard';     // Ajusta la ruta si es necesario
import { Roles } from '../../auth/decorators/roles.decorator';   // Ajusta la ruta si es necesario
import { PersonRole } from '../../person/entities/person.entity'; // Ajusta la ruta si es necesario
import { ConfigService } from '@nestjs/config';

@Controller('seed') // Ruta base para operaciones de siembra
@UseGuards(JwtAuthGuard, RolesGuard) // Protege todos los endpoints de este controlador con JWT y Roles
@Roles(PersonRole.ADMIN) // Solo usuarios con rol ADMIN pueden acceder a este controlador
export class DataSeedingController {
  private readonly logger = new Logger(DataSeedingController.name);

  constructor(
    private readonly dataSeedingService: DataSeedingService,
    private readonly configService: ConfigService, // Para acceder a la contraseña del .env
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerManualSeeding(@Body() triggerSeedingDto: TriggerSeedingDto): Promise<{ message: string }> {
    this.logger.log('Intento de disparo manual de siembra de datos.');

    const seedingSecret = this.configService.get<string>('SEEDING_ADMIN_PASSWORD_SECRET');

    if (!seedingSecret) {
      this.logger.error('Error de configuración: SEEDING_ADMIN_PASSWORD_SECRET no está definida en el entorno.');
      throw new UnauthorizedException('Configuración de seguridad de siembra incompleta. Contacte al administrador.');
    }

    // Compara la contraseña ingresada con la del .env
    // NOTA: Para una seguridad aún mayor, la contraseña en .env DEBERÍA estar hasheada
    // y se usaría bcrypt.compare() aquí, pero para una "contraseña especial" (secreto)
    // que no es una contraseña de usuario, una comparación directa puede ser aceptable si el .env es seguro.
    if (triggerSeedingDto.adminPassword !== seedingSecret) {
      this.logger.warn('Intento fallido de siembra manual: Contraseña especial incorrecta.');
      throw new UnauthorizedException('Contraseña especial de administrador incorrecta.');
    }

    this.logger.log('Contraseña especial correcta. Disparando la siembra manual de la base de datos.');
    try {
      await this.dataSeedingService.seedDatabase(); // Llama al método de siembra existente
      this.logger.log('Siembra manual de datos completada con éxito.');
      return { message: 'La siembra manual de datos ha sido disparada y completada con éxito.' };
    } catch (error: any) {
      this.logger.error(`Error durante la siembra manual: ${error.message}`, error.stack);
      // Puedes lanzar una excepción más específica si quieres.
      throw new Error(`Error al ejecutar la siembra manual: ${error.message}`);
    }
  }
}