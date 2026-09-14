package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.entity.Perfil;
import br.com.fieldops.api.domain.service.UsuarioService;
import br.com.fieldops.api.presentation.dto.UsuarioRequestDTO;
import br.com.fieldops.api.presentation.dto.UsuarioResponseDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> criar(@RequestBody @Valid UsuarioRequestDTO dto) {
        UsuarioResponseDTO response = usuarioService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/perfil/{perfil}")
    public ResponseEntity<List<UsuarioResponseDTO>> listarPorPerfil(@PathVariable Perfil perfil) {
        return ResponseEntity.ok(usuarioService.listarPorPerfil(perfil));
    }
}