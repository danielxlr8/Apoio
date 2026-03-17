# Correções do Sistema de Solicitações de Apoio

## Problemas Identificados

### 1. Solicitações não aparecem no painel do Admin
**Causa raiz**: Provavelmente há um problema no fluxo de envio/recebimento das solicitações entre driver e admin.

### 2. Motorista vê suas próprias solicitações na aba Status
**Causa raiz**: Falta filtro para excluir solicitações criadas pelo próprio usuário.

## Análise da Estrutura Atual

Projeto em: `C:\Users\SPXBR16535\Desktop\codigos\Projeto apoio\sistema-logistico`

## Correções Necessárias

### Correção 1: Garantir que solicitações cheguem ao Admin

**Solução**:
```typescript
// Ao criar uma solicitação de apoio
const criarSolicitacao = async (solicitacao) => {
  const novaSolicitacao = {
    id: gerarIdUnico(),
    driverId: usuarioAtual.id,
    driverName: usuarioAtual.name,
    timestamp: new Date().toISOString(),
    status: 'pendente',
    tipo: 'apoio',
    ...solicitacao
  };
  
  // IMPORTANTE: Salvar em storage compartilhado (shared: true)
  await window.storage.set(
    `solicitacao:${novaSolicitacao.id}`,
    JSON.stringify(novaSolicitacao),
    true // <-- SHARED = TRUE para admin ver
  );
  
  // Também adicionar ao índice
  const pendentes = await window.storage.get('solicitacoes_pendentes', true);
  const lista = pendentes ? JSON.parse(pendentes.value) : [];
  lista.push(novaSolicitacao.id);
  
  await window.storage.set(
    'solicitacoes_pendentes',
    JSON.stringify(lista),
    true // <-- SHARED = TRUE
  );
};
```

### Correção 2: Bloquear que motorista veja suas próprias solicitações

```typescript
// Ao carregar solicitações para exibir
const carregarSolicitacoes = async () => {
  try {
    const pendentes = await window.storage.get('solicitacoes_pendentes', true);
    if (!pendentes) return [];
    
    const ids = JSON.parse(pendentes.value);
    const solicitacoes = [];
    
    for (const id of ids) {
      const result = await window.storage.get(`solicitacao:${id}`, true);
      if (result) {
        const solicitacao = JSON.parse(result.value);
        
        // FILTRO CRÍTICO: Excluir solicitações do próprio usuário
        if (solicitacao.driverId !== usuarioAtual.id) {
          solicitacoes.push(solicitacao);
        }
      }
    }
    
    return solicitacoes;
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
    return [];
  }
};
```

## Próximos Passos

1. Localizar arquivos específicos com a lógica de solicitações
2. Aplicar as correções acima
3. Testar fluxo completo
