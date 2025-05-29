// src\city\city.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { CitiesService } from './city.service'; // Asumiendo que el servicio se llama cities.service.ts
import { CitiesController } from './city.controller'; // Asumiendo que el controlador se llama cities.controller.ts
import { Province } from '../province/entities/province.entity'; // CityService necesita ProvinceRepository

@Module({
  imports: [
    TypeOrmModule.forFeature([City, Province]), // Registra City y Province para este módulo
  ],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService], // Exporta el servicio si otros módulos lo necesitan
})
export class CitiesModule {}
