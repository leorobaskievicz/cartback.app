# CartBack - Frontend

Interface web para gerenciamento de carrinhos abandonados com recuperação via WhatsApp.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI (MUI) v6** - Componentes UI
- **React Router v7** - Roteamento
- **React Hook Form + Zod** - Validação de formulários
- **Notistack** - Notificações toast
- **Recharts** - Gráficos
- **DayJS** - Manipulação de datas
- **Axios** - Cliente HTTP

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── common/           # Componentes reutilizáveis
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingButton.tsx
│   │   └── StatCard.tsx
│   └── layout/           # Componentes de layout
│       └── DashboardLayout.tsx
├── contexts/
│   └── AuthContext.tsx   # Context de autenticação
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── Carts.tsx         # Listagem de carrinhos
│   ├── Dashboard.tsx     # Dashboard com estatísticas
│   ├── Integrations.tsx  # Integrações (Nuvemshop)
│   ├── Settings.tsx      # Configurações
│   ├── Templates.tsx     # Templates de mensagens
│   └── WhatsApp.tsx      # Conexão WhatsApp
├── services/
│   └── api.ts            # Cliente API e endpoints
├── theme/
│   └── index.ts          # Customização MUI
├── types/
│   └── index.ts          # TypeScript types
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── routes.tsx            # Configuração de rotas
```

## 🎨 Design System

### Cores

- **Primary**: Indigo (#6366f1)
- **Secondary**: Green (#22c55e)
- **Error**: Red (#ef4444)
- **Warning**: Amber (#f59e0b)
- **Info**: Blue (#3b82f6)
- **Success**: Green (#22c55e)

### Tipografia

- **Font Family**: Roboto, sans-serif
- **Border Radius**: 12px
- **Buttons**: Sem text-transform, font-weight 600

## 📄 Páginas

### 1. Login (`/login`)

- Formulário de email e senha
- Validação de campos
- Redirecionamento após login
- Link para registro

### 2. Register (`/register`)

- Formulário completo: nome, email, senha, nome da loja, telefone
- Validação de senha (mínimo 6 caracteres)
- Criação de tenant automática
- Redirecionamento após registro

### 3. Dashboard (`/`)

- 4 cards de estatísticas:
  - Carrinhos Abandonados (warning)
  - Mensagens Enviadas (info)
  - Carrinhos Recuperados (success)
  - Valor Recuperado (primary)
- Gráfico de linha dos últimos 30 dias
- Tabela com 5 carrinhos mais recentes

### 4. Integrations (`/integrations`)

- Card da Nuvemshop
- Status: Conectado/Desconectado
- Botão para conectar (OAuth)
- Exibição de nome e URL da loja
- Botão para desconectar com confirmação
- Tratamento de callback `?connected=nuvemshop`

### 5. WhatsApp (`/whatsapp`)

- Exibição de QR Code quando desconectado
- Polling a cada 3 segundos para verificar status
- Exibição de número quando conectado
- Botão de desconectar com confirmação
- Estados de loading

### 6. Templates (`/templates`)

- Listagem de templates em cards
- Criar/Editar template com dialog
- Campos: nome, mensagem, delay em minutos
- Preview em tempo real com variáveis substituídas
- Toggle ativo/inativo
- Botões de editar e deletar
- Variáveis disponíveis:
  - `{customerName}` - Nome do cliente
  - `{totalValue}` - Valor total do carrinho
  - `{cartUrl}` - URL do carrinho

### 7. Carts (`/carts`)

- Tabela com paginação
- Filtros: status e busca
- Colunas: Cliente, Telefone, Valor, Status, Data
- Dialog de detalhes com:
  - Informações do cliente
  - Itens do carrinho
  - Timeline de mensagens
  - Botão de cancelar carrinho
- Status chips: Pendente (warning), Recuperado (success), Expirado (default)

### 8. Settings (`/settings`)

- Formulário para editar:
  - Nome da loja
  - Email
  - Telefone
- Card com plano atual (read-only)
- Botão salvar com loading

## 🔐 Autenticação

O sistema usa JWT armazenado no `localStorage`:

- Token enviado em todas as requisições via header `Authorization: Bearer {token}`
- Interceptor do Axios adiciona token automaticamente
- Redirecionamento para login em caso de 401
- Context API para gerenciar estado global de user e tenant

## 🌐 API

Todas as chamadas são feitas através do `services/api.ts`:

```typescript
// Exemplo de uso
import { dashboardApi } from '../services/api'

const stats = await dashboardApi.stats()
const chartData = await dashboardApi.chart()
```

### Endpoints Disponíveis

- **Auth**: login, register, me
- **Dashboard**: stats, chart
- **Integrations**: get, getAuthUrl, disconnect
- **WhatsApp**: getInstance, getQrCode, disconnect
- **Templates**: list, create, update, delete, reorder
- **Carts**: list, get, cancel
- **Tenant**: update

## 🚦 Roteamento

### Rotas Públicas

- `/login` - Login
- `/register` - Registro

### Rotas Privadas (requer autenticação)

- `/` - Dashboard
- `/carts` - Carrinhos
- `/templates` - Templates
- `/whatsapp` - WhatsApp
- `/integrations` - Integrações
- `/settings` - Configurações

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 🔧 Variáveis de Ambiente

Criar arquivo `.env`:

```env
VITE_API_URL=http://localhost:3333/api
```

## 🎯 Componentes Reutilizáveis

### StatCard

Card de estatística com ícone, título, valor e loading skeleton.

```tsx
<StatCard
  title="Total"
  value={100}
  icon={<ShoppingCart />}
  color="primary"
  loading={false}
/>
```

### LoadingButton

Botão MUI com estado de loading.

```tsx
<LoadingButton loading={loading} variant="contained">
  Salvar
</LoadingButton>
```

### EmptyState

Estado vazio com ícone, título, descrição e ação opcional.

```tsx
<EmptyState
  icon={<ShoppingCart />}
  title="Nenhum item"
  description="Descrição opcional"
  action={{ label: "Criar", onClick: () => {} }}
/>
```

### ConfirmDialog

Dialog de confirmação com loading.

```tsx
<ConfirmDialog
  open={open}
  title="Confirmar?"
  message="Mensagem de confirmação"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  loading={loading}
/>
```

## 🎨 Customização do Tema

O tema MUI pode ser customizado em `src/theme/index.ts`:

```typescript
export const theme = createTheme({
  palette: {
    primary: { main: '#6366f1' },
    secondary: { main: '#22c55e' },
  },
  shape: { borderRadius: 12 },
  // ... mais configurações
})
```

## 📱 Responsividade

- Mobile-first design
- Sidebar colapsável em mobile (drawer temporário)
- Tabelas com scroll horizontal em telas pequenas
- Grid system do MUI para layouts responsivos

## 🔔 Notificações

Sistema de toast com notistack:

```typescript
import { useSnackbar } from 'notistack'

const { enqueueSnackbar } = useSnackbar()

enqueueSnackbar('Mensagem de sucesso!', { variant: 'success' })
enqueueSnackbar('Erro!', { variant: 'error' })
```

## 📊 Validação de Formulários

React Hook Form + Zod para validação type-safe:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
})
```

## 🔄 Estados de Loading

Todas as operações assíncronas possuem estados de loading:

- Skeleton loaders para cards
- Loading buttons para ações
- Spinners para listas vazias

## ✅ Boas Práticas

- ✅ TypeScript em 100% do código
- ✅ Componentes funcionais com hooks
- ✅ Tratamento de erros em todas as requisições
- ✅ Loading states em operações assíncronas
- ✅ Validação de formulários
- ✅ Mensagens de feedback para o usuário
- ✅ Componentização e reutilização
- ✅ Separação de responsabilidades
- ✅ Code splitting com lazy loading (opcional)

## 🚀 Próximos Passos

- [ ] Implementar testes (Jest + React Testing Library)
- [ ] Adicionar PWA support
- [ ] Implementar lazy loading de rotas
- [ ] Adicionar dark mode
- [ ] Melhorar acessibilidade (a11y)
- [ ] Adicionar i18n (internacionalização)
- [ ] Implementar relatórios avançados

## 📝 Licença

MIT
