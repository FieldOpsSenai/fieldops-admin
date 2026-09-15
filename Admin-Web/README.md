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

As instruções específicas de instalação, execução, testes e arquitetura da aplicação devem ser mantidas pela equipe responsável pelo desenvolvimento do Admin.

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
