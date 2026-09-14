package br.com.fieldops.api.domain.repository;

import br.com.fieldops.api.domain.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Método utilitário para validar se o CNPJ já está cadastrado antes de salvar
    boolean existsByCnpj(String cnpj);

    Optional<Cliente> findByCnpj(String cnpj);

    // Métodos utilitários para validação e busca por e-mail
    boolean existsByEmail(String email);

    Optional<Cliente> findByEmail(String email);
}