// src/person/interfaces/person.interfaces.ts
import { PersonRole } from '../entities/person.entity';

export interface PersonResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date | null;
  role: PersonRole;
  // La ciudad podría ser un objeto City completo o solo su ID y nombre.
  // Para evitar anidamiento excesivo en las respuestas de Persona, a menudo se simplifica.
  city?: {
    id: number;
    name: string;
  } | null;
  cityId: number | null;
}