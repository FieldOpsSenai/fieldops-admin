# Modelos de inspeção — integração web

A API usa `/api/modelos-inspecao`, sem `/v1`. O proxy adapta o caminho mantendo os tokens em cookies HttpOnly.

Rascunhos, seções e itens podem ser criados, editados, ordenados e excluídos. A prévia usa os valores do editor e não escreve na API. A publicação valida a estrutura e aguarda confirmação; versões publicadas permanecem somente leitura.

## Salvamento

O PUT do modelo aceita título, categoria e a árvore completa de seções e itens em uma transação. A web usa essa operação para evitar várias escritas parciais. A resposta fornece os novos IDs dos itens do rascunho. Reenviar a árvore substitui a estrutura, sem acrescentar itens duplicados.

Em falha, o editor mantém os valores. A criação inicial é um POST separado: se a conexão cair sem resposta, confira a listagem antes de recriar. Idempotência definitiva depende da API.

## Limites do contrato

- Descrição geral, opções de seleção e observação obrigatória não são persistidas pela API; não são oferecidas como funcionais na web.
- Evidência obrigatória vale independentemente do resultado.
- A API não expõe histórico separado de publicação com data e responsável.
- A cópia da nova versão no backend omite a regra de evidência. O editor preserva as regras da origem para salvar no novo rascunho.
- Busca vazia usa `%` devido à falha da consulta atual com parâmetro nulo no PostgreSQL.

Veja [dependências da API](PENDENCIAS-API.md) e [demonstração](DEMONSTRACAO.md).