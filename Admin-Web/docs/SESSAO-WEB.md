# Sessão web — PBI-009

O navegador envia as credenciais para a rota Next.js `/api/session`. Essa rota pertence à aplicação web e utiliza o contrato de autenticação da API FieldOps sem modificar o backend.

- Os tokens de acesso e renovação ficam em cookies `HttpOnly`, `SameSite=Lax`, `Secure` em produção. Eles não são retornados no JSON enviado ao navegador.
- O estado Zustand mantém apenas os dados necessários à interface. Dados legados de autenticação em `localStorage` são removidos ao iniciar a sessão.
- `/api/session` valida a sessão pelo endpoint `/auth/me`; usuários inativos, bloqueados ou técnicos não recebem acesso à interface administrativa.
- O proxy `/api/v1/*` lê o cookie no servidor web e acrescenta `Authorization: Bearer` nas chamadas à API.
- Logout chama `/auth/logout`, limpa os cookies e remove o estado da interface. Se a API estiver indisponível, os cookies locais são removidos, mas a revogação remota não pode ser confirmada.
- Requisições que alteram dados rejeitam origem externa. A autorização final continua sob responsabilidade da API.

O cliente web usa sempre `/api/v1` na mesma origem. Configure o backend por `FIELDOPS_API_URL` ou `FIELDOPS_API_INTERNAL_URL`; não redirecione o navegador diretamente ao backend.

## Renovação — PBI-010

Uma resposta 401 inicia uma única chamada a `/api/session/refresh`, compartilhada entre requisições concorrentes. Após sucesso, a chamada original é repetida no máximo uma vez. A restauração da sessão também tenta renovar um cookie de acesso expirado.

Falhas definitivas (401/403) removem os cookies e levam ao login. Falhas transitórias (rede/5xx) preservam as credenciais para uma nova tentativa. Logout cancela uma renovação em andamento. Quando a API retorna um refresh token rotacionado, ele substitui o cookie anterior.
