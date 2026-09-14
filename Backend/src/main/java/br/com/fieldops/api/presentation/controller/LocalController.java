package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.service.LocalService;
import br.com.fieldops.api.presentation.dto.LocalRequestDTO;
import br.com.fieldops.api.presentation.dto.LocalResponseDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locais")
public class LocalController {

    @Autowired
    private LocalService localService;

    @PostMapping
    public ResponseEntity<LocalResponseDTO> criar(@RequestBody @Valid LocalRequestDTO dto) {
        LocalResponseDTO response = localService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<LocalResponseDTO>> listarTodos() {
        return ResponseEntity.ok(localService.listarTodos());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<LocalResponseDTO>> listarPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(localService.listarPorCliente(clienteId));
    }
}