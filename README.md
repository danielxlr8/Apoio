<div align="center">

![Status](https://img.shields.io/badge/STATUS-FINALIZADO-green?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)

  <br />

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

<br />

# 🚚 Sistema Logístico Shopee Express (Concept)

Sistema de gerenciamento logístico de alta performance, desenvolvido como **Proof of Concept (PoC)** inspirado nas operações da Shopee Express. A aplicação apresenta uma arquitetura Full Stack Serverless com sincronização em tempo real entre administradores e motoristas.

---

## ✨ Funcionalidades

### 👨‍💼 Painel Administrativo (Control Tower)

- **Gestão de Frota:** CRUD completo de motoristas e veículos.
- **Monitoramento em Tempo Real:** Dashboard interativo com métricas de entrega e status da operação.
- **Live Tracking:** Sistema de presença que monitora motoristas online/offline instantaneamente.
- **Relatórios:** Exportação de dados e filtros avançados para análise de performance.
- **Controle de Acesso (RBAC):** Gestão granular de permissões e perfis.

### 🚗 App do Motorista

- **Gestão de Entregas:** Visualização de romaneios e chamados atribuídos.
- **Status Dinâmico:** Atualização de estados (Em rota, Entregue, Pendente) com reflexo imediato no painel.
- **Histórico:** Log de atividades e entregas realizadas.
- **Feedback Visual:** Sistema de notificações e interface otimizada para mobile.

### 🔐 Arquitetura & Segurança

- **Autenticação Híbrida:** Suporte a Email/Senha e Google Auth via Firebase.
- **Domain Validation:** Restrição de cadastro de admins via domínio corporativo (@shopee.com).
- **Concorrência:** Gatekeeper implementado para limitar sessões simultâneas.
- **Segurança de Dados:** Regras de segurança (RLS) configuradas no Firestore e Realtime Database.

---

## 🛠️ Tech Stack

### Frontend & UI

- **Core:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Shadcn/ui
- **State Management:** React Hooks & Context API
- **Animações:** Framer Motion, Lottie React
- **Utils:** Date-fns, React DnD Kit (Drag and drop)

### Backend & Cloud (Serverless)

- **Database:** Cloud Firestore (NoSQL), MongoDB (Storage)
- **Realtime:** Firebase Realtime Database (Presence System)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Hosting:** Vercel

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Conta ativa no Firebase

### 1. Setup do Projeto

```bash
# Clone o repositório
git clone [https://github.com/SEU-USUARIO/sistema-logistico.git](https://github.com/SEU-USUARIO/sistema-logistico.git)

# Entre na pasta
cd sistema-logistico

# Instale as dependências
npm install
```

Vídeo de demonstração.
https://www.youtube.com/watch?v=Jksy6oAjyhs
