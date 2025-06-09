// src/country/interfaces/country.interfaces.ts

export interface CountryResponseDto {
  id: number;
  name: string;
  code?: string | null; // Opcional, ya que tu entidad lo permite
}