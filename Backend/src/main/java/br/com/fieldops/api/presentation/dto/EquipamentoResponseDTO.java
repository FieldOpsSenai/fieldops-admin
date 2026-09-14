package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.Equipamento;
import lombok.Data;

@Data
public class EquipamentoResponseDTO {

    private Long id;
    private String nome;
    private String numeroSerie;
    private String tipo;
    private Boolean ativo;
    private Long localId;
    private String localNome;

    public EquipamentoResponseDTO(Equipamento equipamento) {
        this.id = equipamento.getId();
        this.nome = equipamento.getNome();
        this.numeroSerie = equipamento.getNumeroSerie();
        this.tipo = equipamento.getTipo();
        this.ativo = equipamento.getAtivo();
        this.localId = equipamento.getLocal().getId();
        this.localNome = equipamento.getLocal().getNome();
    }
}