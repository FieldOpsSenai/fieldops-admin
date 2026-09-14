package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.service.FotoInspecaoService;
import br.com.fieldops.api.presentation.dto.FotoInspecaoResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspecoes/{inspecaoId}/fotos")
public class FotoInspecaoController {

    @Autowired
    private FotoInspecaoService fotoInspecaoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FotoInspecaoResponseDTO> uploadFoto(
            @PathVariable Long inspecaoId,
            @RequestParam("arquivo") MultipartFile arquivo) {

        FotoInspecaoResponseDTO response = fotoInspecaoService.salvarFoto(inspecaoId, arquivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<FotoInspecaoResponseDTO>> listarFotos(@PathVariable Long inspecaoId) {
        return ResponseEntity.ok(fotoInspecaoService.listarPorInspecao(inspecaoId));
    }
}