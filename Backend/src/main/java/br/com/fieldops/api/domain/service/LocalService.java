package br.com.fieldops.api.domain.service;

import br.com.fieldops.api.domain.entity.Cliente;
import br.com.fieldops.api.domain.entity.Local;
import br.com.fieldops.api.domain.repository.ClienteRepository;
import br.com.fieldops.api.domain.repository.LocalRepository;
import br.com.fieldops.api.presentation.dto.LocalRequestDTO;
import br.com.fieldops.api.presentation.dto.LocalResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LocalService {

    @Autowired
    private LocalRepository localRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public LocalResponseDTO criar(LocalRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado com ID: " + dto.getClienteId()));

        Local local = new Local();
        local.setNome(dto.getNome());
        local.setEndereco(dto.getEndereco());
        local.setCliente(cliente);
        local.setAtivo(true);

        return new LocalResponseDTO(localRepository.save(local));
    }

    public List<LocalResponseDTO> listarTodos() {
        return localRepository.findByAtivoTrue().stream()
                .map(LocalResponseDTO::new)
                .toList();
    }

    public List<LocalResponseDTO> listarPorCliente(Long clienteId) {
        return localRepository.findByClienteIdAndAtivoTrue(clienteId).stream()
                .map(LocalResponseDTO::new)
                .toList();
    }
}