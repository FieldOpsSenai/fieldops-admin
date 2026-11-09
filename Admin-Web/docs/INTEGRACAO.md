# Contrato da interface web — PBI-006

Referência: `http://localhost:8080/v3/api-docs`, FieldOps API v1, consultado em 07/11/2026 após confirmar o contêiner `fieldops-api`. A API local usa rotas em inglês e difere da branch pública `main` consultada nessa data. O snapshot em `contracts/openapi.json` inclui somente operações consumíveis pela interface administrativa e seus schemas; não contém credenciais ou dados de usuários.

## Desenvolvimento e testes

- Configure a origem do backend em `FIELDOPS_API_URL` ou a URL completa em `FIELDOPS_API_INTERNAL_URL`.
- O navegador chama o Next.js na mesma origem. A aplicação web encaminha as chamadas para a API; não acessa o banco de dados.
- Execute `npm test -- --runInBand`, `npx tsc --noEmit` e `npm run lint` na pasta `Admin-Web`.
- Os testes em `src/lib/api/services/__tests__` usam respostas controladas para verificar conversões de dados, relacionamentos e mensagens de erro sem depender de escrita no backend.
- Para atualizar o contrato, consulte o Swagger da API que será efetivamente utilizada, revise mudanças nos schemas e adapte serviços e testes no mesmo PBI.

## Limites confirmados do contrato

- Listagens de cadastros, usuários, modelos e inspeções aceitam `page`, `size`, `sort` e filtros próprios de cada endpoint.
- A API disponibiliza atualização e mudança de status dos cadastros; a interface deve aguardar confirmação antes de exibir sucesso.
- A exclusão de seções existe. Exclusão de itens e exclusão de modelos não constam no contrato consultado.
- Atualização dos dados de uma inspeção já agendada não consta no contrato consultado.
- A publicação retorna a versão, a data e o identificador do responsável. A API é responsável pela imutabilidade e pelo snapshot da inspeção.

Essas ausências devem permanecer registradas como dependências da equipe da API, sem acrescentar endpoints fictícios ou alterar o backend neste repositório.
