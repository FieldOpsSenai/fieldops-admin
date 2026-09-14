package br.com.fieldops.api.domain.repository;

import br.com.fieldops.api.domain.entity.Equipamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipamentoRepository extends JpaRepository<Equipamento, Long> {
    List<Equipamento> findByLocalIdAndAtivoTrue(Long localId);
    List<Equipamento> findByAtivoTrue();
    Optional<Equipamento> findByNumeroSerie(String numeroSerie);
    boolean existsByNumeroSerie(String numeroSerie);
}