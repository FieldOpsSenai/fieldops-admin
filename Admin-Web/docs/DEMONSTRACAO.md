# Roteiro da demonstração web

## Preparação

- Configurar a URL correta da API FieldOps em `.env.local`.
- Executar lint, testes e build. Iniciar a versão compilada com `npm run start`.
- Ter usuários ativos de administrador, supervisor e técnico, provisionados pela equipe por fluxo suportado. Não colocar senhas em código, documentação, logs ou gravações.
- Usar dados de demonstração identificáveis, sem dados pessoais reais.
- Conferir [dependências da API](PENDENCIAS-API.md); declarar as limitações ainda não resolvidas.

## Sequência

1. **Sessão e perfis:** entrar como administrador, mostrar usuários, sair e entrar como supervisor. Demonstrar rota protegida sem sessão e bloqueio do técnico na web.
2. **Cadastros:** criar cliente, local e equipamento; editar um campo, recarregar e exibir o QR Code.
3. **Modelo:** criar rascunho, duas seções, perguntas de tipos suportados, obrigatoriedade e evidência; reordenar, abrir prévia, salvar, recarregar e publicar. Mostrar imutabilidade do publicado.
4. **Nova versão:** criar rascunho, revisar regras copiadas, salvar e conferir que a versão anterior permanece disponível.
5. **Planejamento:** selecionar hierarquia, modelo, técnico, data, prioridade e prazo; agendar. Combinar filtros, editar planejamento e cancelar uma segunda inspeção descartável.
6. **Execução integrada:** responsável pelo mobile registra respostas/fotos e sincroniza. Na web, atualizar e abrir detalhes. Explicar o snapshot do agendamento.
7. **Revisão:** como supervisor, conferir resultados, reprovar com motivo e confirmar. Mostrar erro sem sucesso falso se a API bloquear. Com backend corrigido, conferir correção, reenvio e aprovação.
8. **Confiabilidade:** no ambiente controlado da equipe, demonstrar falha da API e recuperação por nova tentativa. Não interromper serviços de outros projetos.

## Defesa individual

Explicar página → serviço HTTP → proxy → API; cookies HttpOnly; autorização visual versus backend; modelo versus snapshot; conclusão versus aprovação; salvamento da árvore em uma transação; falhas e testes com respostas controladas. O passo a passo de cada tópico está em [ARQUITETURA.md](ARQUITETURA.md).

## Evidências

Registrar URL/commit e PR; resultados de lint/Jest/build; roteiro integrado; perfis usados sem senhas; limitações e responsáveis. A confirmação temporária de revisão na página não substitui histórico do backend.
