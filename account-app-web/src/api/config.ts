export type DataMode = 'local' | 'remote';

const rawMode = String(import.meta.env.VITE_DATA_MODE ?? 'local').toLowerCase();

export const DATA_MODE: DataMode = rawMode === 'remote' ? 'remote' : 'local';
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
