// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PersonRole } from '../../person/entities/person.entity'; // RUTA CORREGIDA

export const ROLES_KEY = 'roles';

export const Roles = (...roles: PersonRole[]) => SetMetadata(ROLES_KEY, roles);
