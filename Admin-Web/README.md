# FieldOps Admin

Interface web administrativa da plataforma FieldOps — Plataforma de Inspeção em Campo.

## Responsabilidade

O `fieldops-admin` é responsável pela interface web utilizada por administradores e supervisores para:

- Gerenciar usuários e permissões.
- Gerenciar clientes, locais e equipamentos.
- Criar e gerenciar modelos de inspeção.
- Publicar versões de modelos.
- Agendar e atribuir inspeções.
- Monitorar inspeções em execução.
- Revisar resultados.
- Aprovar ou rejeitar inspeções.
- Consultar histórico e indicadores.

## Stack

- Next.js
- TypeScript
- Tailwind CSS

## Repositórios relacionados

- `fieldops-api` — API e regras de negócio.
- `fieldops-mobile` — Aplicativo mobile para técnicos.
- `fieldops-admin` — Interface web administrativa.

## Desenvolvimento

### Conectar à API local

1. Inicie o `fieldops-api` com o PostgreSQL configurado. A API deve estar disponível em `http://localhost:8080`.
2. O Next.js encaminha `/api/v1/*` para `http://localhost:8080/api/v1/*`. Copie `.env.example` para `.env.local` apenas se precisar mudar a URL base usada pelo Admin-Web.
3. Instale as dependências e inicie o Admin-Web com `npm install` e `npm run dev`. Por padrão, o Next.js ficará disponível em `http://localhost:3000`.

O cliente HTTP usa o proxy do Next.js e envia o JWT no cabeçalho `Authorization: Bearer`. A URL base pode ser alterada pela variável pública `NEXT_PUBLIC_API_URL`. As rotas e os formatos usados pelos serviços do Admin-Web seguem o contrato documentado no repositório `fieldops-api`; a autorização final continua sendo aplicada pela API.

O contrato atual permite consultar e cadastrar clientes, locais, equipamentos, usuários e inspeções, além de inativar clientes e usuários. Recursos sem endpoint correspondente na API não são simulados pelo Admin-Web.

## Convenções

### Branches

A branch principal é:

`main`

Branches de desenvolvimento devem seguir o padrão:

    feature/PBI-XXX-descricao
    fix/PBI-XXX-descricao
    hotfix/PBI-XXX-descricao

### Commits

Os commits devem seguir o padrão:

    tipo(PBI-ID): descrição

Exemplo:

    feat(PBI-009): adiciona autenticação do administrador

### Pull Requests

Alterações na `main` devem obrigatoriamente passar por Pull Request.

O fluxo padrão é:

    branch → commit → push → Pull Request → review → aprovação → squash merge

Consulte `docs/CONTRIBUTING.md` para as regras completas de contribuição.

## Status

Repositório em configuração inicial.
