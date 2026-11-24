# Contrato da interface web

Revisado em 22/11/2026 a partir do código principal de `FieldOpsSenai/fieldops-api`. Somente a web é alterada nesta entrega.

O navegador chama `/api/v1` na mesma origem. O proxy Next.js lê o token em cookie HttpOnly. Configure `FIELDOPS_API_URL` com a origem da API ou `FIELDOPS_API_INTERNAL_URL` com a base completa, incluindo `/api/v1`.

| Recurso | Contrato do backend |
| --- | --- |
| Inspeções e filtros | `GET /api/v1/inspecoes` |
| Planejamento | `POST /api/v1/inspecoes`, `PATCH /api/v1/inspecoes/{id}/planejamento` |
| Cancelamento | `PATCH /api/v1/inspecoes/{id}/cancelar` |
| Snapshot | `GET /api/v1/inspecoes/{id}/snapshot` |
| Respostas | `GET /api/v1/inspecoes/{id}/respostas` |
| Registros de fotos | `GET /api/v1/inspecoes/{id}/fotos` |
| Revisão | `PATCH /api/v1/inspecoes/{id}/revisar` |
| Modelos | `/api/modelos-inspecao` (sem `/v1`) |

O proxy remove `/v1` somente para modelos. Os detalhes administrativos percorrem a listagem paginada até encontrar o ID: a API não disponibiliza GET de inspeção individual para gestores. A consulta aceita cancelamento ao sair da página.

## Estados e revisão

Estados existentes: `PENDENTE`, `AGENDADA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`. A web não converte `CONCLUIDA` em aprovação: a conclusão pelo técnico também retorna esse estado.

A web oferece as mesmas opções de revisão para administradores e supervisores. A solicitação envia `{ supervisorId, aprovado, motivoReprovacao? }`, com o ID do gestor autenticado no campo legado `supervisorId`. Para o fluxo funcionar, a API precisa permitir a leitura das respostas e aceitar decisões dos dois perfis. A reprovação exige motivo de até 255 caracteres, compatível com a coluna atual. Após a confirmação, a web reconsulta o estado. O controle definitivo de concorrência pertence à API.

Aprovação espera `CONCLUIDA`; reprovação espera `EM_ANDAMENTO`. Só há sucesso visual após retorno compatível. Falhas preservam a justificativa. A confirmação na página é temporária, não um histórico persistente.

Snapshot, respostas e evidências são carregados independentemente. Falhas bloqueiam o formulário e permitem tentar novamente. Aprovação é bloqueada quando faltam respostas/evidências obrigatórias. Os arquivos de evidência só possuem metadados disponíveis; não são inventadas URLs para as imagens.

## Referência antiga

`contracts/openapi.json` é um snapshot histórico de 07/11/2026 de outra versão local, com rotas em inglês. **Não representa o contrato atual.** Consulte o Swagger do backend utilizado e as [pendências de integração](PENDENCIAS-API.md).

Testes de serviços verificam contratos com respostas controladas. O fluxo ponta a ponta depende da API e do mobile da equipe.
