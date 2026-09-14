package br.com.fieldops.api.domain.service;

import br.com.fieldops.api.domain.entity.Equipamento;
import br.com.fieldops.api.domain.entity.Local;
import br.com.fieldops.api.domain.repository.EquipamentoRepository;
import br.com.fieldops.api.domain.repository.LocalRepository;
import br.com.fieldops.api.presentation.dto.EquipamentoRequestDTO;
import br.com.fieldops.api.presentation.dto.EquipamentoResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EquipamentoService {

    @Autowired
    private EquipamentoRepository equipamentoRepository;

    @Autowired
    private LocalRepository localRepository;

    @Transactional
    public EquipamentoResponseDTO criar(EquipamentoRequestDTO dto) {
        if (equipamentoRepository.existsByNumeroSerie(dto.getNumeroSerie())) {
            throw new IllegalArgumentException("Já existe um equipamento cadastrado com o número de série: " + dto.getNumeroSerie());
        }

        Local local = localRepository.findById(dto.getLocalId())
                .orElseThrow(() -> new EntityNotFoundException("Local não encontrado com ID: " + dto.getLocalId()));

        Equipamento equipamento = new Equipamento();
        equipamento.setNome(dto.getNome());
        equipamento.setNumeroSerie(dto.getNumeroSerie());
        equipamento.setTipo(dto.getTipo());
        equipamento.setLocal(local);
        equipamento.setAtivo(true);

        return new EquipamentoResponseDTO(equipamentoRepository.save(equipamento));
    }

    public List<EquipamentoResponseDTO> listarTodos() {
        return equipamentoRepository.findByAtivoTrue().stream()
                .map(EquipamentoResponseDTO::new)
                .toList();
    }

    public List<EquipamentoResponseDTO> listarPorLocal(Long localId) {
        return equipamentoRepository.findByLocalIdAndAtivoTrue(localId).stream()
                .map(EquipamentoResponseDTO::new)
                .toList();
    }
}