// src/province/interfaces/province.interfaces.ts

export interface ProvinceResponseDto {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: { // Simplificación de la relación Country
    id: number;
    name: string;
  };
}