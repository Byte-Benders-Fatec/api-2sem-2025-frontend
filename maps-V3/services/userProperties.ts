import { api } from '@/lib/api';

export interface UserProperty {
  id: number;
  mongo_property_id: string;
  owner_user_id: number;
  display_name: string;
  registry_number: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SearchByCPFResponse {
  message: string;
  properties: UserProperty[];
  total: number;
}

export interface PropertyWithMongoDetails extends UserProperty {
  mongo_details: {
    _id: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
    properties: {
      cod_imovel: string;
      nome_imovel?: string;
      num_area: number;
      municipio?: string;
      ind_status?: string;
      cpf?: string;
      // Adicione outros campos conforme necessário
    };
    center?: {
      lat: number;
      lng: number;
    };
    plusCode?: string;
  };
}

/**
 * Lista todas as propriedades do usuário logado (do MySQL)
 */
export const getMyProperties = () =>
  api<UserProperty[]>('/user-properties', { 
    service: 'auth', 
    method: 'GET' 
  });

/**
 * Busca propriedades no serviço mongo pelo CPF do usuário e salva no MySQL
 */
export const searchPropertiesByCPF = (cpf: string) =>
  api<SearchByCPFResponse>('/user-properties/search-by-cpf', {
    service: 'auth',
    method: 'POST',
    body: JSON.stringify({ cpf })
  });

/**
 * Busca uma propriedade específica por ID
 */
export const getPropertyById = (id: number) =>
  api<UserProperty>(`/user-properties/${id}`, { 
    service: 'auth', 
    method: 'GET' 
  });

/**
 * Busca detalhes completos de uma propriedade no serviço mongo
 */
export const getPropertyMongoDetails = (id: number) =>
  api<PropertyWithMongoDetails>(`/user-properties/${id}/mongo-details`, { 
    service: 'auth', 
    method: 'GET' 
  });

/**
 * Atualiza uma propriedade
 */
export const updateProperty = (id: number, data: { display_name?: string; registry_number?: string }) =>
  api<UserProperty>(`/user-properties/${id}`, { 
    service: 'auth', 
    method: 'PUT',
    body: JSON.stringify(data)
  });

/**
 * Remove uma propriedade (soft delete)
 */
export const deleteProperty = (id: number) =>
  api<{ message: string }>(`/user-properties/${id}`, { 
    service: 'auth', 
    method: 'DELETE' 
  });

