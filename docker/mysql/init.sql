-- Script de inicialização do MySQL para CartBack
-- Cria databases adicionais necessários

-- Database para a Evolution API
CREATE DATABASE IF NOT EXISTS cartback_evolution;
GRANT ALL PRIVILEGES ON cartback_evolution.* TO 'cartback'@'%';

-- Flush privileges para aplicar as mudanças
FLUSH PRIVILEGES;
