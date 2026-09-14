package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.Cliente;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteResponseDTO {

    private Long id;
    private String nome;
    private String cnpj;
    private String telefone;
    private String email;
    private Boolean ativo;

    // Construtor auxiliar para converter a Entidade direto para o DTO
    public ClienteResponseDTO(Cliente cliente) {
        this.id = cliente.getId();
        this.nome = cliente.getNome();
        this.cnpj = cliente.getCnpj();
        this.telefone = cliente.getTelefone();
        this.email = cliente.getEmail();
        this.ativo = cliente.getAtivo();
    }
}