# Configuração das Regras do Firebase Storage

## Problema
O erro 412 (Precondition Failed) ocorre quando as regras de segurança do Firebase Storage não estão configuradas corretamente.

## Solução

Acesse o Firebase Console:
1. Vá para https://console.firebase.google.com/
2. Selecione seu projeto: **shopee-apoio-9b103**
3. Navegue até **Storage** no menu lateral
4. Clique na aba **Rules**

Substitua as regras atuais por:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // Regras para avatares de motoristas
    match /avatars/{driverId}/{fileName} {
      allow read: if true; // Todos podem ver avatares
      allow write: if request.auth != null 
                   && request.auth.uid == driverId
                   && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB
                   && request.resource.contentType.matches('image/.*'); // Apenas imagens
      allow delete: if request.auth != null 
                    && request.auth.uid == driverId;
    }
    
    // Regras para fotos de carga
    match /cargo-photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
    
    // Negar acesso a outros caminhos por padrão
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Depois de aplicar as regras

1. Clique em **Publicar** no console do Firebase
2. Aguarde alguns segundos para as regras propagarem
3. Teste o upload de avatar novamente no aplicativo

## Verificação

Após aplicar as regras, você deve conseguir:
- ✅ Fazer upload de avatares (max 5MB, apenas imagens)
- ✅ Fazer upload de fotos de carga
- ✅ Ver avatares de outros motoristas
- ✅ Deletar apenas seus próprios arquivos

## Troubleshooting

Se o erro persistir:
1. Verifique se o usuário está autenticado (auth.currentUser)
2. Verifique se o `shopeeId` está correto
3. Verifique o console do navegador para erros detalhados
4. Verifique se o arquivo tem menos de 5MB
5. Verifique se é uma imagem válida

## Notas Importantes

- O erro 412 geralmente indica problema de precondições não atendidas
- As regras acima permitem que apenas o dono do arquivo possa fazer upload/delete
- Todos podem visualizar avatares (necessário para o sistema)
- As fotos de carga são privadas (apenas usuários autenticados)
