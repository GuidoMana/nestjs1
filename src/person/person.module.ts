// src/person/person.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { PersonService } from './person.service';       // Nombre de servicio singular
import { PersonController } from './person.controller';   // Nombre de controlador singular
import { AuthModule } from '../auth/auth.module';
import { City } from '../city/entities/city.entity';   // Ruta ajustada

@Module({
  imports: [
    TypeOrmModule.forFeature([Person, City]),
    forwardRef(() => AuthModule),
  ],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService, TypeOrmModule.forFeature([Person])],
})
export class PersonsModule {} // Mantengo PersonsModule como nombre de clase si así lo tienes
