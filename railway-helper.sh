#!/bin/bash

# 🚂 Railway Helper Script para Cartback
# Este script facilita operações comuns no Railway

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🚂 Cartback Railway Helper           ║"
echo "╔════════════════════════════════════════╗"
echo -e "${NC}"

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI não encontrado!${NC}"
    echo -e "${YELLOW}Instale com: npm install -g @railway/cli${NC}"
    exit 1
fi

# Menu
echo "Escolha uma opção:"
echo ""
echo "1) 📊 Ver status de todos os services"
echo "2) 📝 Ver logs da API"
echo "3) 📝 Ver logs dos Workers"
echo "4) 📝 Ver logs do Web"
echo "5) 🔄 Restart API"
echo "6) 🔄 Restart Workers"
echo "7) 🔄 Restart Web"
echo "8) 🗄️  Rodar migrations"
echo "9) 🌱 Rodar seeders"
echo "10) 🔑 Gerar nova APP_KEY"
echo "11) 🚀 Deploy manual de todos os services"
echo "12) 🔍 Ver variáveis de ambiente da API"
echo "13) ❌ Sair"
echo ""
read -p "Digite o número da opção: " option

case $option in
    1)
        echo -e "${GREEN}📊 Status dos services...${NC}"
        railway status
        ;;
    2)
        echo -e "${GREEN}📝 Logs da API (Ctrl+C para sair)${NC}"
        railway logs -s cartback-api
        ;;
    3)
        echo -e "${GREEN}📝 Logs dos Workers (Ctrl+C para sair)${NC}"
        railway logs -s cartback-workers
        ;;
    4)
        echo -e "${GREEN}📝 Logs do Web (Ctrl+C para sair)${NC}"
        railway logs -s cartback-web
        ;;
    5)
        echo -e "${YELLOW}🔄 Reiniciando API...${NC}"
        railway restart -s cartback-api
        echo -e "${GREEN}✅ API reiniciada!${NC}"
        ;;
    6)
        echo -e "${YELLOW}🔄 Reiniciando Workers...${NC}"
        railway restart -s cartback-workers
        echo -e "${GREEN}✅ Workers reiniciados!${NC}"
        ;;
    7)
        echo -e "${YELLOW}🔄 Reiniciando Web...${NC}"
        railway restart -s cartback-web
        echo -e "${GREEN}✅ Web reiniciado!${NC}"
        ;;
    8)
        echo -e "${YELLOW}🗄️  Rodando migrations...${NC}"
        railway run -s cartback-api node ace migration:run --force
        echo -e "${GREEN}✅ Migrations executadas!${NC}"
        ;;
    9)
        echo -e "${YELLOW}🌱 Rodando seeders...${NC}"
        railway run -s cartback-api node ace db:seed
        echo -e "${GREEN}✅ Seeders executados!${NC}"
        ;;
    10)
        echo -e "${YELLOW}🔑 Gerando nova APP_KEY...${NC}"
        cd apps/api
        APP_KEY=$(node ace generate:key --show)
        echo ""
        echo -e "${GREEN}Nova APP_KEY gerada:${NC}"
        echo -e "${BLUE}${APP_KEY}${NC}"
        echo ""
        echo "Copie e adicione no Railway:"
        echo "1. Vá no service cartback-api no Railway"
        echo "2. Settings → Variables"
        echo "3. Adicione/atualize APP_KEY com o valor acima"
        echo "4. Faça o mesmo no cartback-workers"
        ;;
    11)
        echo -e "${YELLOW}🚀 Fazendo deploy de todos os services...${NC}"
        echo "Deployando API..."
        railway up -s cartback-api
        echo "Deployando Workers..."
        railway up -s cartback-workers
        echo "Deployando Web..."
        railway up -s cartback-web
        echo -e "${GREEN}✅ Todos os services foram deployados!${NC}"
        ;;
    12)
        echo -e "${GREEN}🔍 Variáveis de ambiente da API:${NC}"
        railway variables -s cartback-api
        ;;
    13)
        echo -e "${BLUE}👋 Até logo!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Operação concluída!${NC}"
