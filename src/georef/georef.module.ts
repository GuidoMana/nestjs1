// src/georef/georef.module.ts
import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeorefService } from './georef.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://apis.datos.gob.ar/georef/api', // URL base de la API Georef
      timeout: 15000, // Timeout aumentado para respuestas potencialmente grandes
      headers: { 'Accept': 'application/json' },
    }),
  ],
  providers: [GeorefService, Logger], // GeorefService usa Logger
  exports: [GeorefService], // Exportar GeorefService para que DataSeedingModule pueda usarlo
})
export class GeorefModule {}