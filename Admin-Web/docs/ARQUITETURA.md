# Arquitetura e guia de explicação

Como a interface administrativa está organizada, por que cada decisão foi tomada e onde cada parte está no código. Serve para a equipe, para a avaliação e para a defesa técnica.

## 1. Visão em uma frase

A página chama um **serviço**, o serviço chama `/api/v1` na mesma origem, uma **rota proxy do Next.js** coloca o token e repassa para a **API Java**, que valida, aplica as regras e grava no banco.

```text
Página (React)  →  Serviço (lib/api/services)  →  axios /api/v1
      →  Proxy Next.js (app/api/v1/[...path])  +  token do cookie HttpOnly
      →  API Spring Boot  →  PostgreSQL
```

A web nunca acessa o banco. A web esconde botões por perfil, mas **quem autoriza de verdade é a API**.

## 2. Pastas

| Pasta | O que tem |
| --- | --- |
| `src/app/(auth)/login` | Tela de login. |
| `src/app/(dashboard)/` | Páginas protegidas: dashboard, usuários, clientes, modelos, inspeções, planejamento. |
| `src/app/api/session` | Login, consulta e logout da sessão (grava e limpa cookies). |
| `src/app/api/v1/[...path]` | Proxy que repassa as chamadas para a API Java com o token. |
| `src/proxy.ts` | Guard no servidor: sem cookie de sessão, redireciona para `/login`. |
| `src/components/auth/AdminWebGuard.tsx` | Guard no cliente: sem sessão vai para `/login`; técnico vai para `/forbidden`. |
| `src/lib/api/services/` | Um serviço por recurso: valida a entrada, chama a API e converte a resposta. |
| `src/lib/auth/permissions.ts` | Regras de autorização visual (quem vê o quê). |
| `src/stores/sessionStore.ts` | Estado da sessão com Zustand (nome, perfil, ID; **sem token**). |

**Por que serviços separados das páginas?** A página cuida da tela; o serviço cuida do contrato com a API. Se a API muda um nome de campo, mexe-se num lugar só, e os serviços são testados sem abrir a tela.

## 3. Autenticação, guards e autorização visual

1. O login envia e-mail e senha para `/api/session` (rota da própria web).
2. Essa rota chama `/auth/login` na API, recebe os tokens e grava em **cookies HttpOnly**. O JavaScript do navegador não consegue ler esses cookies, o que protege contra roubo de token por XSS.
3. O navegador recebe só `{ nome, email, perfil, id }`, guardados no Zustand.
4. Cada chamada vai para `/api/v1/...`; o proxy lê o cookie no servidor e envia `Authorization: Bearer`.
5. Se a API responde **401**, o interceptor do axios (`lib/api/axios.ts`) tenta renovar a sessão **uma vez** e repete a chamada. Se não der, manda para o login.
6. Rotas que alteram dados recusam requisições de outra origem (`isSameOrigin`), o que reduz o risco de CSRF.

Há três camadas de proteção:

| Camada | Arquivo | Protege contra |
| --- | --- | --- |
| Servidor (antes de renderizar) | `src/proxy.ts` | Abrir uma página sem nenhum cookie. |
| Cliente | `AdminWebGuard.tsx` | Sessão inválida e perfil sem acesso (técnico). |
| Visual | `permissions.ts` + `Sidebar.tsx` | Mostrar menus e botões que o perfil não pode usar. |

A autoridade final é sempre a API: mesmo que alguém force um botão, o backend recusa.

## 4. Cadastros e formulários

- **Usuários** (`users/page.tsx`): listagem por perfil, criação, edição e inativação.
- **Clientes → locais → equipamentos** (`ClientsHierarchyManager.tsx`): hierarquia paginada, mais o QR Code do equipamento (`EquipmentQrCode.tsx`), que é o código que o app mobile lê.
- Os formulários validam antes de enviar (campos obrigatórios, tamanho) e mostram a mensagem de erro da API (`errorMessage.ts`). Em falha, os valores digitados são mantidos.

## 5. Construtor de modelos

Arquivo: `inspection-templates/page.tsx`; serviço: `modeloInspecaoService.ts`.

- Um modelo tem **seções**, e cada seção tem **itens** (perguntas) com tipo de resposta, obrigatoriedade, item crítico e evidência obrigatória.
- É possível adicionar, editar, reordenar e excluir seções e itens, e abrir uma **prévia** sem gravar nada.
- **Salvar** envia a árvore inteira num único `PUT`, e a API grava tudo numa transação. Assim nunca fica metade salva; reenviar substitui a estrutura em vez de duplicar itens.
- **Publicar** valida tudo antes (`validateTemplateForPublish`) e pede confirmação. A versão publicada fica **imutável**: o serviço confere o estado e recusa editar o que já foi publicado.
- **Nova versão** cria um rascunho a partir da publicada; a versão anterior continua valendo para as inspeções antigas.

**Modelo vs snapshot:** ao agendar uma inspeção, a API copia o checklist naquele momento (snapshot). Se o modelo ganhar uma nova versão depois, a inspeção já agendada não muda.

## 6. Planejamento e acompanhamento

- **Agendar** (`inspections/new/page.tsx`): escolhe cliente → local → equipamento, modelo publicado, técnico, data agendada, prazo e prioridade. O serviço valida as datas (agendada no futuro, prazo igual ou depois da data agendada) antes de chamar a API.
- **Acompanhar** (`inspections/page.tsx`): lista paginada com filtros por nome, estado, cliente, técnico e prioridade, e destaque de inspeção atrasada. É possível editar o planejamento e cancelar (com motivo) enquanto a inspeção não começou.
- **Dashboard** (`DashboardPage.tsx`): totais reais vindos da API; quando uma consulta falha, a falha aparece em vez de um número falso.

## 7. Revisão, aprovação e reprovação

Arquivos: `components/inspections/InspectionDetailPage.tsx` e `revisaoService.ts`.

1. Carrega a inspeção e, **em paralelo**, o snapshot, as respostas e as evidências (`Promise.allSettled`). Se uma parte falha, as outras aparecem, e o formulário de decisão fica bloqueado com o botão "Tentar novamente".
2. Mostra cada item do checklist com a resposta, a observação e as fotos vinculadas.
3. Se falta resposta ou evidência obrigatória, a **aprovação é bloqueada** e só a reprovação fica disponível.
4. Reprovar exige motivo (até 255 caracteres).
5. Há uma etapa de **confirmação** antes de enviar.
6. Antes de enviar, **consulta o estado de novo**: se a inspeção mudou (por exemplo, já foi reaberta), a decisão não é enviada.
7. O sucesso só aparece se a resposta da API confirma o estado esperado (aprovada → `CONCLUIDA`, reprovada → `EM_ANDAMENTO`, ou seja, volta para o técnico corrigir).

**Conclusão vs aprovação:** "Concluída" significa que o técnico terminou a execução, não que foi aprovada. A web não confunde os dois.

## 8. Estados de interface, acessibilidade e responsividade

- Cada tela trata **carregando**, **erro com nova tentativa**, **vazio** e **sucesso**. Há skeletons em `components/shared`.
- Mensagens usam `role="alert"` e `role="status"` para leitores de tela; formulários têm `label`; o foco vai para a caixa de confirmação quando ela abre.
- `lang="pt-BR"` no HTML. O menu vira gaveta no celular e as tabelas rolam na horizontal.
- `npm run test:browser` abre as telas no Chromium com respostas simuladas e roda o axe (verificação automática de acessibilidade).

## 9. Testes e qualidade

- **Jest + Testing Library:** serviços (contrato com a API, com respostas controladas), rotas de sessão, guard, permissões e páginas principais.
- **ESLint**, **TypeScript** (`tsc --noEmit`) e **Prettier**.
- Sem segredos no repositório: `.env.local` é ignorado pelo Git; `.env.example` só tem endereços locais.

## 10. Decisões que valem ser explicadas

| Decisão | Motivo |
| --- | --- |
| Next.js com React em vez de Angular | Escolha da equipe. Os conceitos pedidos têm equivalentes: guards (`proxy.ts` + `AdminWebGuard`), serviços (`lib/api/services`), rotas (App Router), formulários controlados. |
| Token em cookie HttpOnly via proxy | O JavaScript da página nunca vê o token. |
| Salvar o modelo num único `PUT` | Evita estrutura salva pela metade e duplicação ao reenviar. |
| `Promise.allSettled` no detalhe | Uma falha parcial não derruba a tela inteira, e a decisão fica bloqueada até ter os dados completos. |
| Reconsultar o estado antes de revisar | Evita decidir sobre uma inspeção que mudou enquanto a tela estava aberta. |
| Não inventar dados | Se a API não fornece algo (fotos, histórico), a tela diz isso. Veja [PENDENCIAS-API.md](PENDENCIAS-API.md). |

## 11. Perguntas prováveis na defesa

**"Explique o caminho de um clique até o banco."**
Exemplo: aprovar uma inspeção. O botão chama `submitDecision` na página → `revisaoService.revisar` valida o motivo e chama `PATCH /api/v1/inspecoes/{id}/revisar` → o proxy Next.js põe o token do cookie e repassa → a API valida o perfil e a transição de estado e grava → a resposta volta e a tela confere se o estado bate com o esperado.

**"Onde fica o token? Por que não no localStorage?"**
Num cookie HttpOnly. O localStorage pode ser lido por qualquer script da página; se houver XSS, o token vaza. O cookie HttpOnly não é acessível por JavaScript.

**"Se eu esconder o botão, o usuário não consegue fazer a ação?"**
Esconder é só experiência de uso. A segurança está na API, que confere o perfil em cada requisição.

**"O que acontece se a API cair no meio?"**
O proxy devolve 502 com mensagem. A tela mostra o erro, mantém o que foi digitado e oferece "Tentar novamente". Não aparece sucesso falso.

**"E se o token expirar?"**
O axios recebe 401, chama `/api/session/refresh` uma vez e repete a requisição. Se a renovação falhar, limpa a sessão e leva ao login.

**"Por que a versão publicada não pode ser editada?"**
Porque inspeções já foram agendadas com ela. Mudar depois alteraria o significado das respostas. Para mudar, cria-se uma nova versão.

**"Como você testou sem depender da API?"**
Com respostas controladas: os testes simulam o que a API devolve (sucesso, erro, formato inválido) e conferem o comportamento do serviço e da tela.

**"Qual foi a sua contribuição?"**
Responda com os seus PRs e commits (`git log --author`) e escolha **um** fluxo para explicar de ponta a ponta usando as seções acima.
