package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.Local;
import lombok.Data;

@Data
public class LocalResponseDTO {

    private Long id;
    private String nome;
    private String endereco;
    private Long clienteId;
    private String clienteNome;
    private Boolean ativo;

    public LocalResponseDTO(Local local) {
        this.id = local.getId();
        this.nome = local.getNome();
        this.endereco = local.getEndereco();
        this.clienteId = local.getCliente().getId();
        this.clienteNome = local.getCliente() != null ? local.getCliente().getNome() : null;
        this.ativo = local.getAtivo();
    }
}