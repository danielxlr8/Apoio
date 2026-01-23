# 🔍 DIAGNÓSTICO - Solicitações Fantasma

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Solicitações não aparecem no painel do Admin
- Motorista cria solicitação
- Solicitação não aparece para Admin
- Possível causa: Banco de dados diferente (dev vs prod)

### 2. Solicitação aparece para o próprio motorista
- Motorista cria solicitação
- A mesma solicitação aparece na aba "Status" para ele aceitar
- **ERRO:** Motorista não deve ver suas próprias solicitações na lista de "aceitar"

---

## 🎯 CORREÇÕES NECESSÁRIAS

### Correção 1: Verificar projeto Firebase

**Arquivo a verificar:** `src/firebase.ts`

Verificar se:
```typescript
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // VERIFICAR SE É O MESMO EM DEV E PROD
  // ...
};
```

**Ação:**
1. Verificar `.env` local
2. Verificar variáveis no Vercel
3. Garantir que ambos apontam para o MESMO projeto

---

### Correção 2: Filtrar solicitações próprias

**Localização provável:** Componente DriverInterface

**Código a adicionar:**
```typescript
// Ao buscar chamados abertos para aceitar
const openCallsQuery = query(
  collection(db, "supportCalls"),
  where("status", "==", "ABERTO"),
  where("solicitante.id", "!=", currentUserId) // ← ADICIONAR ESTA LINHA
);
```

**OU se já existe a query:**
```typescript
// Filtrar no frontend
const filteredOpenCalls = openSupportCalls.filter(
  (call) => call.solicitante.id !== userId // ← Não mostrar suas próprias solicitações
);
```

---

## 📋 PASSO A PASSO PARA CORREÇÃO

### Passo 1: Encontrar onde as solicitações são criadas

Procurar por:
```typescript
addDoc(collection(db, "supportCalls"), {
  solicitante: { ... },
  status: "ABERTO",
  // ...
});
```

### Passo 2: Encontrar onde as solicitações são listadas para aceitar

Procurar por:
```typescript
where("status", "==", "ABERTO")
```

### Passo 3: Adicionar filtro

```typescript
// ANTES
const openCallsQuery = query(
  collection(db, "supportCalls"),
  where("status", "==", "ABERTO")
);

// DEPOIS
const openCallsQuery = query(
  collection(db, "supportCalls"),
  where("status", "==", "ABERTO"),
  where("solicitante.id", "!=", currentUserId) // Não mostrar próprias solicitações
);
```

---

## 🔧 COMANDOS ÚTEIS

### Verificar projeto Firebase no console
```bash
# No navegador, abra DevTools (F12)
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

### Verificar chamados no Firestore
1. Abra Firebase Console
2. Vá em Firestore Database
3. Collection: `supportCalls`
4. Verifique se os chamados estão lá

---

## ⚠️ NOTA IMPORTANTE

Parece que os arquivos principais (AdminDashboard.tsx, DriverInterface.tsx) não estão no caminho esperado.

**Possíveis localizações:**
- `src/components/AdminDashboard.tsx` ❌ Não encontrado
- `src/components/DriverInterface.tsx` ❌ Não encontrado
- `src/components/driver/` ✅ Verificar aqui
- `src/components/admin/` ✅ Verificar aqui

**Ação necessária:**
1. Localizar os arquivos corretos
2. Aplicar as correções nos locais certos

---

## 📞 PRÓXIMOS PASSOS

1. **Verificar estrutura atual do projeto**
2. **Localizar componentes principais**
3. **Aplicar filtro de solicitações próprias**
4. **Verificar configuração Firebase**
5. **Testar em ambiente de dev**
6. **Deploy para produção**

---

**Data:** 20/01/2026
**Status:** Aguardando localização dos componentes
