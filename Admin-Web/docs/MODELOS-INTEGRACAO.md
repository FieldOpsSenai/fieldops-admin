# Modelos de inspeção — integração web

O painel cria e edita rascunhos em `/inspection-templates`, incluindo seções e itens. Somente respostas confirmadas são apresentadas como sucesso. Versões publicadas são protegidas tanto na interface quanto pela verificação do estado antes de salvar.

Ao copiar um modelo, o painel abre um formulário com IDs temporários. O novo rascunho só é criado ao salvar. Se parte do salvamento falhar, o formulário mantém o ID do modelo e os IDs de seções/itens já confirmados para reutilizá-los na próxima tentativa. As operações da API são individuais, portanto não há garantia de transação do checklist inteiro. Após uma falha, parte das alterações pode já estar persistida.

## Dependências do contrato

O contrato disponível em `contracts/openapi.json` não oferece exclusão de modelos nem exclusão individual de itens. Esses critérios dos PBIs 018 e 020 permanecem pendentes da API. A interface informa a limitação e não simula exclusão local. Seções completas podem ser excluídas pela operação documentada.

Novos rascunhos podem ser copiados de modelos publicados. O contrato ainda não oferece reabertura de um modelo publicado para criar uma versão seguinte no mesmo ID. A cópia é um novo modelo e não deve ser apresentada como uma nova versão do modelo original.

## Validação

Testes automatizados cobrem edição persistida, falhas mantendo o formulário aberto, cópia sem criação antecipada, retentativa após falha parcial e rejeição de edição de modelos publicados. São testes com respostas simuladas; a homologação autenticada com o backend continua necessária.
