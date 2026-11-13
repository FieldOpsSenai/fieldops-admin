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

// A consulta JPQL da API main aplica LOWER a parâmetros nulos no PostgreSQL.
// O curinga representa todos os nomes não nulos e evita o erro 500 na busca vazia.
export function apiSearchTerm(value?: string): string {
  return value?.trim() || '%';
}

export function mapApiPage<T, U>(page: ApiPage<T>, map: (item: T) => U): ApiPage<U> {
  if (!Array.isArray(page.content) || !Number.isFinite(page.totalElements) || !Number.isFinite(page.totalPages)) {
    throw new Error('A API não retornou os dados de paginação esperados.');
  }
  return { ...page, content: page.content.map(map) };
}

/** Reads paginated lookup options without silently truncating at the first page. */
export async function collectPages<T>(fetchPage: (page: number) => Promise<ApiPage<T>>): Promise<T[]> {
  const result: T[] = [];
  let page = 0;
  let pages = 1;
  while (page < pages) {
    const response = mapApiPage(await fetchPage(page), (item) => item);
    if (response.number !== page) throw new Error('A API retornou uma página diferente da solicitada.');
    result.push(...response.content);
    pages = response.totalPages;
    page += 1;
  }
  return result;
}
