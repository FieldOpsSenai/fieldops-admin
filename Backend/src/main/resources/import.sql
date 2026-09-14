-- Povoamento inicial do banco para testes (Senha padrão: 123456)
INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES ('Admin', 'admin@fieldops.com', '$2a$10$e88yR2u/E4E1/P8g7tL5.O1mB/g.J2oK12L3M4N5O6P7Q8R9S0T1U', 'ADMINISTRADOR', true);
INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES ('Carlos Tecnico', 'tecnico@fieldops.com', '$2a$10$e88yR2u/E4E1/P8g7tL5.O1mB/g.J2oK12L3M4N5O6P7Q8R9S0T1U', 'TECNICO', true);

-- Cliente inicial para testes de integração
INSERT INTO clientes (nome, cnpj, telefone, email, ativo) VALUES ('Empresa Teste LTDA', '12345678000195', '11999998888', 'contato@empresateste.com', true);

-- Local inicial associado ao Cliente (ID 1)
INSERT INTO locais (nome, endereco, ativo, cliente_id) VALUES ('Unidade Matriz', 'Av. Principal, 1000', true, 1);

-- Equipamento inicial associado ao Local (ID 1)
INSERT INTO equipamentos (nome, numero_serie, ativo, local_id) VALUES ('Gerador a Diesel X1', 'GER-12345', true, 1);