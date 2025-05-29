// src/countries/country.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { CountriesService } from './country.service';
import { CountriesController } from './country.controller';
// No necesita importar Province o City aquí a menos que el servicio los use directamente,
// lo cual no es el caso para un CRUD simple de Country.

@Module({
  imports: [
    TypeOrmModule.forFeature([Country]), // Registra la entidad Country para este módulo
  ],
  controllers: [CountriesController], // Controlador para las rutas de países
  providers: [CountriesService], // Servicio con la lógica de negocio para países
  exports: [CountriesService], // Exporta el servicio si otros módulos lo necesitan
})
export class CountriesModule {}
