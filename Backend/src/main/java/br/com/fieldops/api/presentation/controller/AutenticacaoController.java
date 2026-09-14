package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.entity.Usuario;
import br.com.fieldops.api.domain.repository.UsuarioRepository;
import br.com.fieldops.api.infrastructure.security.TokenService;
import br.com.fieldops.api.presentation.dto.LoginRequestDTO;
import br.com.fieldops.api.presentation.dto.TokenResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@Tag(name = "Autenticação", description = "Endpoints para autenticação de usuários")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    @Operation(
        summary = "Realizar login",
        description = "Autentica um usuário e retorna um token JWT para acesso à API"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Login realizado com sucesso",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = TokenResponseDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Credenciais inválidas",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Dados da requisição inválidos",
            content = @Content
        )
    })
    public ResponseEntity<TokenResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
        try {
            // 1. Cria objeto de autenticação com email e senha
            UsernamePasswordAuthenticationToken usernamePassword = 
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha());

            // 2. Autentica o usuário
            Authentication auth = authenticationManager.authenticate(usernamePassword);

            // 3. Busca o usuário no banco
            Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            // 4. Gera o token JWT
            String token = tokenService.gerarToken(usuario);

            // 5. Cria resposta com token e dados do usuário
            TokenResponseDTO response = new TokenResponseDTO(
                token,
                usuario.getPerfil().name(),
                usuario.getNome(),
                usuario.getEmail()
            );

            return ResponseEntity.ok(response);
            
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/me")
    @Operation(
        summary = "Obter dados do usuário logado",
        description = "Retorna os dados do usuário com base no Token JWT enviado no Header Authorization",
        security = @SecurityRequirement(name = "bearer-key")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Usuário autenticado e token válido"
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Token ausente, inválido ou expirado"
        )
    })
    public ResponseEntity<TokenResponseDTO> me(@AuthenticationPrincipal Usuario usuario) {
        TokenResponseDTO response = new TokenResponseDTO(
            null,
            usuario.getPerfil().name(),
            usuario.getNome(),
            usuario.getEmail()
        );
        return ResponseEntity.ok(response);
    }
}