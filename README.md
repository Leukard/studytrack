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
- **Dashboard com métricas reais**: horas estudadas na semana, sequência de dias consecutivos, percentual da meta atingida — tudo calculado a partir dos dados reais, não estático
- **Sala de Estudos**: cronômetro Pomodoro com durações configuráveis, alerta sonoro e notificação do navegador ao trocar de fase, anotações registradas ao longo da sessão com timestamp
- **Música e sons para foco**: rádio ao vivo (SomaFM), player de YouTube com busca por link, e sons ambiente (ruído branco/chuva) gerados via Web Audio API
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

## Melhorias futuras

- Sincronização com Google Calendar
- Sistema de tarefas integrado ao cronômetro
- Imagens de fundo customizáveis na sala de estudos
- Seção educacional explicando a técnica Pomodoro
- Fluxo de onboarding para novos usuários
- Personalização visual completa (cores, tema)
- Geração de relatórios de progresso

## Projeto no ar

🔗 _em breve_

---

Desenvolvido por [Hugo](https://github.com/Leukard) como projeto de portfólio.
