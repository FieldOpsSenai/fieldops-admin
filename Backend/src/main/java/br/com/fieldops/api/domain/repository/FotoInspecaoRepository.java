package br.com.fieldops.api.domain.repository;

import br.com.fieldops.api.domain.entity.FotoInspecao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FotoInspecaoRepository extends JpaRepository<FotoInspecao, Long> {

    List<FotoInspecao> findByInspecaoId(Long inspecaoId);
}