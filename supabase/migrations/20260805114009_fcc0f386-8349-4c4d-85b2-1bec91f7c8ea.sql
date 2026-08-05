-- ============ enums ============
create type public.platform_role as enum ('platform_admin');
create type public.clinic_role as enum ('owner','admin','veterinarian','staff');
create type public.subscription_status as enum ('trialing','active','past_due','canceled');
create type public.appointment_status as enum ('scheduled','confirmed','in_progress','completed','cancelled','no_show');
create type public.invoice_status as enum ('draft','sent','paid','overdue','void');
create type public.pet_sex as enum ('male','female','unknown');

-- ============ shared helpers ============
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_role not null default 'platform_admin',
  created_at timestamptz not null default now()
);
grant select on public.platform_admins to authenticated;
grant all on public.platform_admins to service_role;
alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = _user_id);
$$;

create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "platform admins readable" on public.platform_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ plans ============
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) not null default 0,
  max_staff int not null default 5,
  max_pets int not null default 500,
  features jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.plans to authenticated, anon;
grant all on public.plans to service_role;
alter table public.plans enable row level security;
create policy "plans readable" on public.plans for select using (true);
create policy "plans admin write" on public.plans for all to authenticated
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

insert into public.plans (name, slug, price_monthly, price_yearly, max_staff, max_pets, features, sort_order) values
 ('Starter','starter',29,290,3,300,'["1 location","Appointments & calendar","Customer & pet records","Email support"]',1),
 ('Professional','professional',79,790,10,3000,'["Up to 3 locations","Inventory & invoicing","Vaccination reminders","Reports & analytics","Priority support"]',2),
 ('Enterprise','enterprise',199,1990,100,100000,'["Unlimited locations","Custom roles & permissions","Public clinic website","API access","Dedicated success manager"]',3);

-- ============ clinics ============
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid references public.plans(id),
  subscription_status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  email text,
  phone text,
  address text,
  city text,
  country text,
  logo_url text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  opening_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clinics to authenticated;
grant all on public.clinics to service_role;
alter table public.clinics enable row level security;
create trigger clinics_updated before update on public.clinics for each row execute function public.set_updated_at();

create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.clinic_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);
grant select, insert, update, delete on public.clinic_members to authenticated;
grant all on public.clinic_members to service_role;
alter table public.clinic_members enable row level security;

create or replace function public.is_clinic_member(_clinic_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = _clinic_id and user_id = _user_id and is_active
  ) or public.is_platform_admin(_user_id);
$$;

create or replace function public.is_clinic_admin(_clinic_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_members
    where clinic_id = _clinic_id and user_id = _user_id and is_active
      and role in ('owner','admin')
  ) or public.is_platform_admin(_user_id);
$$;

create policy "clinics read" on public.clinics for select to authenticated
  using (public.is_clinic_member(id, auth.uid()));
create policy "clinics insert" on public.clinics for insert to authenticated
  with check (owner_id = auth.uid());
create policy "clinics update" on public.clinics for update to authenticated
  using (public.is_clinic_admin(id, auth.uid())) with check (public.is_clinic_admin(id, auth.uid()));
create policy "clinics delete" on public.clinics for delete to authenticated
  using (owner_id = auth.uid() or public.is_platform_admin(auth.uid()));

create policy "members read" on public.clinic_members for select to authenticated
  using (user_id = auth.uid() or public.is_clinic_member(clinic_id, auth.uid()));
create policy "members write" on public.clinic_members for insert to authenticated
  with check (public.is_clinic_admin(clinic_id, auth.uid()) or user_id = auth.uid());
create policy "members update" on public.clinic_members for update to authenticated
  using (public.is_clinic_admin(clinic_id, auth.uid())) with check (public.is_clinic_admin(clinic_id, auth.uid()));
create policy "members delete" on public.clinic_members for delete to authenticated
  using (public.is_clinic_admin(clinic_id, auth.uid()));

-- ============ subscriptions ============
create table public.clinic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'trialing',
  interval text not null default 'monthly',
  amount numeric(10,2) not null default 0,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clinic_subscriptions to authenticated;
grant all on public.clinic_subscriptions to service_role;
alter table public.clinic_subscriptions enable row level security;
create policy "subs read" on public.clinic_subscriptions for select to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid()));
create policy "subs write" on public.clinic_subscriptions for all to authenticated
  using (public.is_clinic_admin(clinic_id, auth.uid())) with check (public.is_clinic_admin(clinic_id, auth.uid()));

-- ============ customers ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create trigger customers_updated before update on public.customers for each row execute function public.set_updated_at();
create policy "customers member access" on public.customers for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ pets ============
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  species text not null default 'Dog',
  breed text,
  sex public.pet_sex not null default 'unknown',
  birth_date date,
  weight_kg numeric(6,2),
  color text,
  microchip text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pets to authenticated;
grant all on public.pets to service_role;
alter table public.pets enable row level security;
create trigger pets_updated before update on public.pets for each row execute function public.set_updated_at();
create policy "pets member access" on public.pets for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ services ============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text,
  price numeric(10,2) not null default 0,
  duration_minutes int not null default 30,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();
create policy "services member access" on public.services for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ appointments ============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  vet_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes int not null default 30,
  status public.appointment_status not null default 'scheduled',
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create trigger appointments_updated before update on public.appointments for each row execute function public.set_updated_at();
create policy "appointments member access" on public.appointments for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ vaccinations ============
create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_name text not null,
  dose text,
  given_at date,
  next_due_at date,
  batch_number text,
  vet_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vaccinations to authenticated;
grant all on public.vaccinations to service_role;
alter table public.vaccinations enable row level security;
create policy "vaccinations member access" on public.vaccinations for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ examinations ============
create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  vet_id uuid references auth.users(id) on delete set null,
  visited_at timestamptz not null default now(),
  complaint text,
  diagnosis text,
  treatment text,
  prescription text,
  temperature_c numeric(4,1),
  heart_rate int,
  weight_kg numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.examinations to authenticated;
grant all on public.examinations to service_role;
alter table public.examinations enable row level security;
create policy "examinations member access" on public.examinations for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ inventory ============
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  quantity numeric(10,2) not null default 0,
  unit text not null default 'pcs',
  reorder_level numeric(10,2) not null default 0,
  cost_price numeric(10,2) not null default 0,
  sale_price numeric(10,2) not null default 0,
  expires_at date,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.inventory_items to authenticated;
grant all on public.inventory_items to service_role;
alter table public.inventory_items enable row level security;
create trigger inventory_updated before update on public.inventory_items for each row execute function public.set_updated_at();
create policy "inventory member access" on public.inventory_items for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ invoices ============
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  number text not null,
  issued_at date not null default current_date,
  due_at date,
  subtotal numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  total numeric(10,2) not null default 0,
  status public.invoice_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;
alter table public.invoices enable row level security;
create trigger invoices_updated before update on public.invoices for each row execute function public.set_updated_at();
create policy "invoices member access" on public.invoices for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0
);
grant select, insert, update, delete on public.invoice_items to authenticated;
grant all on public.invoice_items to service_role;
alter table public.invoice_items enable row level security;
create policy "invoice items member access" on public.invoice_items for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- ============ website settings ============
create table public.clinic_websites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  is_published boolean not null default false,
  headline text,
  tagline text,
  about text,
  hero_image_url text,
  primary_color text default '#16a34a',
  contact_email text,
  contact_phone text,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clinic_websites to authenticated;
grant select on public.clinic_websites to anon;
grant all on public.clinic_websites to service_role;
alter table public.clinic_websites enable row level security;
create trigger websites_updated before update on public.clinic_websites for each row execute function public.set_updated_at();
create policy "published websites public" on public.clinic_websites for select using (is_published);
create policy "websites member access" on public.clinic_websites for all to authenticated
  using (public.is_clinic_member(clinic_id, auth.uid())) with check (public.is_clinic_member(clinic_id, auth.uid()));

-- helpful indexes
create index on public.clinic_members (user_id);
create index on public.customers (clinic_id);
create index on public.pets (clinic_id);
create index on public.appointments (clinic_id, starts_at);
create index on public.vaccinations (clinic_id, next_due_at);
create index on public.examinations (clinic_id, visited_at);
create index on public.inventory_items (clinic_id);
create index on public.invoices (clinic_id);
