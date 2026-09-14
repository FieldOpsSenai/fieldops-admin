package br.com.fieldops.api.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data  // ⭐ Gera todos os Getters, Setters, toString, equals, hashCode
@NoArgsConstructor  // ⭐ Gera construtor vazio
@AllArgsConstructor  // ⭐ Gera construtor com todos os argumentos
@Schema(description = "DTO com token JWT e dados do usuário")
public class TokenResponseDTO {
    
    @Schema(
        description = "Token JWT para autenticação",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    private String token;
    
    @Schema(
        description = "Tipo de token",
        example = "Bearer"
    )
    private String tipo = "Bearer";
    
    @Schema(
        description = "Perfil do usuário",
        example = "ADMINISTRADOR",
        allowableValues = {"ADMINISTRADOR", "SUPERVISOR", "TECNICO"}
    )
    private String perfil;
    
    @Schema(
        description = "Nome do usuário",
        example = "Administrador do Sistema"
    )
    private String nome;
    
    @Schema(
        description = "Email do usuário",
        example = "admin@fieldops.com"
    )
    private String email;
    
    @Schema(
        description = "Tempo de expiração do token em segundos",
        example = "86400"
    )
    private Long expiracao;
    
    // ⭐ Construtor personalizado que você já tinha
    public TokenResponseDTO(String token, String perfil, String nome, String email) {
        this.token = token;
        this.perfil = perfil;
        this.nome = nome;
        this.email = email;
        this.expiracao = 86400L;
    }
}