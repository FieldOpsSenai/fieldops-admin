package br.com.fieldops.api.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EquipamentoRequestDTO {

    @NotBlank(message = "O nome do equipamento é obrigatório")
    private String nome;

    @NotBlank(message = "O número de série é obrigatório")
    private String numeroSerie;

    private String tipo;

    @NotNull(message = "O ID do local é obrigatório")
    private Long localId;
}