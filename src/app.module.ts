// src/app.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos de la aplicación principal
import { AuthModule } from './auth/auth.module';
import { PersonsModule } from './person/person.module';
import { CitiesModule } from './city/city.module';
import { ProvincesModule } from './province/province.module';
import { CountriesModule } from './country/country.module';

// Módulos para la siembra de datos
import { GeorefModule } from './georef/georef.module';
import { DataSeedingModule } from './database/data-seeding/data-seeding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: parseInt(configService.get<string>('POSTGRES_PORT', '5433')!, 10), // Asegúrate que el default '5433' sea correcto o que .env lo defina
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        autoLoadEntities: true, // Recomendado para que TypeORM descubra entidades de módulos con forFeature
        
        // --- CONFIGURACIÓN CLAVE PARA MIGRACIONES ---
        // Esta línea lee la variable TYPEORM_SYNCHRONIZE de tu archivo .env.
        // Para usar migraciones, esta variable en .env DEBE estar en 'false'.
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true', 
        // ---------------------------------------------

        logging: configService.get<string>('TYPEORM_LOGGING') === 'true',
        
        // Opcional: Especificar explícitamente la ruta a las migraciones si no usas `autoLoadEntities`
        // o si la CLI de TypeORM no las encuentra automáticamente con el data-source.ts.
        // migrations: [__dirname + '/../database/migrations/*{.ts,.js}'], // Ajusta la ruta según tu estructura
        // migrationsTableName: 'migrations_history', // Nombre personalizado para la tabla de historial de migraciones (opcional)
      }),
    }),
    AuthModule,
    PersonsModule,
    CitiesModule,
    ProvincesModule,
    CountriesModule,
    GeorefModule,
    DataSeedingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Logger, // Si es necesario globalmente
  ],
})
export class AppModule {}
