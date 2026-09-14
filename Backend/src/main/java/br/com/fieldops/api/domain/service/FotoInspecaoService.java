package br.com.fieldops.api.domain.service;

import br.com.fieldops.api.domain.entity.FotoInspecao;
import br.com.fieldops.api.domain.entity.Inspecao;
import br.com.fieldops.api.domain.repository.FotoInspecaoRepository;
import br.com.fieldops.api.domain.repository.InspecaoRepository;
import br.com.fieldops.api.presentation.dto.FotoInspecaoResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
public class FotoInspecaoService {

    private final Path diretorioUpload = Paths.get("uploads/fotos");

    @Autowired
    private FotoInspecaoRepository fotoInspecaoRepository;

    @Autowired
    private InspecaoRepository inspecaoRepository;

    @Transactional
    public FotoInspecaoResponseDTO salvarFoto(Long inspecaoId, MultipartFile arquivo) {
        Inspecao inspecao = inspecaoRepository.findById(inspecaoId)
                .orElseThrow(() -> new IllegalArgumentException("Inspeção não encontrada com o ID: " + inspecaoId));

        if (arquivo.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de foto enviado está vazio.");
        }

        try {
            if (!Files.exists(diretorioUpload)) {
                Files.createDirectories(diretorioUpload);
            }

            String nomeOriginal = arquivo.getOriginalFilename();
            String extensao = "";
            if (nomeOriginal != null && nomeOriginal.contains(".")) {
                extensao = nomeOriginal.substring(nomeOriginal.lastIndexOf("."));
            }

            String nomeArquivoSalvo = UUID.randomUUID() + extensao;
            Path caminhoCompleto = diretorioUpload.resolve(nomeArquivoSalvo);

            Files.copy(arquivo.getInputStream(), caminhoCompleto, StandardCopyOption.REPLACE_EXISTING);

            FotoInspecao foto = new FotoInspecao();
            foto.setNomeArquivo(nomeArquivoSalvo);
            foto.setCaminhoArquivo(caminhoCompleto.toString());
            foto.setTipoConteudo(arquivo.getContentType());
            foto.setDataUpload(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")));
            foto.setInspecao(inspecao);

            return new FotoInspecaoResponseDTO(fotoInspecaoRepository.save(foto));

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar a foto no servidor: " + e.getMessage(), e);
        }
    }

    public List<FotoInspecaoResponseDTO> listarPorInspecao(Long inspecaoId) {
        return fotoInspecaoRepository.findByInspecaoId(inspecaoId).stream()
                .map(FotoInspecaoResponseDTO::new)
                .toList();
    }
}