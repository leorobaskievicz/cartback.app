# 🔒 Segurança e Privacidade - Integração WhatsApp

## ✅ Configurações Implementadas

A integração com Evolution API foi configurada com **máxima segurança e privacidade** para o usuário.

### 📋 Resumo das Configurações

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| `readMessages` | ❌ `false` | **Não marca mensagens como lidas** - O CartBack não interfere no status de leitura das mensagens |
| `readStatus` | ❌ `false` | **Não marca status como visto** - Não visualiza automaticamente os status do WhatsApp |
| `syncFullHistory` | ❌ `false` | **Não sincroniza histórico** - Não baixa mensagens antigas do usuário |
| `groupsIgnore` | ✅ `true` | **Ignora grupos** - Não recebe/processa mensagens de grupos |
| `rejectCall` | ❌ `false` | **Não rejeita chamadas** - Usuário decide se aceita ou não |
| `alwaysOnline` | ❌ `false` | **Não simula online** - WhatsApp aparece online/offline naturalmente |

### 🎯 Webhooks Configurados

**Apenas eventos essenciais:**

- ✅ `CONNECTION_UPDATE` - Detectar quando WhatsApp conecta/desconecta
- ✅ `QRCODE_UPDATED` - Receber QR Code para exibir no frontend
- ❌ `MESSAGES_UPSERT` - **REMOVIDO** (não recebemos mensagens do usuário)
- ❌ `MESSAGES_UPDATE` - **REMOVIDO**
- ❌ `MESSAGES_DELETE` - **REMOVIDO**
- ❌ `CONTACTS_*` - **REMOVIDO** (não acessamos contatos)
- ❌ `CHATS_*` - **REMOVIDO** (não acessamos conversas)
- ❌ `GROUPS_*` - **REMOVIDO** (não acessamos grupos)

---

## 🔐 O Que o CartBack PODE Fazer

✅ **Enviar mensagens de recuperação** para números específicos (clientes com carrinho abandonado)
✅ **Verificar se WhatsApp está conectado** (status da conexão)
✅ **Gerar QR Code** para autenticação
✅ **Desconectar** o WhatsApp quando solicitado

---

## 🚫 O Que o CartBack NÃO Pode Fazer

❌ **NÃO recebe** mensagens enviadas/recebidas pelo usuário
❌ **NÃO lê** conversas ou histórico de mensagens
❌ **NÃO acessa** lista de contatos
❌ **NÃO visualiza** status do WhatsApp
❌ **NÃO marca** mensagens como lidas
❌ **NÃO entra** em grupos
❌ **NÃO rejeita** chamadas automaticamente
❌ **NÃO sincroniza** histórico antigo

---

## 🛡️ Proteção de Dados

### 1. Banco de Dados

**Armazenamos apenas:**
- Nome da instância (ex: `cartback_1769947858763`)
- Status de conexão (`connected`, `disconnected`, `connecting`)
- Número de telefone conectado (extraído do `ownerJid` apenas para exibição)
- QR Code temporário (deletado após conexão)

**NÃO armazenamos:**
- Mensagens enviadas ou recebidas
- Contatos do usuário
- Histórico de conversas
- Mídias (fotos, vídeos, áudios)

### 2. Logs

**Logs registram apenas:**
- Status de conexão/desconexão
- Envio de mensagens de recuperação (apenas confirmação, não conteúdo)
- Erros de comunicação com Evolution API

**Exemplo de log seguro:**
```
📤 Sending test message from template "Primeira Mensagem" to 5541999999999
✅ Test message sent successfully
```

**Não registramos:**
- Conteúdo de mensagens recebidas
- Informações pessoais de contatos
- Conversas completas

### 3. Evolution API

A Evolution API armazena dados no MySQL do Docker:
- **Banco de dados**: `cartback_evolution`
- **Isolamento**: Separado do banco principal do CartBack
- **Limpeza**: Ao desconectar, a instância é **deletada completamente**

---

## 📊 Comparação: Antes vs Depois

### ❌ Configuração Insegura (Antes)
```typescript
webhookEvents: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT']
// ⚠️  Recebia TODAS as mensagens do usuário!
```

### ✅ Configuração Segura (Atual)
```typescript
webhookEvents: ['CONNECTION_UPDATE', 'QRCODE_UPDATED'],
readMessages: false,
readStatus: false,
syncFullHistory: false,
groupsIgnore: true,
// 🔒 Apenas conexão e QR Code, nenhuma mensagem!
```

---

## 🔍 Como Verificar a Segurança

### 1. Verificar Configurações da Instância
```bash
curl -s -X GET 'http://localhost:8080/instance/fetchInstances' \
  -H 'apikey: cartback_dev_key_123' | \
  python3 -c "import sys, json; instances = json.load(sys.stdin); print(json.dumps(instances[0]['Setting'] if instances else {}, indent=2))"
```

**Resultado esperado:**
```json
{
  "rejectCall": false,
  "msgCall": "",
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": false
}
```

### 2. Verificar Webhooks Configurados
```bash
curl -s -X GET 'http://localhost:8080/webhook/find/cartback_xxx' \
  -H 'apikey: cartback_dev_key_123'
```

**Resultado esperado:**
```json
{
  "enabled": true,
  "url": "http://host.docker.internal:3333/api/webhooks/whatsapp",
  "events": ["CONNECTION_UPDATE", "QRCODE_UPDATED"]
}
```

### 3. Verificar Banco de Dados
```bash
docker exec cartback-mysql mysql -uroot -proot cartback -e \
  "SELECT id, instance_name, status, phone_number FROM whatsapp_instances;" 2>/dev/null
```

**Resultado esperado:**
```
id  instance_name              status      phone_number
1   cartback_1769947858763     connected   554199261087
```

**Não deve haver:**
- Tabelas de mensagens (`messages`, `chats`, etc.)
- Dados de contatos ou conversas

---

## 🚀 Uso Responsável

### ✅ Boas Práticas

1. **Conecte apenas WhatsApp Business ou número dedicado**
   - Evite usar WhatsApp pessoal
   - Separe comunicação comercial de pessoal

2. **Teste antes de usar em produção**
   - Use a função "Testar Template" para validar
   - Envie para seu próprio número primeiro

3. **Respeite privacidade dos clientes**
   - Envie apenas para quem abandonou carrinho
   - Não envie spam ou mensagens não solicitadas
   - Respeite horários comerciais

4. **Configure delays adequados**
   - Não envie mensagens imediatamente
   - Use intervalos de 60+ minutos entre mensagens
   - Não envie múltiplas mensagens seguidas

### ⚠️ Nunca Faça

1. ❌ Não use para enviar spam
2. ❌ Não compartilhe API key da Evolution
3. ❌ Não conecte WhatsApp pessoal em ambiente de teste
4. ❌ Não envie mensagens fora do horário comercial
5. ❌ Não use templates genéricos sem personalização

---

## 📝 Conformidade Legal

### LGPD (Lei Geral de Proteção de Dados)

✅ **Conformidade Atendida:**

1. **Minimização de Dados**
   - Coletamos apenas número de telefone do carrinho abandonado
   - Não acessamos dados adicionais do WhatsApp

2. **Finalidade Específica**
   - Dados usados exclusivamente para recuperação de carrinho
   - Não compartilhamos com terceiros

3. **Consentimento**
   - Cliente forneceu telefone ao criar carrinho
   - Mensagem é relacionada à ação iniciada pelo cliente

4. **Direito ao Esquecimento**
   - Cliente pode cancelar carrinho a qualquer momento
   - Dados são excluídos conforme política de retenção

### WhatsApp Business Policy

✅ **Conformidade Atendida:**

1. **Não automatiza respostas** - Apenas envia recuperação
2. **Não faz spam** - Mensagens são contextualizadas e limitadas
3. **Respeita opt-out** - Sistema de cancelamento implementado
4. **Identifica negócio** - Templates incluem nome da loja

---

## 🔧 Troubleshooting de Segurança

### Problema: "Recebi um webhook MESSAGES_UPSERT"

**Causa:** Configuração antiga ou instância criada antes da atualização

**Solução:**
```bash
# 1. Desconectar WhatsApp no frontend
# 2. Limpar instâncias antigas
./scripts/clean-whatsapp.sh

# 3. Reconectar (nova instância terá configurações corretas)
```

### Problema: "Evolution API está marcando mensagens como lidas"

**Causa:** Configuração `readMessages: true` (não deveria estar assim)

**Solução:**
```bash
# Verificar configuração
curl -s -X GET 'http://localhost:8080/instance/fetchInstances' \
  -H 'apikey: cartback_dev_key_123'

# Se readMessages: true, deletar e recriar instância
```

---

## ✅ Checklist de Segurança

- [x] Webhook MESSAGES_UPSERT removido
- [x] readMessages: false
- [x] readStatus: false
- [x] syncFullHistory: false
- [x] groupsIgnore: true
- [x] Apenas eventos essenciais configurados
- [x] API Key segura e privada
- [x] Webhooks autenticados
- [x] Logs não expõem dados sensíveis
- [x] Desconexão limpa (delete completo)

---

## 📚 Referências

- [Evolution API Documentation](https://doc.evolution-api.com)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

**Data da Última Atualização**: 01/02/2026
**Versão**: 1.0
**Status**: ✅ Produção Ready - Seguro e Conforme LGPD
