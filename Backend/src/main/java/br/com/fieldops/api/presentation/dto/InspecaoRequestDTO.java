package br.com.fieldops.api.presentation.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class InspecaoRequestDTO {

    @NotBlank(message = "A descrição é obrigatória")
    private String descricao;

    @NotNull(message = "A data agendada é obrigatória")
    @FutureOrPresent(message = "A data agendada deve ser no presente ou futuro")
    private LocalDateTime dataAgendada;

    private String observacoes;

    @NotNull(message = "O ID do equipamento é obrigatório")
    private Long equipamentoId;

    @NotNull(message = "O ID do técnico (usuário) é obrigatório")
    private Long usuarioId;

    public InspecaoRequestDTO() {
    }

    public InspecaoRequestDTO(String descricao, LocalDateTime dataAgendada, String observacoes, Long equipamentoId, Long usuarioId) {
        this.descricao = descricao;
        this.dataAgendada = dataAgendada;
        this.observacoes = observacoes;
        this.equipamentoId = equipamentoId;
        this.usuarioId = usuarioId;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDateTime getDataAgendada() {
        return dataAgendada;
    }

    public void setDataAgendada(LocalDateTime dataAgendada) {
        this.dataAgendada = dataAgendada;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Long getEquipamentoId() {
        return equipamentoId;
    }

    public void setEquipamentoId(Long equipamentoId) {
        this.equipamentoId = equipamentoId;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
}