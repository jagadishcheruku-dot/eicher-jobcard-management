-- Schema for the Eicher job card app.
--
-- Records arrive from Excel uploads whose columns vary between files, so each
-- table keeps the whole record in a jsonb column and promotes only the fields
-- the app filters or sorts on. That mirrors how the data was stored in
-- Firestore and keeps uploads from failing when a sheet carries an extra
-- column.

create table if not exists customers (
  id          text primary key,
  chassis_no  text,
  cust_name   text,
  village     text,
  mandal      text,
  owner_mob   text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists customers_chassis_no_idx on customers (chassis_no);
create index if not exists customers_cust_name_idx on customers (cust_name);

create table if not exists job_cards (
  id          text primary key,
  job_no      text,
  job_date    text,
  status      text,
  chassis_no  text,
  cust_name   text,
  branch      text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists job_cards_job_date_idx on job_cards (job_date desc);
create index if not exists job_cards_chassis_no_idx on job_cards (chassis_no);
create index if not exists job_cards_status_idx on job_cards (status);

create table if not exists complaints (
  id          text primary key,
  complaint_no text,
  status      text,
  chassis_no  text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists spares (
  id          text primary key,
  part_no     text,
  part_desc   text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists spares_part_no_idx on spares (part_no);

create table if not exists staff (
  id          text primary key,
  name        text,
  role        text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists service_camps (
  id          text primary key,
  camp_date   text,
  status      text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- One row per date; the app reads attendance as { [date]: records }.
create table if not exists attendance (
  id          text primary key,
  records     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists app_settings (
  id          text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

-- The workshop shares one link and nobody signs in, so every table is left
-- readable and writable by the anon key — the same access the Firestore rules
-- granted. Row level security stays on so policies are explicit rather than
-- implied. Supabase adds new tables to the supabase_realtime publication
-- itself, so doing it here only raises duplicate_object.
do $$
declare t text;
begin
  foreach t in array array[
    'customers','job_cards','complaints','spares',
    'staff','service_camps','attendance','app_settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists anon_all on %I', t);
    execute format(
      'create policy anon_all on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- The app's own username/password accounts (previously the system_users
-- Firestore collection). Not Supabase Auth: the workshop signs in with a
-- shared branch login inside the app.
create table if not exists system_users (
  id          text primary key,
  username    text unique,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table system_users enable row level security;
drop policy if exists anon_all on system_users;
create policy anon_all on system_users for all to anon, authenticated using (true) with check (true);
