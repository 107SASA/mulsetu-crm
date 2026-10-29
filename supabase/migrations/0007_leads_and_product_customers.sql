-- Leads (quick capture at expos, website, referrals, …) and customers of
-- internal products. Safe to run more than once.

-- ==========================================================================
-- ENUMS
-- ==========================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_interest') then
    create type lead_interest as enum ('product', 'custom_project');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'customer_status') then
    create type customer_status as enum ('trial', 'active', 'paused', 'cancelled');
  end if;
end $$;

-- ==========================================================================
-- CLIENTS: remember where a client originally came from
-- ==========================================================================
alter table public.clients add column if not exists source text not null default '';
alter table public.clients add column if not exists source_detail text not null default '';

-- ==========================================================================
-- LEADS
-- ==========================================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  interest lead_interest not null default 'custom_project',
  -- The internal product they're interested in (when interest = 'product').
  product_id uuid references public.projects (id) on delete set null,
  requirement text not null default '',
  -- Where the lead came from: expo, website, referral, … plus free-text
  -- detail such as the event name or who referred them.
  source text not null default 'other',
  source_detail text not null default '',
  status lead_status not null default 'new',
  owner_id uuid references public.profiles (id) on delete set null,
  follow_up_date date,
  notes text not null default '',
  converted_client_id uuid references public.clients (id) on delete set null,
  converted_project_id uuid references public.projects (id) on delete set null,
  converted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_source_idx on public.leads (source);
create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists leads_follow_up_date_idx on public.leads (follow_up_date);
create index if not exists leads_product_id_idx on public.leads (product_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- Everyone on the team can see and capture leads (e.g. at an expo stall).
-- Only admins, the lead's owner, or whoever added it can update it.
-- Only admins can delete.
drop policy if exists leads_select_all on public.leads;
create policy leads_select_all on public.leads
  for select to authenticated using (true);

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads
  for insert to authenticated with check (created_by = (select auth.uid()));

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  for update to authenticated
  using (public.is_admin() or owner_id = (select auth.uid()) or created_by = (select auth.uid()))
  with check (public.is_admin() or owner_id = (select auth.uid()) or created_by = (select auth.uid()));

drop policy if exists leads_delete_admin on public.leads;
create policy leads_delete_admin on public.leads
  for delete to authenticated using (public.is_admin());

-- ==========================================================================
-- PRODUCT CUSTOMERS: which clients use which internal product
-- ==========================================================================
create table if not exists public.product_customers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.projects (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  plan text not null default '',
  status customer_status not null default 'active',
  started_on date,
  renewal_date date,
  value numeric(12, 2),
  notes text not null default '',
  source_lead_id uuid references public.leads (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, client_id)
);

create index if not exists product_customers_client_id_idx on public.product_customers (client_id);
create index if not exists product_customers_status_idx on public.product_customers (status);

drop trigger if exists product_customers_set_updated_at on public.product_customers;
create trigger product_customers_set_updated_at
  before update on public.product_customers
  for each row execute function public.set_updated_at();

alter table public.product_customers enable row level security;

drop policy if exists product_customers_select_all on public.product_customers;
create policy product_customers_select_all on public.product_customers
  for select to authenticated using (true);

drop policy if exists product_customers_write_admin on public.product_customers;
create policy product_customers_write_admin on public.product_customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
