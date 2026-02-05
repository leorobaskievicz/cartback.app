# Guia de Conexão WhatsApp - CartBack

## Como Conectar o WhatsApp

### 1. Acesse a Página WhatsApp
- Faça login no CartBack
- Vá em **Menu > WhatsApp**

### 2. Conectar Nova Instância
1. Clique no botão **"Conectar WhatsApp"**
2. O sistema irá:
   - Deletar qualquer instância antiga
   - Criar uma nova instância no Evolution API
   - Mostrar "Gerando QR Code..." com skeleton
   - Aguardar webhook para exibir QR Code

### 3. Escanear QR Code
1. **QR Code aparece automaticamente no CartBack** (alguns segundos após criar)

2. No WhatsApp do celular:
   - Vá em **Configurações > Dispositivos Vinculados**
   - Toque em **"Vincular um dispositivo"**
   - Escaneie o QR Code exibido diretamente na tela do CartBack

### 4. Status Atualiza Automaticamente
- Após escanear, o CartBack detecta automaticamente a conexão
- O status muda de "Aguardando Conexão" para "WhatsApp Conectado"
- O número conectado é exibido

## Gerenciamento

### Ver Status
O dashboard do WhatsApp mostra 4 estados:

1. **Não Conectado** (sem instância)
   - Ícone: QR Code cinza
   - Ação: Botão "Conectar WhatsApp"

2. **Gerando QR Code** (instância criada, aguardando webhook)
   - Skeleton animado (256x256)
   - Mensagem: "Gerando QR Code..."
   - Dura alguns segundos

3. **Aguardando Conexão** (QR Code exibido)
   - QR Code grande (256x256) direto na tela
   - Mensagem: "Escaneie o QR Code"
   - Instruções de como vincular
   - Botão "Cancelar"

4. **Conectado** (WhatsApp ativo)
   - Ícone: Check verde
   - Mostra número do WhatsApp
   - Botão "Desconectar"

### Desconectar
1. Clique em **"Desconectar"**
2. Confirme a ação
3. O sistema:
   - Faz logout no Evolution API
   - Remove credenciais do banco
   - Status volta para "Não Conectado"

### Reconectar
- Após desconectar, basta clicar novamente em **"Conectar WhatsApp"**
- O sistema limpa automaticamente a instância antiga antes de criar nova

## Comandos Úteis

### Limpar Tudo (Reset Completo)
```bash
./scripts/clean-whatsapp.sh
```

### Verificar Instâncias na Evolution API
```bash
curl -X GET 'http://localhost:8080/instance/fetchInstances' \
  -H 'apikey: cartback_dev_key_123' | python3 -m json.tool
```

### Deletar Instância Manualmente
```bash
curl -X DELETE 'http://localhost:8080/instance/delete/NOME_DA_INSTANCIA' \
  -H 'apikey: cartback_dev_key_123'
```

### Verificar Banco de Dados
```bash
docker exec cartback-mysql mysql -uroot -proot cartback \
  -e "SELECT * FROM whatsapp_instances;"
```

## Troubleshooting

### Erro: "This name is already in use"
- **Causa**: Instância antiga não foi deletada
- **Solução**: Execute `./scripts/clean-whatsapp.sh`

### Erro: "ALREADY_CONNECTED"
- **Causa**: Já existe uma instância conectada
- **Solução**: Desconecte primeiro antes de criar nova

### QR Code não aparece (fica no skeleton)
- **Causa**: Webhook QRCODE_UPDATED não chegou
- **Solução**:
  1. Verifique se Evolution API está rodando: `docker ps`
  2. Verifique logs do backend: `node ace serve --watch`
  3. Execute `./scripts/clean-whatsapp.sh`
  4. Conecte novamente

### Status fica em "Aguardando Conexão"
- **Causa**: QR Code não foi escaneado ou expirou
- **Solução**:
  1. Cancele e desconecte
  2. Execute `./scripts/clean-whatsapp.sh`
  3. Conecte novamente
  4. Escaneie rapidamente (QR expira em ~60 segundos)

### WhatsApp desconecta sozinho
- **Causa**: Sessão pode ter sido encerrada no celular
- **Solução**:
  1. Verifique no celular se ainda está vinculado
  2. Se não estiver, desconecte no CartBack
  3. Conecte novamente

## Arquitetura Técnica

### Componentes
1. **CartBack API** (`apps/api`)
   - Controller: `whatsapp_controller.ts`
   - Service: `evolution_api_service.ts`
   - Model: `WhatsappInstance`

2. **CartBack Web** (`apps/web`)
   - Página: `WhatsApp.tsx`
   - API Client: `services/api.ts`

3. **Evolution API** (Docker)
   - Versão: v2.1.1
   - Porta: 8080
   - Manager UI: http://localhost:8080/manager

### Fluxo de Conexão

```
Frontend          API              Evolution API     Database
   |               |                     |               |
   |--connect----->|                     |               |
   |               |--fetchInstances---->|               |
   |               |<---instances[]------|               |
   |               |--deleteAll--------->|               |
   |               |<---success----------|               |
   |               |                     |               |
   |               |--createInstance---->|               |
   |               |<---created----------|               |
   |               |--save instance--------------------->|
   |<--success-----|                     |               |
   |                                     |               |
   [Shows "Gerando QR Code..." skeleton]|               |
   |                                     |               |
   |--pollStatus-->|                     |               |
   |<--connecting--|                     |               |
   |--pollQrCode-->|                     |               |
   |<--null--------|                     |               |
   |                                     |               |
   |               |<--webhook:QRCODE_UPDATED------------|
   |               |--save QR Code--------------------->  |
   |                                     |                |
   |--pollQrCode-->|                     |                |
   |               |--query QR Code-------------------->  |
   |<--QR base64---|<--QR Code--------------------------|  |
   |                                                     |
   [Shows QR Code image 256x256]                        |
   [User scans with WhatsApp]                           |
   |                                                     |
   |               |<--webhook:CONNECTION_UPDATE---------|
   |               |--update status=connected---------->  |
   |--pollStatus-->|                                     |
   |               |--query instance------------------->  |
   |<--connected---|<--instance data--------------------|  |
   |                                                     |
   [UI updates to "WhatsApp Conectado" with phone number]
```

### Webhook Events
O Evolution API notifica o CartBack sobre:
- `CONNECTION_UPDATE` - Conexão/desconexão
- `QRCODE_UPDATED` - QR Code atualizado
- `MESSAGES_UPSERT` - Mensagens recebidas

## Configurações

### Environment Variables (.env)
```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=cartback_dev_key_123
APP_URL=http://localhost:3333
```

### Docker Compose
```yaml
evolution:
  image: atendai/evolution-api:v2.1.1
  ports:
    - "8080:8080"
  environment:
    - AUTHENTICATION_API_KEY=cartback_dev_key_123
    - DATABASE_ENABLED=true
    - REDIS_ENABLED=false
```

## Segurança

### Produção
1. **Mude a API Key** do Evolution API
2. **Use HTTPS** para webhook e Manager
3. **Configure firewall** para proteger porta 8080
4. **Valide webhook** com assinatura
5. **Use variáveis de ambiente** para credenciais

### Exemplo .env Produção
```env
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua_chave_secreta_aqui
APP_URL=https://api.cartback.com
```
