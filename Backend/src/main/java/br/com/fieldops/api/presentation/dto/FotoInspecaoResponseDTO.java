package br.com.fieldops.api.presentation.dto;

import br.com.fieldops.api.domain.entity.FotoInspecao;

import java.time.LocalDateTime;

public class FotoInspecaoResponseDTO {

    private Long id;
    private String nomeArquivo;
    private String tipoConteudo;
    private LocalDateTime dataUpload;
    private Long inspecaoId;

    public FotoInspecaoResponseDTO() {
    }

    public FotoInspecaoResponseDTO(FotoInspecao foto) {
        this.id = foto.getId();
        this.nomeArquivo = foto.getNomeArquivo();
        this.tipoConteudo = foto.getTipoConteudo();
        this.dataUpload = foto.getDataUpload();
        if (foto.getInspecao() != null) {
            this.inspecaoId = foto.getInspecao().getId();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }

    public void setNomeArquivo(String nomeArquivo) {
        this.nomeArquivo = nomeArquivo;
    }

    public String getTipoConteudo() {
        return tipoConteudo;
    }

    public void setTipoConteudo(String tipoConteudo) {
        this.tipoConteudo = tipoConteudo;
    }

    public LocalDateTime getDataUpload() {
        return dataUpload;
    }

    public void setDataUpload(LocalDateTime dataUpload) {
        this.dataUpload = dataUpload;
    }

    public Long getInspecaoId() {
        return inspecaoId;
    }

    public void setInspecaoId(Long inspecaoId) {
        this.inspecaoId = inspecaoId;
    }
}