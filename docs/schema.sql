-- StudyTrack — schema do banco de dados (Supabase/PostgreSQL)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.

-- Tabela de temas de estudo, vinculada ao usuário autenticado (auth.users,
-- gerenciado automaticamente pelo Supabase Auth)
create table temas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  meta_horas_semana numeric,
  created_at timestamptz not null default now()
);

-- Tabela de sessões de estudo, vinculada a um tema. Não tem user_id direto —
-- o dono é descoberto através do tema_id (ver políticas de RLS abaixo)
create table sessoes (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references temas(id) on delete cascade,
  duracao_minutos integer not null,
  anotacao text,
  data timestamptz not null default now()
);

alter table temas enable row level security;
alter table sessoes enable row level security;

-- Row Level Security: garante, no nível do banco, que cada usuário só acessa
-- seus próprios dados — mesmo que haja falha na camada de aplicação (backend).
-- Sem essas políticas, o RLS ativado bloqueia tudo por padrão.

-- Políticas para `temas` — comparação direta com auth.uid()
create policy "usuarios veem seus proprios temas"
on temas for select
using (auth.uid() = user_id);

create policy "usuarios criam seus proprios temas"
on temas for insert
with check (auth.uid() = user_id);

create policy "usuarios editam seus proprios temas"
on temas for update
using (auth.uid() = user_id);

create policy "usuarios deletam seus proprios temas"
on temas for delete
using (auth.uid() = user_id);

-- Políticas para `sessoes` — precisa "atravessar" até temas pra descobrir o dono,
-- já que sessoes não guarda user_id diretamente
create policy "usuarios veem suas proprias sessoes"
on sessoes for select
using (
  auth.uid() = (select user_id from temas where temas.id = sessoes.tema_id)
);

create policy "usuarios criam suas proprias sessoes"
on sessoes for insert
with check (
  auth.uid() = (select user_id from temas where temas.id = sessoes.tema_id)
);

create policy "usuarios editam suas proprias sessoes"
on sessoes for update
using (
  auth.uid() = (select user_id from temas where temas.id = sessoes.tema_id)
);

create policy "usuarios deletam suas proprias sessoes"
on sessoes for delete
using (
  auth.uid() = (select user_id from temas where temas.id = sessoes.tema_id)
);