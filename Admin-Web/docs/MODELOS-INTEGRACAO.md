# Modelos de inspeção — integração web

A API principal usa `/api/modelos-inspecao` (sem `/v1`). O proxy web encaminha esse recurso mantendo o token em cookie HttpOnly. Modelos em rascunho, seções e itens podem ser criados, editados e excluídos; a publicação é feita pela API e modelos publicados não podem ser editados diretamente.

As operações de estrutura são individuais. Se o salvamento falhar, parte das alterações pode já estar no banco. O editor mantém os identificadores das etapas confirmadas para uma retentativa.

A API atual não armazena descrição geral do modelo, opções de seleção ou regra de observação obrigatória. Esses controles não são apresentados como persistidos. A regra de evidência é obrigatória para o item, independentemente do resultado.

A API oferece criação de nova versão em rascunho em `/nova-versao`, mas não oferece histórico separado com data e responsável pela publicação. A listagem retorna os modelos disponíveis com seus números de versão.

O endpoint paginado da API retorna erro com busca nula no PostgreSQL; o web envia `%` como curinga para consulta sem filtro até que o backend trate o parâmetro nulo.

Validação local: login, listagem, criação e exclusão de rascunho com seção e item executados contra a API main no Docker. Testes automatizados cobrem os fluxos e as limitações do contrato.