export function getPageContent<T>(
  data: T[] | { content?: T[] }
): T[] {
  return Array.isArray(data)
    ? data
    : data.content ?? [];
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CadastroQuery {
  page?: number;
  size?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  clientId?: number;
  siteId?: number;
}

export function mapApiPage<T, U>(page: ApiPage<T>, map: (item: T) => U): ApiPage<U> {
  if (!Array.isArray(page.content) || !Number.isFinite(page.totalElements) || !Number.isFinite(page.totalPages)) {
    throw new Error('A API não retornou os dados de paginação esperados.');
  }
  return { ...page, content: page.content.map(map) };
}
