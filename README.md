# StudyTrack

🌐 [Read in English](README.en.md)

Sistema pessoal de rastreamento de estudos, cadastre temas, registre sessões, acompanhe sua evolução com métricas reais, e use uma sala de estudos com cronômetro Pomodoro e música ambiente para manter o foco.

Projeto construído para portfólio, com autenticação real, banco de dados protegido por Row Level Security, e uma interface responsiva construída do zero.

## Capturas de tela

| Login | Dashboard |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Sala de Estudos | Painel de Música |
|---|---|
| ![Sala de Estudos](docs/screenshots/sala-estudos.png) | ![Música](docs/screenshots/painel-musica.png) |

![Configurações](docs/screenshots/painel-configuracoes.png)

## Funcionalidades

- **Autenticação real**: cadastro/login por email e senha, ou login com Google (via Supabase Auth)
- **Segurança em nível de banco**: Row Level Security (RLS) no PostgreSQL garante que cada usuário só acessa seus próprios dados, mesmo que haja falha na camada de aplicação
- **CRUD completo de temas de estudo**: criar, editar, deletar, com meta de horas semanais
- **CRUD completo de sessões**: registrar, editar, deletar, com anotações
- **Sistema de tarefas por tema**: lista de afazeres persistente, gerenciável direto na sala de estudos
- **Dashboard com métricas reais**: horas estudadas na semana, sequência de dias consecutivos, percentual da meta atingida
- **Relatórios semanais/mensais**: navegação por período, gráfico de progresso por tema e detalhamento cronológico de cada sessão
- **Sala de Estudos**: cronômetro Pomodoro com anel de progresso circular, durações configuráveis, alerta sonoro e notificação do navegador ao trocar de fase, anotações registradas ao longo da sessão com timestamp
- **Música e sons para foco**: rádio ao vivo (SomaFM), player de YouTube com busca por link, e sons ambiente (branco, rosa, chuva, ondas) gerados via Web Audio API
- **Janela flutuante (Picture-in-Picture)**: cronômetro espelhado numa mini-janela que fica por cima de qualquer outro app
- **Personalização visual**: cor de destaque customizável (com seletor nativo e conta-gotas) e fundo da sala de estudos (gradientes ou foto própria via upload)
- **PWA instalável**: funciona como app nativo, com ícone próprio e funcionamento básico offline
- **Tour de onboarding interativo** guiando novos usuários pelas funcionalidades principais
- **Nome de usuário customizável**
- **Tema claro/escuro** com preferência salva
- **Totalmente responsivo**, testado em mobile e desktop

## Stack técnica

**Backend**: Node.js, Express 5, Supabase (PostgreSQL + Auth)
**Frontend**: HTML/CSS/JavaScript vanilla, Tailwind CSS
**Autenticação**: Supabase Auth (email/senha + OAuth Google)
**Ícones**: Lucide

## Como rodar localmente

### Pré-requisitos
- Node.js instalado
- Uma conta gratuita no [Supabase](https://supabase.com)

### 1. Clone o repositório
```bash
git clone https://github.com/Leukard/studytrack.git
cd studytrack
```

### 2. Configure o backend
```bash
cd backend
npm install
cp .env.example .env
```
Preencha o `.env` com a URL e a chave anônima do seu projeto Supabase.

Rode o SQL de criação das tabelas e políticas de RLS (disponível em `docs/schema.sql`) no SQL Editor do seu projeto Supabase.

```bash
npm run dev
```

### 3. Configure o frontend
```bash
cd ../frontend/js
cp supabaseClient.example.js supabaseClient.js
```
Preencha `supabaseClient.js` com a mesma URL e chave do passo anterior.

Abra `frontend/index.html` com uma extensão tipo Live Server (VS Code).



## Projeto no ar

🔗 https://studytrack-sepia.vercel.app/

---

Desenvolvido por [Hugo](https://github.com/Leukard) como projeto de portfólio.

