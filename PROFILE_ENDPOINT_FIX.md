# Correção do Endpoint de Perfil do Usuário

## Problema Identificado

O endpoint `PUT /api/users/9/profile` estava retornando erro 404 com a mensagem "Users endpoint not found", mesmo existindo no código.

### Logs do Erro
```
Error in apiRequest (PUT /api/users/9/profile): Error: 404: 
API Error 404: {"error":"Users endpoint not found"}
```

## Causa Raiz

1. **Middleware de Fallback Problemático**: O arquivo `server/vercel.ts` tinha um middleware que capturava todas as rotas `/api/users/*` antes que fossem processadas pelas rotas reais.

2. **Autenticação Apenas por Sessão**: Os endpoints de usuário estavam usando apenas `req.isAuthenticated()`, que não funciona bem no ambiente serverless do Vercel.

## Soluções Implementadas

### 1. Remoção do Middleware de Fallback Problemático

**Antes:**
```typescript
// Middleware problemático que capturava todas as rotas /api/users/*
app.all('/api/*', (req, res) => {
  if (req.originalUrl.includes('/api/users')) {
    return res.status(404).json({
      error: "Users endpoint not found"
    });
  }
  // ...
});
```

**Depois:**
```typescript
// Middleware removido - deixando o Express lidar com 404s naturalmente
```

### 2. Middleware Híbrido de Autenticação

Criado um middleware que suporta tanto autenticação por sessão quanto JWT:

```typescript
const isAuthenticatedJWT = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "Usuário não autenticado",
        error: "No token provided" 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email || '',
      role: decoded.role
    };

    next();
  } catch (error) {
    res.status(401).json({ 
      message: "Usuário não autenticado",
      error: "Invalid token" 
    });
  }
};

const isAuthenticated = (req: Request, res: Response, next: Function) => {
  // Try JWT authentication first if Authorization header is present
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return isAuthenticatedJWT(req, res, next);
  }

  // Fallback to session-based authentication
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
};
```

### 3. Atualização dos Endpoints de Perfil

**Endpoint GET:**
```typescript
app.get("/api/users/:userId/profile", isAuthenticated, async (req, res) => {
  // Agora usa o middleware híbrido
  // Logs detalhados para debug
  console.log("Profile get request:", {
    userId,
    user: req.user,
    isAuthenticated: req.isAuthenticated()
  });
  // ...
});
```

**Endpoint PUT:**
```typescript
app.put("/api/users/:userId/profile", isAuthenticated, async (req, res) => {
  // Agora usa o middleware híbrido
  // Logs detalhados para debug
  console.log("Profile update request:", {
    userId,
    profileData,
    user: req.user,
    isAuthenticated: req.isAuthenticated()
  });
  // ...
});
```

### 4. Logs de Debug Melhorados

Adicionados logs detalhados para facilitar o debug:
- Informações sobre o tipo de autenticação usado (sessão vs JWT)
- Dados do usuário autenticado
- Detalhes da requisição

## Como Usar

### 1. Autenticação por Sessão (Desenvolvimento)
```javascript
// Login normal
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Usar endpoint de perfil
const profileResponse = await fetch(`/api/users/${userId}/profile`, {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profileData)
});
```

### 2. Autenticação por JWT (Produção/Serverless)
```javascript
// Login JWT
const loginResponse = await fetch('/api/auth/login-jwt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { token } = await loginResponse.json();

// Usar endpoint de perfil com token
const profileResponse = await fetch(`/api/users/${userId}/profile`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(profileData)
});
```

## Endpoints de Perfil Disponíveis

### GET /api/users/:userId/profile
- **Descrição**: Obter dados do perfil do usuário
- **Autenticação**: Sessão ou JWT
- **Autorização**: Usuário pode acessar apenas seu próprio perfil

### PUT /api/users/:userId/profile
- **Descrição**: Atualizar dados do perfil do usuário
- **Autenticação**: Sessão ou JWT
- **Autorização**: Usuário pode atualizar apenas seu próprio perfil
- **Campos obrigatórios**: `name`, `email`

### PUT /api/users/:userId/password
- **Descrição**: Alterar senha do usuário
- **Autenticação**: Sessão ou JWT
- **Autorização**: Usuário pode alterar apenas sua própria senha
- **Campos obrigatórios**: `currentPassword`, `newPassword`

## Variáveis de Ambiente Necessárias

```env
JWT_SECRET=sua_chave_secreta_jwt
SESSION_SECRET=sua_chave_secreta_sessao
```

## Status da Correção

✅ **Middleware de fallback removido**
✅ **Middleware híbrido de autenticação implementado**
✅ **Endpoints de perfil atualizados**
✅ **Logs de debug adicionados**
✅ **Build bem-sucedido**

## Próximos Passos

1. **Deploy das correções**
2. **Testar endpoints com JWT**
3. **Verificar logs no Vercel**
4. **Confirmar funcionamento do perfil**

As correções implementadas devem resolver completamente o problema do endpoint de perfil retornando 404.
