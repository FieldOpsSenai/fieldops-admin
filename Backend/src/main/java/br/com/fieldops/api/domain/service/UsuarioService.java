package br.com.fieldops.api.domain.service;

import br.com.fieldops.api.domain.entity.Perfil;
import br.com.fieldops.api.domain.entity.Usuario;
import br.com.fieldops.api.domain.repository.UsuarioRepository;
import br.com.fieldops.api.presentation.dto.UsuarioRequestDTO;
import br.com.fieldops.api.presentation.dto.UsuarioResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Já existe um usuário cadastrado com o e-mail: " + dto.getEmail());
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setPerfil(dto.getPerfil());
        usuario.setAtivo(true);

        return new UsuarioResponseDTO(usuarioRepository.save(usuario));
    }

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findByAtivoTrue().stream()
                .map(UsuarioResponseDTO::new)
                .toList();
    }

    public List<UsuarioResponseDTO> listarPorPerfil(Perfil perfil) {
        return usuarioRepository.findByPerfilAndAtivoTrue(perfil).stream()
                .map(UsuarioResponseDTO::new)
                .toList();
    }
}