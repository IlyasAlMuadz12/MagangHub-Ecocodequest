import type { Tema } from './pengaturan.ts';

export interface DataTema {
  label: string;
  latar: string;
  selA: string;
  selB: string;
  bingkai: string;
  swatch: string;
}

export const TEMA: Record<Tema, DataTema> = {
  cerah: { label: 'Cerah', latar: '#D9F0FF', selA: '#FFFFFF', selB: '#E8F5EC', bingkai: '#7FCB8F', swatch: '#CFEFFF' },
  malam: { label: 'Malam', latar: '#1B2740', selA: '#4A5F86', selB: '#3C4F75', bingkai: '#0E1730', swatch: '#1B2740' },
  hutan: { label: 'Hutan', latar: '#A9DDA0', selA: '#E3F4D8', selB: '#CDE9BC', bingkai: '#2F7D3F', swatch: '#7FCB8F' },
};

export const URUTAN_TEMA: Tema[] = ['cerah', 'malam', 'hutan'];
