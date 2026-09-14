package br.com.fieldops.api.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data  // ⭐ Gera todos os Getters, Setters, toString, equals, hashCode
@NoArgsConstructor  // ⭐ Gera construtor vazio
@AllArgsConstructor  // ⭐ Gera construtor com todos os argumentos
@Schema(description = "DTO para requisição de login")
public class LoginRequestDTO {
    
    @Schema(
        description = "Email do usuário",
        example = "admin@fieldops.com",
        required = true
    )
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;
    
    @Schema(
        description = "Senha do usuário",
        example = "123456",
        required = true,
        minLength = 6
    )
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String senha;
}