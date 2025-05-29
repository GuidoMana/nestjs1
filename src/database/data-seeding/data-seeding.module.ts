// src/database/data-seeding/data-seeding.module.ts
import { Module, Logger } from '@nestjs/common';
import { DataSeedingService } from './data-seeding.service';
import { CountriesModule } from '../../country/country.module';   // Ruta ajustada
import { ProvincesModule } from '../../province/province.module'; // Ruta ajustada
import { CitiesModule } from '../../city/city.module';         // Ruta ajustada
import { GeorefModule } from '../../georef/georef.module';     // Ruta ajustada
import { ConfigModule } from '@nestjs/config'; // Importar ConfigModule si DataSeedingService usa ConfigService

@Module({
  imports: [
    ConfigModule, // Asegurar que ConfigService esté disponible
    CountriesModule,
    ProvincesModule,
    CitiesModule,
    GeorefModule,
  ],
  providers: [DataSeedingService], 
  exports: [DataSeedingService], // Opcional, si necesitas llamar al servicio desde otro lugar
})
export class DataSeedingModule {}
