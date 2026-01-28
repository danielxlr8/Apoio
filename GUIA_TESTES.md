# Guia de Testes - Novas Funcionalidades

## 🧪 Como Testar as Alterações

### 1️⃣ Teste: Troca de Senha

**Passos:**
1. Faça login no sistema
2. Vá para a aba "Perfil" (último ícone na navegação)
3. Role até a seção "Alterar Senha"
4. Digite uma nova senha (mínimo 6 caracteres)
5. Confirme a senha
6. Clique em "Alterar Senha"
7. Um modal aparecerá pedindo sua senha atual
8. Digite a senha atual e clique em "Confirmar"

**Resultados Esperados:**
- ✅ Botão "Alterar Senha" fica desabilitado se campos vazios
- ✅ Ícone de olho permite mostrar/ocultar senha
- ✅ Modal de confirmação aparece
- ✅ Senha é alterada com sucesso
- ✅ Notificação de sucesso aparece
- ✅ Campos são limpos após sucesso
- ❌ Erro se senha atual incorreta
- ❌ Erro se senhas não conferem
- ❌ Erro se senha tem menos de 6 caracteres

---

### 2️⃣ Teste: Seleção de Hub

**Passos:**
1. Vá para a aba "Perfil"
2. Localize o campo "Hub"
3. Clique no dropdown
4. Selecione um hub diferente da lista
5. Clique em "Salvar"

**Resultados Esperados:**
- ✅ Lista de hubs aparece no dropdown
- ✅ Hub atual fica selecionado
- ✅ Alteração é salva no Firestore
- ✅ Notificação de sucesso aparece
- ✅ Dados persistem após recarregar página

---

### 3️⃣ Teste: Alteração de Telefone

**Passos:**
1. Vá para a aba "Perfil"
2. Localize o campo "Telefone"
3. Digite um novo telefone (formato: DDD + 9 dígitos)
4. Clique em "Salvar"

**Resultados Esperados:**
- ✅ Placeholder mostra formato esperado: (41) 99118-9050
- ✅ Telefone é salvo se tiver 11 dígitos
- ✅ Notificação de sucesso aparece
- ❌ Erro se telefone não tiver 11 dígitos
- ✅ Remove caracteres não numéricos automaticamente

**Exemplos Válidos:**
- `41991189050` ✅
- `(41) 99118-9050` ✅
- `41 99118-9050` ✅

**Exemplos Inválidos:**
- `991189050` ❌ (falta DDD)
- `4199118905` ❌ (falta dígito)
- `419911890509` ❌ (dígito extra)

---

### 4️⃣ Teste: Troca de Veículo

**Passos:**
1. Vá para a aba "Perfil"
2. Localize o campo "Veículo"
3. Clique no dropdown
4. Selecione um tipo de veículo
5. Clique em "Salvar"

**Resultados Esperados:**
- ✅ Lista de veículos aparece (Moto, Carro, Van, etc.)
- ✅ Veículo atual fica selecionado
- ✅ Alteração é salva no Firestore
- ✅ Notificação de sucesso aparece
- ✅ Dados persistem após recarregar

---

### 5️⃣ Teste: Upload de Avatar (Após Aplicar Regras)

**PRÉ-REQUISITO:** Aplicar regras do Firebase Storage (ver FIREBASE_STORAGE_RULES.md)

**Passos:**
1. Vá para a aba "Perfil"
2. Clique no avatar ou no ícone de edição
3. Selecione uma imagem do computador
4. Aguarde o processamento

**Resultados Esperados:**
- ✅ Notificação "Processando... Comprimindo imagem"
- ✅ Loading overlay aparece
- ✅ Imagem é comprimida automaticamente
- ✅ Avatar anterior é deletado
- ✅ Novo avatar é enviado para Firebase Storage
- ✅ URL é atualizada no Firestore
- ✅ Avatar aparece imediatamente na interface
- ✅ Notificação de sucesso aparece
- ✅ Contador de uploads é incrementado
- ❌ Erro se imagem > 5MB
- ❌ Erro se já trocou 3 vezes no mês
- ❌ Erro se não for imagem

**Formatos Aceitos:**
- JPG/JPEG ✅
- PNG ✅
- WebP ✅
- GIF ✅

**Tamanho:**
- Máximo: 5MB antes da compressão
- Após compressão: ~100KB, 500x500px

---

## 🔍 Verificação no Firebase Console

### Firestore
1. Acesse: https://console.firebase.google.com/
2. Vá em Firestore Database
3. Navegue até `motoristas_pre_aprovados/{shopeeId}`
4. Verifique se os campos foram atualizados:
   - `name`
   - `phone`
   - `hub`
   - `vehicleType`
   - `avatar` (URL do Storage)
   - `lastAvatarUpdate` (timestamp)
   - `avatarUpdateCount` (número)

### Storage
1. Acesse: https://console.firebase.google.com/
2. Vá em Storage
3. Navegue até `avatars/{shopeeId}/`
4. Verifique se:
   - Avatar antigo foi deletado ✅
   - Novo avatar está presente ✅
   - Arquivo tem nome `avatar_[timestamp].jpg` ✅

### Authentication
1. Após trocar senha, tente fazer login com:
   - Senha antiga ❌ (deve falhar)
   - Senha nova ✅ (deve funcionar)

---

## 🐛 Troubleshooting

### Erro 412 no Upload de Avatar

**Causa:** Regras do Firebase Storage não aplicadas

**Solução:**
1. Abra `FIREBASE_STORAGE_RULES.md`
2. Copie as regras
3. Aplique no Firebase Console > Storage > Rules
4. Clique em "Publicar"
5. Aguarde 30 segundos
6. Tente novamente

**Verificação:**
```javascript
// No console do navegador (F12):
console.log('User ID:', auth.currentUser?.uid);
console.log('Shopee ID:', shopeeId);
// Ambos devem estar definidos
```

### Senha Não Altera

**Causa:** Erro na reautenticação

**Soluções:**
- Verifique se digitou a senha atual corretamente
- Faça logout e login novamente
- Limpe o cache do navegador
- Verifique console para erros

### Campos Não Salvam

**Causa:** Validação falhou ou erro no Firestore

**Verificações:**
- Telefone tem 11 dígitos?
- Hub está selecionado?
- Veículo está selecionado?
- Usuário está autenticado?
- Console mostra erros?

### Avatar Não Aparece

**Causa:** URL incorreta ou permissões

**Soluções:**
1. Verifique se URL começa com `https://firebasestorage.googleapis.com`
2. Abra URL diretamente no navegador
3. Se erro 403: regras não aplicadas
4. Se erro 404: arquivo não existe
5. Recarregue a página

---

## ✅ Checklist Final

Antes de considerar concluído, teste:

- [ ] Login funciona
- [ ] Aba Perfil abre
- [ ] Campo Nome salva
- [ ] Campo Telefone valida e salva
- [ ] Dropdown Hub funciona
- [ ] Dropdown Veículo funciona
- [ ] Botão Salvar atualiza Firestore
- [ ] Troca de senha abre modal
- [ ] Senha atual é validada
- [ ] Nova senha é aplicada
- [ ] Login com nova senha funciona
- [ ] Upload de avatar funciona (SEM erro 412)
- [ ] Avatar aparece na interface
- [ ] Avatar anterior é deletado
- [ ] Limite de 3 uploads/mês funciona
- [ ] Notificações aparecem
- [ ] Dados persistem após reload
- [ ] Console não mostra erros críticos

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique console do navegador (F12)
2. Verifique arquivo ALTERACOES_DRIVER_INTERFACE.md
3. Verifique arquivo FIREBASE_STORAGE_RULES.md
4. Tire screenshot do erro
5. Anote os passos que causaram o erro

**Informações Úteis para Debug:**
- ID do usuário logado
- Shopee ID
- Mensagem de erro completa
- Screenshot da interface
- Dados que tentou salvar
