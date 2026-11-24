# Pendências de integração com a API

- **Revisão no Docker.** Na versão testada, o checklist carregou, mas a leitura de respostas retornou `403` para o administrador. Validar o acesso de administrador e supervisor a `GET /api/v1/inspecoes/{id}/respostas` e `PATCH /api/v1/inspecoes/{id}/revisar` com uma inspeção concluída pelo mobile.
- **Versão implantada na AWS.** Na versão testada, as rotas `GET /api/v1/inspecoes/{id}/snapshot` e `GET /api/v1/inspecoes/{id}/respostas` não estavam disponíveis. Publicar uma versão com o contrato de inspeções atualizado e conferir as rotas no Swagger do ambiente.
- **Evidências e histórico.** Expor um acesso autorizado às imagens e um histórico persistente com a decisão, o responsável e o motivo da reprovação. A interface atual exibe os metadados de evidências e confirma a decisão após a resposta da API.
- **Modelos de inspeção.** As limitações de persistência e versionamento estão descritas no [contrato de modelos](MODELOS-INTEGRACAO.md).
