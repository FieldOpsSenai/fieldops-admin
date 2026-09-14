package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.Inspecao;
import br.com.fieldops.api.domain.entity.StatusInspecao;

import java.time.LocalDateTime;

public class InspecaoResponseDTO {

    private Long id;
    private String descricao;
    private StatusInspecao status;
    private LocalDateTime dataAgendada;
    private LocalDateTime dataRealizacao;
    private String observacoes;
    private Long equipamentoId;
    private String equipamentoNome;
    private Long usuarioId;
    private String usuarioNome;

    public InspecaoResponseDTO() {
    }

    public InspecaoResponseDTO(Inspecao inspecao) {
        this.id = inspecao.getId();
        this.descricao = inspecao.getDescricao();
        this.status = inspecao.getStatus();
        this.dataAgendada = inspecao.getDataAgendada();
        this.dataRealizacao = inspecao.getDataRealizacao();
        this.observacoes = inspecao.getObservacoes();
        
        if (inspecao.getEquipamento() != null) {
            this.equipamentoId = inspecao.getEquipamento().getId();
            this.equipamentoNome = inspecao.getEquipamento().getNome();
        }
        
        if (inspecao.getUsuario() != null) {
            this.usuarioId = inspecao.getUsuario().getId();
            this.usuarioNome = inspecao.getUsuario().getNome();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public StatusInspecao getStatus() {
        return status;
    }

    public void setStatus(StatusInspecao status) {
        this.status = status;
    }

    public LocalDateTime getDataAgendada() {
        return dataAgendada;
    }

    public void setDataAgendada(LocalDateTime dataAgendada) {
        this.dataAgendada = dataAgendada;
    }

    public LocalDateTime getDataRealizacao() {
        return dataRealizacao;
    }

    public void setDataRealizacao(LocalDateTime dataRealizacao) {
        this.dataRealizacao = dataRealizacao;
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

    public String getEquipamentoNome() {
        return equipamentoNome;
    }

    public void setEquipamentoNome(String equipamentoNome) {
        this.equipamentoNome = equipamentoNome;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public void setUsuarioNome(String usuarioNome) {
        this.usuarioNome = usuarioNome;
    }
}