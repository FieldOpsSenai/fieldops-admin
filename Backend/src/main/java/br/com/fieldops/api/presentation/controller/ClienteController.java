package br.com.fieldops.api.presentation.controller;

import br.com.fieldops.api.domain.entity.Cliente;
import br.com.fieldops.api.domain.repository.ClienteRepository;
import br.com.fieldops.api.presentation.dto.ClienteRequestDTO;
import br.com.fieldops.api.presentation.dto.ClienteResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/clientes")
@CrossOrigin(origins = "*")
@Tag(name = "Clientes", description = "Endpoints para gerenciamento de clientes")
@SecurityRequirement(name = "bearer-key")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @PostMapping
    @Operation(summary = "Cadastrar novo cliente")
    public ResponseEntity<?> cadastrar(@RequestBody @Valid ClienteRequestDTO dto) {
        if (clienteRepository.existsByCnpj(dto.getCnpj())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Já existe um cliente cadastrado com este CNPJ");
        }

        if (clienteRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Já existe um cliente cadastrado com este e-mail");
        }

        Cliente cliente = new Cliente();
        cliente.setNome(dto.getNome());
        cliente.setCnpj(dto.getCnpj());
        cliente.setTelefone(dto.getTelefone());
        cliente.setEmail(dto.getEmail());
        cliente.setAtivo(true);

        Cliente clienteSalvo = clienteRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteResponseDTO(clienteSalvo));
    }

    @GetMapping
    @Operation(summary = "Listar todos os clientes")
    public ResponseEntity<List<ClienteResponseDTO>> listar() {
        List<ClienteResponseDTO> clientes = clienteRepository.findAll()
                .stream()
                .map(ClienteResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID")
    public ResponseEntity<ClienteResponseDTO> buscarPorId(@PathVariable Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(EntityNotFoundException::new);

        return ResponseEntity.ok(new ClienteResponseDTO(cliente));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Inativar cliente (RN-013)")
    public ResponseEntity<Void> inativar(@PathVariable Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(EntityNotFoundException::new);

        cliente.setAtivo(false);
        clienteRepository.save(cliente);

        return ResponseEntity.noContent().build();
    }
}