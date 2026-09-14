package br.com.fieldops.api.domain.repository;

import br.com.fieldops.api.domain.entity.Local;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocalRepository extends JpaRepository<Local, Long> {
    List<Local> findByClienteIdAndAtivoTrue(Long clienteId);
    List<Local> findByAtivoTrue();
}