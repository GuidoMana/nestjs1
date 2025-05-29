// src/auth/interfaces/jwt-payload.interface.ts
import { PersonRole } from "../../person/entities/person.entity"; // RUTA CORREGIDA

export interface JwtPayload {
  sub: number;
  email: string;
  role: PersonRole;
  // Otros campos opcionales
  // firstName?: string;
  // lastName?: string;
}