create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  bio text,
  is_admin boolean not null default false,
  total_messages int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table characters (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar_url text not null,
  background_url text,
  description text,
  system_prompt text not null,
  mood text not null default 'neutral' check (mood in ('happy', 'sad', 'angry', 'shy', 'neutral', 'excited', 'cold')),
  tags text[] default '{}',
  is_public boolean not null default true,
  is_featured boolean not null default false,
  view_count int not null default 0,
  chat_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table character_favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, character_id)
);

create table chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  title text not null default 'New Chat',
  total_tokens int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  token_count int not null default 0,
  created_at timestamptz not null default now()
);

create index on chat_sessions (user_id);
create index on chat_sessions (character_id);
create index on messages (session_id);
create index on characters (created_by);
create index on characters (is_public, is_featured);
create index on characters (view_count desc);
create index on character_favorites (user_id);
create index on character_favorites (character_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

create trigger trg_chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function handle_new_message()
returns trigger as $$
begin
  update chat_sessions
  set total_tokens = total_tokens + new.token_count,
      updated_at = now()
  where id = new.session_id;

  update profiles
  set total_messages = total_messages + 1
  where id = (
    select user_id from chat_sessions where id = new.session_id
  );

  update characters
  set chat_count = chat_count + 1
  where id = (
    select character_id from chat_sessions where id = new.session_id
  );

  if new.role = 'user' then
    update chat_sessions
    set title = left(new.content, 60)
    where id = new.session_id
      and title = 'New Chat';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_message_insert
  after insert on messages
  for each row execute function handle_new_message();

create or replace function increment_character_view(char_id uuid)
returns void as $$
begin
  update characters set view_count = view_count + 1 where id = char_id;
end;
$$ language plpgsql security definer;

alter table characters enable row level security;
alter table character_favorites enable row level security;
alter table chat_sessions enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

create policy "characters_select" on characters
  for select using (is_public = true or created_by = auth.uid());

create policy "characters_insert" on characters
  for insert with check (auth.uid() is not null);

create policy "characters_update" on characters
  for update using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "characters_delete" on characters
  for delete using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "favorites_select" on character_favorites
  for select using (user_id = auth.uid());

create policy "favorites_insert" on character_favorites
  for insert with check (user_id = auth.uid());

create policy "favorites_delete" on character_favorites
  for delete using (user_id = auth.uid());

create policy "chat_sessions_select" on chat_sessions
  for select using (user_id = auth.uid());

create policy "chat_sessions_insert" on chat_sessions
  for insert with check (user_id = auth.uid());

create policy "chat_sessions_update" on chat_sessions
  for update using (user_id = auth.uid());

create policy "chat_sessions_delete" on chat_sessions
  for delete using (user_id = auth.uid());

create policy "messages_select" on messages
  for select using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

create policy "messages_insert" on messages
  for insert with check (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

create policy "messages_delete" on messages
  for delete using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

create policy "profiles_select" on profiles
  for select using (true);

create policy "profiles_update" on profiles
  for update using (
    id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
