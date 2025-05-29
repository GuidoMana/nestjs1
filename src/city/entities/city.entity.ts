// src/city/entities/city.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { Province } from '../../province/entities/province.entity';
import { Person } from '../../person/entities/person.entity';

@Entity('cities')
// Latitud y longitud como identificador único para la ciudad.
@Unique(['latitude', 'longitude'])
export class City {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'double precision', nullable: false })
  latitude!: number;

  @Column({ type: 'double precision', nullable: false })
  longitude!: number;

  @ManyToOne(() => Province, (province) => province.cities, { eager: false, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provinceId' })
  province!: Province;

  @Column({ type: 'int', name: 'provinceId', nullable: false })
  provinceId!: number;

  @OneToMany(() => Person, (person) => person.city)
  persons!: Person[];
}