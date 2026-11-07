# FieldOps Admin

Interface web administrativa da plataforma **FieldOps — Plataforma de Inspeção em Campo**.

## Sobre o projeto

O `fieldops-admin` é a interface web administrativa utilizada por administradores e supervisores para gerenciamento e acompanhamento das operações da plataforma FieldOps.

A aplicação se comunica com o `fieldops-api` através de uma API REST e não possui acesso direto ao banco de dados.

## Objetivo

O painel administrativo tem como objetivo fornecer recursos para gerenciamento, configuração e acompanhamento das operações da plataforma.

Entre suas principais funcionalidades estão:

* gerenciamento de usuários e permissões;
* gerenciamento de clientes, locais e equipamentos;
* criação e gerenciamento de modelos de inspeção;
* publicação de versões de modelos;
* agendamento e atribuição de inspeções;
* monitoramento de inspeções em execução;
* revisão de resultados;
* aprovação ou rejeição de inspeções;
* consulta de histórico e indicadores.

As funcionalidades serão implementadas conforme os PBIs definidos no backlog do projeto.

## Arquitetura

O painel Admin utiliza a API como intermediária para comunicação com os serviços e dados da plataforma.

```text id="m7j4kx"
┌─────────────────────┐
│    fieldops-admin   │
│   Next.js + Tailwind│
└──────────┬──────────┘
           │
           │ REST API
           ▼
┌─────────────────────┐
│    fieldops-api     │
│    Spring Boot      │
└──────────┬──────────┘
           │
           │
           ▼
┌─────────────────────┐
│     PostgreSQL      │
└─────────────────────┘
```

O painel **não acessa diretamente o banco de dados**.

Toda comunicação com os dados e regras de negócio deve ocorrer através do `fieldops-api`.

## Tecnologias

* Next.js
* TypeScript
* Tailwind CSS

> As versões das tecnologias serão definidas durante a configuração do projeto.

## Estrutura do projeto

A estrutura interna será definida conforme a implementação da aplicação Next.js.

A organização deverá seguir uma estrutura modular, facilitando a manutenção, evolução e separação das funcionalidades do painel administrativo.

## Configuração do ambiente

As configurações específicas do ambiente devem ser mantidas fora do código-fonte.

Informações sensíveis, como tokens, credenciais e chaves de acesso, **não devem ser versionadas no Git**.

As variáveis necessárias para execução da aplicação deverão ser documentadas através de um arquivo `.env.example` ou mecanismo equivalente.

A URL da API utilizada pelo Admin deverá ser configurada conforme o ambiente de desenvolvimento.

## Execução

As instruções de instalação, configuração e execução serão adicionadas após a criação da estrutura inicial do projeto Next.js.

##  Testes

Os testes automatizados devem ser executados antes da abertura de um Pull Request.

As instruções específicas para execução dos testes serão documentadas conforme a implementação do projeto.

## Desenvolvimento

O desenvolvimento deve seguir as convenções definidas pelo projeto FieldOps.

As regras de branches, commits, Pull Requests e proteção da `main` estão documentadas em:

`docs/CONTRIBUTING.md`

Exemplo de branch:

```text id="p8h2nc"
feature/PBI-009-autenticacao-administrador
```

Exemplo de commit:

```text id="w4k6qs"
feat(PBI-009): adiciona autenticação do administrador
```

## Repositórios relacionados

* `fieldops-api` — API REST e regras de negócio.
* `fieldops-mobile` — Aplicativo mobile utilizado pelos técnicos.
* `fieldops-admin` — Interface web administrativa.

## Documentação

A documentação específica do repositório está disponível no diretório `docs/`.

Para consultar as regras de contribuição e desenvolvimento:

`docs/CONTRIBUTING.md`

Documentações relacionadas ao desenvolvimento e às convenções gerais do projeto devem seguir os padrões definidos pelo FieldOps.

## Status

Em desenvolvimento.
