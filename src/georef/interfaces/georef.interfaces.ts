// src/georef/interfaces/georef.interfaces.ts

export interface GeorefCentroide {
  lat: number; // Latitud
  lon: number; // Longitud
}

export interface GeorefProvincia {
  id: string;                 // ID de la provincia según Georef
  nombre: string;             // Nombre de la provincia
  centroide: GeorefCentroide; // Coordenadas del centroide de la provincia
}

export interface GeorefProvinciasResponse {
  cantidad: number;
  inicio: number;
  parametros: object;
  provincias: GeorefProvincia[];
  total: number;
}

export interface GeorefMunicipio {
  id: string;                 // ID del municipio según Georef
  nombre: string;             // Nombre del municipio
  provincia: {
    id: string;               // ID de la provincia (de Georef) a la que pertenece el municipio
    nombre: string;           // Nombre de la provincia
  };
  centroide: GeorefCentroide; // Coordenadas del centroide del municipio
}

export interface GeorefMunicipiosResponse {
  cantidad: number;
  inicio: number;
  parametros: object;
  municipios: GeorefMunicipio[];
  total: number;
}