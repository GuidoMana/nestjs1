// src/person/dto/update-patch-person.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonDto } from './create-person.dto';
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

// Hereda validadores de CreatePersonDto pero hace todos los campos opcionales
export class UpdatePatchPersonDto extends PartialType(CreatePersonDto) {
  // Campo específico para actualizar la contraseña, opcional.
  @IsOptional()
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.'})
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'La nueva contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial.',
  })
  newPassword?: string;
}