package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.service.InspecaoService;
import br.com.fieldops.api.presentation.dto.InspecaoRequestDTO;
import br.com.fieldops.api.presentation.dto.InspecaoResponseDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fieldops.api.presentation.dto.InspecaoStatusDTO;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspecoes")
public class InspecaoController {

    @Autowired
    private InspecaoService inspecaoService;

    @PostMapping
    public ResponseEntity<InspecaoResponseDTO> criar(@RequestBody @Valid InspecaoRequestDTO dto) {
        InspecaoResponseDTO response = inspecaoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<InspecaoResponseDTO>> listarTodas() {
        return ResponseEntity.ok(inspecaoService.listarTodas());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<InspecaoResponseDTO>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(inspecaoService.listarPorUsuario(usuarioId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InspecaoResponseDTO> atualizarStatus(
            @PathVariable Long id,
            @RequestBody @Valid InspecaoStatusDTO dto) {
        
        InspecaoResponseDTO response = inspecaoService.atualizarStatus(id, dto);
        return ResponseEntity.ok(response);
    }
}