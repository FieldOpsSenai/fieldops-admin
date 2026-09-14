package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.service.EquipamentoService;
import br.com.fieldops.api.presentation.dto.EquipamentoRequestDTO;
import br.com.fieldops.api.presentation.dto.EquipamentoResponseDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/equipamentos")
public class EquipamentoController {

    @Autowired
    private EquipamentoService equipamentoService;

    @PostMapping
    public ResponseEntity<EquipamentoResponseDTO> criar(@RequestBody @Valid EquipamentoRequestDTO dto) {
        EquipamentoResponseDTO response = equipamentoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EquipamentoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(equipamentoService.listarTodos());
    }

    @GetMapping("/local/{localId}")
    public ResponseEntity<List<EquipamentoResponseDTO>> listarPorLocal(@PathVariable Long localId) {
        return ResponseEntity.ok(equipamentoService.listarPorLocal(localId));
    }
}