# CartBack - Sistema de Recuperação de Carrinhos Abandonados

Sistema completo para recuperação de carrinhos abandonados via WhatsApp, integrado com Nuvemshop.

## 🚀 Features Implementadas

✅ Autenticação Multi-Tenant com roles  
✅ Dashboard com métricas e gráficos  
✅ Integração Nuvemshop via OAuth2  
✅ WhatsApp via Evolution API  
✅ Templates de mensagens personalizáveis  
✅ Gestão de carrinhos abandonados  
✅ Sistema de filas com BullMQ

## 🛠 Stack Tecnológico

**Backend:** AdonisJS 6 + TypeScript + MySQL + Redis  
**Frontend:** React + TypeScript + Vite + Material-UI  
**Mensageria:** Evolution API (WhatsApp) + BullMQ

## 🚦 Como Rodar

### 1. Iniciar Serviços Docker
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd apps/api
pnpm install
cp .env.example .env
node ace generate:key
node --import tsx ace.js migration:run
node --import tsx ace.js db:seed
node --import tsx ace.js serve --watch
```

### 3. Frontend
```bash
cd apps/web
pnpm install
pnpm dev
```

## 🔑 Credenciais Padrão

Email: admin@cartback.com
Senha: password123

## 📱 Conectar WhatsApp

Veja o guia completo em [WHATSAPP_GUIDE.md](./WHATSAPP_GUIDE.md)

**Resumo rápido:**
1. Acesse o menu WhatsApp no sistema
2. Clique em "Conectar WhatsApp"
3. Aguarde o QR Code aparecer na tela (alguns segundos)
4. Escaneie o QR Code com seu WhatsApp
5. Pronto! Status atualiza automaticamente

**Limpar tudo e recomeçar:**
```bash
./scripts/clean-whatsapp.sh
```

## 📚 Endpoints Principais

**Auth:** POST /api/auth/login | register  
**Dashboard:** GET /api/dashboard/stats | chart  
**WhatsApp:** GET/POST /api/whatsapp  
**Templates:** GET/POST/PUT/DELETE /api/templates  
**Carrinhos:** GET /api/carts

## 🎯 Próximos Passos

- [ ] Implementar mais integrações (Shopify, WooCommerce)
- [ ] Sistema de relatórios avançados
- [ ] Testes automatizados
- [ ] CI/CD

---
**Desenvolvido por Leonardo Leite**
