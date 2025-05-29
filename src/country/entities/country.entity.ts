// src/country/entities/country.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { Province } from '../../province/entities/province.entity';

@Entity('countries') // Tabla 'countries'
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  // El nombre del país es el identificador principal junto con el código.
  @Index({ unique: true }) // Índice para asegurar unicidad
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name!: string;

  // Código ISO del país, también único si se proporciona.
  @Index({ unique: true, where: '"code" IS NOT NULL' }) // Índice único condicional
  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  code!: string | null;

  @OneToMany(() => Province, (province) => province.country)
  provinces!: Province[];
}

