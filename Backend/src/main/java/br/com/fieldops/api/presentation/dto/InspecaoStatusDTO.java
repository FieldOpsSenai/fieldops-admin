package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.StatusInspecao;
import jakarta.validation.constraints.NotNull;

public class InspecaoStatusDTO {

    @NotNull(message = "O novo status é obrigatório")
    private StatusInspecao status;

    private String observacoes;

    public InspecaoStatusDTO() {
    }

    public InspecaoStatusDTO(StatusInspecao status, String observacoes) {
        this.status = status;
        this.observacoes = observacoes;
    }

    public StatusInspecao getStatus() {
        return status;
    }

    public void setStatus(StatusInspecao status) {
        this.status = status;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}