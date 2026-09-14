package br.com.fieldops.api.presentation.dto;

import java.time.LocalDateTime;

public class ErroResponseDTO {

    private String erro;
    private String mensagem;
    private LocalDateTime timestamp;
    private int status;

    public ErroResponseDTO(String erro, String mensagem, int status) {
        this.erro = erro;
        this.mensagem = mensagem;
        this.timestamp = LocalDateTime.now();
        this.status = status;
    }

    public String getErro() {
        return erro;
    }

    public String getMensagem() {
        return mensagem;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }
}