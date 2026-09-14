package br.com.fieldops.api.domain.service;

import br.com.fieldops.api.domain.entity.Equipamento;
import br.com.fieldops.api.domain.entity.Inspecao;
import br.com.fieldops.api.domain.entity.Perfil;
import br.com.fieldops.api.domain.entity.StatusInspecao;
import br.com.fieldops.api.domain.entity.Usuario;
import br.com.fieldops.api.domain.repository.EquipamentoRepository;
import br.com.fieldops.api.domain.repository.InspecaoRepository;
import br.com.fieldops.api.domain.repository.UsuarioRepository;
import br.com.fieldops.api.presentation.dto.InspecaoRequestDTO;
import br.com.fieldops.api.presentation.dto.InspecaoResponseDTO;
import br.com.fieldops.api.presentation.dto.InspecaoStatusDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class InspecaoService {

    @Autowired
    private InspecaoRepository inspecaoRepository;

    @Autowired
    private EquipamentoRepository equipamentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public InspecaoResponseDTO criar(InspecaoRequestDTO dto) {
        Equipamento equipamento = equipamentoRepository.findById(dto.getEquipamentoId())
                .orElseThrow(() -> new IllegalArgumentException("Equipamento não encontrado com o ID: " + dto.getEquipamentoId()));

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com o ID: " + dto.getUsuarioId()));

        // TRAVA DE SEGURANÇA: Garante que apenas usuários com perfil TECNICO recebam a inspeção
        if (!Perfil.TECNICO.equals(usuario.getPerfil())) {
            throw new IllegalArgumentException("A inspeção só pode ser atribuída a um usuário com perfil TÉCNICO.");
        }

        Inspecao inspecao = new Inspecao();
        inspecao.setDescricao(dto.getDescricao());
        inspecao.setDataAgendada(dto.getDataAgendada());
        inspecao.setObservacoes(dto.getObservacoes());
        inspecao.setEquipamento(equipamento);
        inspecao.setUsuario(usuario);
        inspecao.setStatus(StatusInspecao.PENDENTE);

        return new InspecaoResponseDTO(inspecaoRepository.save(inspecao));
    }

    public List<InspecaoResponseDTO> listarTodas() {
        return inspecaoRepository.findAll().stream()
                .map(InspecaoResponseDTO::new)
                .toList();
    }

    public List<InspecaoResponseDTO> listarPorUsuario(Long usuarioId) {
        return inspecaoRepository.findByUsuarioId(usuarioId).stream()
                .map(InspecaoResponseDTO::new)
                .toList();
    }

    @Transactional
    public InspecaoResponseDTO atualizarStatus(Long id, InspecaoStatusDTO dto) {
        Inspecao inspecao = inspecaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inspeção não encontrada com o ID: " + id));

        inspecao.setStatus(dto.getStatus());

        if (dto.getObservacoes() != null && !dto.getObservacoes().isBlank()) {
            inspecao.setObservacoes(dto.getObservacoes());
        }

        if (StatusInspecao.CONCLUIDA.equals(dto.getStatus())) {
            inspecao.setDataRealizacao(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")));
        }

        return new InspecaoResponseDTO(inspecaoRepository.save(inspecao));
    }
}