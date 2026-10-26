-- CafeBill schema for a Supabase Free project.
-- Run this once in the Supabase SQL editor. It does not enable billing or paid extensions.
-- Money is stored as integer paise (INR). Tax uses the same half-up formula as src/lib/billing/calculate.ts:
--   ((v_taxable * v_tax_bps) + 5000) / 10000

create extension if not exists pgcrypto;

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cafe_settings (
  cafe_id uuid primary key references public.cafes (id) on delete cascade,
  currency_code text not null default 'INR' check (currency_code = 'INR'),
  tax_rate_bps integer not null default 500 check (tax_rate_bps between 0 and 10000),
  tax_label text not null default 'Tax' check (char_length(btrim(tax_label)) between 2 and 20),
  receipt_footer text not null default 'Thank you. Please check this bill before leaving.',
  bill_prefix text not null default 'BILL' check (bill_prefix ~ '^[A-Z0-9]{2,8}$'),
  next_bill_seq integer not null default 1 check (next_bill_seq >= 1),
  whatsapp_country_code text not null default '91' check (whatsapp_country_code ~ '^[1-9][0-9]{0,3}$'),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '',
  price_paise bigint not null check (price_paise between 0 and 10000000),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  name text not null,
  phone_e164 text not null check (phone_e164 ~ '^[1-9][0-9]{9,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cafe_id, phone_e164)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  bill_number text not null,
  customer_name text not null,
  customer_phone text not null default '',
  status text not null check (status in ('billed', 'whatsapp_opened', 'cancelled')),
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  discount_paise bigint not null check (discount_paise >= 0),
  tax_paise bigint not null check (tax_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  tax_rate_bps integer not null,
  tax_label text not null,
  receipt_footer text not null default '',
  cafe_name text not null,
  cafe_address text not null default '',
  cafe_phone text not null default '',
  notes text not null default '',
  created_by uuid not null references auth.users (id),
  client_request_id uuid not null,
  whatsapp_opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cafe_id, bill_number),
  unique (cafe_id, client_request_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  price_paise bigint not null check (price_paise >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_paise bigint not null check (line_total_paise >= 0)
);

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  role text not null default 'staff' check (role = 'staff'),
  created_by uuid not null references auth.users (id),
  expires_at timestamptz not null,
  used_by uuid references auth.users (id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_cafe_created_idx on public.orders (cafe_id, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index menu_items_cafe_idx on public.menu_items (cafe_id);
create index customers_cafe_idx on public.customers (cafe_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cafes_touch before update on public.cafes
for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.cafe_settings
for each row execute function public.touch_updated_at();
create trigger menu_items_touch before update on public.menu_items
for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers
for each row execute function public.touch_updated_at();

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.cafe_id is distinct from old.cafe_id
     or new.role is distinct from old.role then
    raise exception 'profile membership cannot be changed here';
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
for each row execute function public.protect_profile();

create or replace function public.protect_order_money()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cafe_id is distinct from old.cafe_id
     or new.subtotal_paise is distinct from old.subtotal_paise
     or new.discount_paise is distinct from old.discount_paise
     or new.tax_paise is distinct from old.tax_paise
     or new.total_paise is distinct from old.total_paise
     or new.bill_number is distinct from old.bill_number
     or new.client_request_id is distinct from old.client_request_id
     or new.tax_rate_bps is distinct from old.tax_rate_bps
     or new.tax_label is distinct from old.tax_label
     or new.cafe_name is distinct from old.cafe_name then
    raise exception 'bill snapshots are immutable';
  end if;
  return new;
end;
$$;

create trigger orders_protect_money before update on public.orders
for each row execute function public.protect_order_money();

create or replace function public.current_cafe_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cafe_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.cafes enable row level security;
alter table public.profiles enable row level security;
alter table public.cafe_settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.staff_invites enable row level security;

create policy cafes_select on public.cafes
for select to authenticated
using (id = public.current_cafe_id());

create policy cafes_update on public.cafes
for update to authenticated
using (id = public.current_cafe_id() and public.current_role() = 'owner')
with check (id = public.current_cafe_id() and public.current_role() = 'owner');

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or (cafe_id = public.current_cafe_id() and public.current_role() = 'owner')
);

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy settings_select on public.cafe_settings
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy settings_update on public.cafe_settings
for update to authenticated
using (cafe_id = public.current_cafe_id() and public.current_role() = 'owner')
with check (cafe_id = public.current_cafe_id() and public.current_role() = 'owner');

create policy categories_select on public.menu_categories
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy categories_write on public.menu_categories
for all to authenticated
using (cafe_id = public.current_cafe_id() and public.current_role() = 'owner')
with check (cafe_id = public.current_cafe_id() and public.current_role() = 'owner');

create policy items_select on public.menu_items
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy items_write on public.menu_items
for all to authenticated
using (cafe_id = public.current_cafe_id() and public.current_role() = 'owner')
with check (cafe_id = public.current_cafe_id() and public.current_role() = 'owner');

create policy customers_select on public.customers
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy orders_select on public.orders
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy order_items_select on public.order_items
for select to authenticated
using (cafe_id = public.current_cafe_id());

create policy invites_owner on public.staff_invites
for all to authenticated
using (cafe_id = public.current_cafe_id() and public.current_role() = 'owner')
with check (
  cafe_id = public.current_cafe_id()
  and public.current_role() = 'owner'
  and created_by = auth.uid()
  and role = 'staff'
);

revoke all on table public.cafes from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.cafe_settings from anon, authenticated;
revoke all on table public.menu_categories from anon, authenticated;
revoke all on table public.menu_items from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.staff_invites from anon, authenticated;

grant select, update on table public.cafes to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, update on table public.cafe_settings to authenticated;
grant select, insert, update, delete on table public.menu_categories to authenticated;
grant select, insert, update, delete on table public.menu_items to authenticated;
grant select on table public.customers to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;
grant select, insert, delete on table public.staff_invites to authenticated;

revoke insert, update, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_items from authenticated;

create or replace function public.create_cafe(
  p_name text,
  p_address text,
  p_phone text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_owner text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'already in a cafe';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'cafe name is invalid';
  end if;

  insert into public.cafes (name, address, phone, email)
  values (
    v_name,
    left(btrim(coalesce(p_address, '')), 200),
    left(btrim(coalesce(p_phone, '')), 20),
    left(lower(btrim(coalesce(p_email, ''))), 120)
  )
  returning id into v_id;

  v_owner := left(btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Owner')), 80);
  if char_length(v_owner) < 2 then
    v_owner := 'Owner';
  end if;

  insert into public.profiles (id, cafe_id, full_name, role)
  values (auth.uid(), v_id, v_owner, 'owner');

  insert into public.cafe_settings (cafe_id) values (v_id);
  return v_id;
end;
$$;

create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.staff_invites%rowtype;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'already in a cafe';
  end if;

  select * into v_invite
  from public.staff_invites
  where code = upper(btrim(coalesce(p_code, '')))
  for update;

  if not found or v_invite.used_by is not null or v_invite.expires_at < now() then
    raise exception 'invite is invalid';
  end if;

  v_name := left(btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Staff')), 80);
  if char_length(v_name) < 2 then
    v_name := 'Staff';
  end if;
  insert into public.profiles (id, cafe_id, full_name, role)
  values (auth.uid(), v_invite.cafe_id, v_name, 'staff');

  update public.staff_invites
  set used_by = auth.uid(), used_at = now()
  where id = v_invite.id;

  return v_invite.cafe_id;
end;
$$;

create or replace function public.allocate_bill_number(p_cafe_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.cafe_settings%rowtype;
  v_seq integer;
begin
  if public.current_cafe_id() is distinct from p_cafe_id then
    raise exception 'forbidden';
  end if;

  select * into v_settings
  from public.cafe_settings
  where cafe_id = p_cafe_id
  for update;

  if not found then
    raise exception 'cafe settings are missing';
  end if;

  v_seq := v_settings.next_bill_seq;
  update public.cafe_settings
  set next_bill_seq = v_seq + 1
  where cafe_id = p_cafe_id;

  return v_settings.bill_prefix || '-' ||
    to_char(now() at time zone 'Asia/Kolkata', 'YYYYMMDD') || '-' ||
    lpad(v_seq::text, 4, '0');
end;
$$;

create or replace function public.place_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cafe uuid;
  v_role text;
  v_request uuid;
  v_existing uuid;
  v_name text;
  v_phone text;
  v_notes text;
  v_discount bigint;
  v_item jsonb;
  v_menu_id uuid;
  v_qty integer;
  v_price bigint;
  v_item_name text;
  v_available boolean;
  v_line bigint;
  v_subtotal bigint := 0;
  v_tax_bps integer;
  v_tax_label text;
  v_footer text;
  v_cafe_name text;
  v_cafe_address text;
  v_cafe_phone text;
  v_tax bigint;
  v_total bigint;
  v_taxable bigint;
  v_order_id uuid;
  v_bill text;
  v_count integer := 0;
  v_lines jsonb := '[]'::jsonb;
  v_seen uuid[] := array[]::uuid[];
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select cafe_id, role into v_cafe, v_role
  from public.profiles
  where id = v_uid;

  if v_cafe is null or v_role not in ('owner', 'staff') then
    raise exception 'no cafe membership';
  end if;

  v_request := (p_payload ->> 'clientRequestId')::uuid;
  v_name := left(btrim(coalesce(p_payload ->> 'customerName', '')), 80);
  v_phone := btrim(coalesce(p_payload ->> 'customerPhone', ''));
  v_notes := left(btrim(coalesce(p_payload ->> 'notes', '')), 300);
  v_discount := coalesce((p_payload ->> 'discountPaise')::bigint, 0);

  if char_length(v_name) < 2 then
    raise exception 'customer name is invalid';
  end if;
  if v_phone <> '' and v_phone !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'phone is invalid';
  end if;
  if v_discount < 0 then
    raise exception 'discount is invalid';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array' then
    raise exception 'items are required';
  end if;

  select id into v_existing
  from public.orders
  where cafe_id = v_cafe and client_request_id = v_request;
  if v_existing is not null then
    return jsonb_build_object('orderId', v_existing, 'reused', true);
  end if;

  for v_item in select value from jsonb_array_elements(p_payload -> 'items')
  loop
    v_count := v_count + 1;
    if v_count > 40 then
      raise exception 'too many lines';
    end if;
    v_menu_id := (v_item ->> 'menuItemId')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;
    if v_menu_id = any (v_seen) then
      raise exception 'duplicate item';
    end if;
    v_seen := array_append(v_seen, v_menu_id);
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'quantity is invalid';
    end if;

    select name, price_paise, is_available
      into v_item_name, v_price, v_available
    from public.menu_items
    where id = v_menu_id and cafe_id = v_cafe;

    if v_item_name is null then
      raise exception 'menu item not found';
    end if;
    if not v_available then
      raise exception 'menu item is unavailable';
    end if;

    v_line := v_price * v_qty;
    v_subtotal := v_subtotal + v_line;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'menuItemId', v_menu_id,
      'name', v_item_name,
      'price', v_price,
      'quantity', v_qty,
      'line', v_line
    ));
  end loop;

  if v_count = 0 then
    raise exception 'add at least one item';
  end if;
  if v_discount > v_subtotal then
    raise exception 'discount is too large';
  end if;

  select tax_rate_bps, tax_label, receipt_footer
    into v_tax_bps, v_tax_label, v_footer
  from public.cafe_settings
  where cafe_id = v_cafe;

  select name, address, phone
    into v_cafe_name, v_cafe_address, v_cafe_phone
  from public.cafes
  where id = v_cafe;

  v_taxable := v_subtotal - v_discount;
  v_tax := ((v_taxable * v_tax_bps) + 5000) / 10000;
  v_total := v_taxable + v_tax;

  if v_phone <> '' then
    insert into public.customers (cafe_id, name, phone_e164)
    values (v_cafe, v_name, v_phone)
    on conflict (cafe_id, phone_e164) do update
      set name = excluded.name;
  end if;

  v_bill := public.allocate_bill_number(v_cafe);

  insert into public.orders (
    cafe_id, bill_number, customer_name, customer_phone, status,
    subtotal_paise, discount_paise, tax_paise, total_paise,
    tax_rate_bps, tax_label, receipt_footer,
    cafe_name, cafe_address, cafe_phone,
    notes, created_by, client_request_id
  ) values (
    v_cafe, v_bill, v_name, v_phone, 'billed',
    v_subtotal, v_discount, v_tax, v_total,
    v_tax_bps, v_tax_label, v_footer,
    v_cafe_name, v_cafe_address, v_cafe_phone,
    v_notes, v_uid, v_request
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, cafe_id, menu_item_id, name_snapshot, price_paise, quantity, line_total_paise
  )
  select
    v_order_id,
    v_cafe,
    (line ->> 'menuItemId')::uuid,
    line ->> 'name',
    (line ->> 'price')::bigint,
    (line ->> 'quantity')::integer,
    (line ->> 'line')::bigint
  from jsonb_array_elements(v_lines) as line;

  return jsonb_build_object('orderId', v_order_id, 'reused', false);
exception
  when unique_violation then
    select id into v_existing
    from public.orders
    where cafe_id = v_cafe and client_request_id = v_request;
    if v_existing is not null then
      return jsonb_build_object('orderId', v_existing, 'reused', true);
    end if;
    raise;
end;
$$;

create or replace function public.mark_whatsapp_opened(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cafe uuid := public.current_cafe_id();
  v_phone text;
  v_status text;
begin
  if v_cafe is null or public.current_role() not in ('owner', 'staff') then
    raise exception 'forbidden';
  end if;

  select customer_phone, status into v_phone, v_status
  from public.orders
  where id = p_order_id and cafe_id = v_cafe
  for update;

  if not found then
    raise exception 'bill not found';
  end if;
  if v_status = 'cancelled' then
    raise exception 'cancelled bills cannot open whatsapp';
  end if;
  if v_phone = '' then
    raise exception 'phone is missing';
  end if;

  update public.orders
  set status = 'whatsapp_opened',
      whatsapp_opened_at = coalesce(whatsapp_opened_at, now())
  where id = p_order_id and cafe_id = v_cafe;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cafe uuid := public.current_cafe_id();
begin
  if v_cafe is null or public.current_role() not in ('owner', 'staff') then
    raise exception 'forbidden';
  end if;

  update public.orders
  set status = 'cancelled'
  where id = p_order_id and cafe_id = v_cafe;

  if not found then
    raise exception 'bill not found';
  end if;
end;
$$;

revoke all on function public.current_cafe_id() from public, anon;
revoke all on function public.current_role() from public, anon;
revoke all on function public.create_cafe(text, text, text, text) from public, anon;
revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.allocate_bill_number(uuid) from public, anon, authenticated;
revoke all on function public.place_order(jsonb) from public, anon;
revoke all on function public.mark_whatsapp_opened(uuid) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;

grant execute on function public.current_cafe_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.create_cafe(text, text, text, text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.mark_whatsapp_opened(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
