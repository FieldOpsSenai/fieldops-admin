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

- Next.js com React
- TypeScript
- Tailwind CSS

## Repositórios relacionados

- `fieldops-api` — API e regras de negócio.
- `fieldops-mobile` — Aplicativo mobile para técnicos.
- `fieldops-admin` — Interface web administrativa.

## Desenvolvimento

### Requisitos

- Node.js e npm instalados.
- API Java FieldOps em execução. Por padrão, o painel encaminha chamadas para `http://localhost:8080`.

### Instalação e execução

Na pasta `Admin-Web/`, instale as dependências:

```bash
npm ci
```

Copie o arquivo de exemplo para a configuração local:

```bash
# macOS/Linux
cp .env.example .env.local
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

Ajuste `.env.local` se a API estiver em outro endereço. Inicie o painel:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A API deve estar acessível pelo endereço configurado em `FIELDOPS_API_URL`.

### Variáveis de ambiente

| Variável              | Padrão                  | Uso                                                                 |
| --------------------- | ----------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `/api/v1`               | Caminho usado pelo navegador e encaminhado ao backend pelo Next.js. |
| `FIELDOPS_API_URL`    | `http://localhost:8080` | Origem da API Java usada pela rewrite, sem barra final.             |

Não versione `.env.local`; o arquivo está ignorado pelo Git. `.env.example` contém somente valores locais de exemplo.

### Comandos

| Comando                | Ação                                          |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento.         |
| `npm run build`        | Gera a versão de produção.                    |
| `npm run start`        | Inicia a versão de produção já compilada.     |
| `npm run lint`         | Executa o ESLint.                             |
| `npm run format`       | Formata os arquivos suportados pelo Prettier. |
| `npm run format:check` | Verifica a formatação sem alterar arquivos.   |
| `npm test`             | Executa os testes Jest.                       |

O Prettier está fixado em `package.json` e `package-lock.json`. `.prettierignore` exclui dependências, artefatos gerados e o lockfile.

### Estrutura

- `src/app/(auth)/`: páginas de autenticação.
- `src/app/(dashboard)/`: layout protegido e rotas do painel, incluindo inspeções, relatórios, planejamento, configurações, suporte e modelos.
- `src/components/`: componentes de layout, autenticação, UI e elementos compartilhados.
- `src/lib/api/`: cliente HTTP e serviços de acesso à API.
- `src/lib/auth/`: regras de autenticação e permissões.
- `src/stores/`: estado de sessão.
- `src/types/`: tipos compartilhados.

As rotas `/users`, `/clients`, `/sites` e `/equipment` reutilizam a tela de dados mestres em `/settings`, selecionando a aba correspondente ao caminho.

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

O painel possui estrutura Next.js, rotas administrativas, autenticação, integração com a API Java e ferramentas de lint e formatação.
