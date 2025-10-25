import { api } from '@/lib/api';

export type Propriedade = { id: string; nome: string };

export const listarPropriedades = () =>
  api<Propriedade[]>('/propriedades');

export const criarPropriedade = (payload: Partial<Propriedade>) =>
  api<Propriedade>('/propriedades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
