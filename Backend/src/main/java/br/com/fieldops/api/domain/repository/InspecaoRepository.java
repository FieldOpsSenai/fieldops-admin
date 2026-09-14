package br.com.fieldops.api.domain.repository;

import br.com.fieldops.api.domain.entity.Inspecao;
import br.com.fieldops.api.domain.entity.StatusInspecao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspecaoRepository extends JpaRepository<Inspecao, Long> {

    List<Inspecao> findByUsuarioId(Long usuarioId);

    List<Inspecao> findByStatus(StatusInspecao status);

    List<Inspecao> findByUsuarioIdAndStatus(Long usuarioId, StatusInspecao status);
}