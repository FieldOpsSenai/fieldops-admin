package br.com.fieldops.api.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocalRequestDTO {

    @NotBlank(message = "O nome do local é obrigatório")
    private String nome;

    private String endereco;

    @NotNull(message = "O ID do cliente é obrigatório")
    private Long clienteId;
}