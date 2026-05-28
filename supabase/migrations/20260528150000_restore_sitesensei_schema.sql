create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth0_id text not null unique,
  name text,
  given_name text,
  family_name text,
  nickname text,
  picture text,
  email text,
  email_verified boolean default false,
  locale text,
  phone_number text,
  phone_number_verified boolean default false,
  birthdate date,
  address text,
  role text not null default 'free' check (role in ('free', 'paid', 'admin')),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  html text,
  javascript text,
  user_id uuid references public.users(id) on delete cascade,
  is_anonymous boolean not null default true,
  is_favorited boolean not null default false,
  model_used text not null default 'FREE_MODEL',
  original_prompt text,
  enhanced_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_user_consistency check (
    (is_anonymous = true and user_id is null)
    or (is_anonymous = false and user_id is not null)
  )
);

create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  html text,
  javascript text,
  user_id uuid references public.users(id) on delete set null,
  is_anonymous boolean not null default false,
  is_favorited boolean not null default false,
  model_used text,
  original_prompt text,
  enhanced_prompt text,
  created_at timestamptz not null default now(),
  constraint page_revisions_anon_consistency check (
    (not is_anonymous) or (is_anonymous and user_id is null)
  )
);

create unique index if not exists pages_anon_name_unique
  on public.pages (name)
  where user_id is null;

create unique index if not exists pages_user_name_unique
  on public.pages (user_id, name)
  where user_id is not null;

create index if not exists pages_updated_at_idx on public.pages (updated_at desc);
create index if not exists pages_user_id_idx on public.pages (user_id);
create index if not exists pages_is_favorited_idx on public.pages (is_favorited);
create index if not exists page_revisions_page_id_created_at_idx
  on public.page_revisions (page_id, created_at desc);
create index if not exists users_auth0_id_idx on public.users (auth0_id);
create unique index if not exists users_email_key
  on public.users (email)
  where email is not null;
create unique index if not exists users_nickname_key
  on public.users (nickname)
  where nickname is not null;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pages_set_updated_at on public.pages;
create trigger trg_pages_set_updated_at
before update on public.pages
for each row
execute function public.set_updated_at();

alter table public.users disable row level security;
alter table public.pages disable row level security;
alter table public.page_revisions disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.users to anon, authenticated;
grant select, insert, update, delete on public.pages to anon, authenticated;
grant select, insert, update, delete on public.page_revisions to anon, authenticated;
