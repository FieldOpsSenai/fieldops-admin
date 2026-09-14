package br.com.fieldops.api.infrastructure.security;

import br.com.fieldops.api.domain.entity.Usuario;
import br.com.fieldops.api.domain.entity.Perfil; // Ou o Enum de perfil do seu projeto
import br.com.fieldops.api.domain.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        var usuarioOpt = usuarioRepository.findByEmail("admin@fieldops.com");
        
        Usuario usuario;
        if (usuarioOpt.isPresent()) {
            usuario = usuarioOpt.get();
        } else {
            usuario = new Usuario();
            usuario.setEmail("admin@fieldops.com");
            usuario.setNome("Admin");
            // Se o Enum do seu projeto tiver outro nome (ex: PerfilUsuario.ADMINISTRADOR), ajustaremos na hora
            usuario.setPerfil(Perfil.ADMINISTRADOR);
        }
        
        usuario.setSenha(passwordEncoder.encode("123456"));
        usuario.setAtivo(true);
        
        usuarioRepository.save(usuario);
        System.out.println(">>> USUÁRIO ADMIN REINICIALIZADO COM SUCESSO! <<<");
    }
}