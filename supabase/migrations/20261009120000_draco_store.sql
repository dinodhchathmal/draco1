-- DRACO production storefront schema. All money is stored as integer LKR.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_read_self" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);

create table public.collections (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  description text not null default '', position integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), collection_id uuid references public.collections(id) on delete set null,
  name text not null check (length(name) between 1 and 120), slug text not null unique,
  description text not null default '', category text not null default 'tshirt' check (category in ('tshirt','hoodie','bottoms','accessory')),
  price_lkr integer not null check (price_lkr > 0), compare_at_lkr integer check (compare_at_lkr is null or compare_at_lkr >= price_lkr),
  images text[] not null default '{}', status text not null default 'draft' check (status in ('draft','active','archived')),
  featured boolean not null default false, position integer not null default 0,
  seo_title text, seo_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_active_position on public.products(status, position) where status = 'active';
create table public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete restrict,
  size text not null check (length(size) between 1 and 20), color text not null check (length(color) between 1 and 50),
  sku text not null unique, stock integer not null default 0 check (stock >= 0), reserved_stock integer not null default 0 check (reserved_stock >= 0 and reserved_stock <= stock),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(product_id,size,color)
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(), name text not null, code text unique,
  discount_type text check (discount_type in ('fixed','percent')), discount_value integer check (discount_value is null or discount_value > 0),
  eligible_category text not null default 'tshirt' check (eligible_category in ('tshirt','hoodie','bottoms','accessory','all')), max_qualifying_quantity integer not null default 3 check (max_qualifying_quantity > 0),
  starts_at timestamptz, ends_at timestamptz, active boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), public_reference text not null unique,
  idempotency_key uuid not null unique, access_token_hash text not null,
  customer jsonb not null, subtotal_lkr integer not null check (subtotal_lkr >= 0),
  delivery_lkr integer not null check (delivery_lkr >= 0), discount_lkr integer not null default 0 check (discount_lkr >= 0),
  total_lkr integer not null check (total_lkr >= 0), currency text not null default 'LKR' check (currency = 'LKR'),
  payment_method text not null default 'bank_transfer' check (payment_method = 'bank_transfer'),
  payment_status text not null default 'awaiting_payment' check (payment_status in ('awaiting_payment','receipt_submitted','verified','rejected','refunded')),
  order_status text not null default 'pending_payment' check (order_status in ('pending_payment','confirmed','processing','shipped','delivered','cancelled','expired')),
  reservation_expires_at timestamptz not null default now() + interval '60 minutes',
  internal_note text not null default '', shipping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index orders_reference_created on public.orders(public_reference, created_at desc);
create index orders_status_created on public.orders(order_status, created_at desc);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null, variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null, size text not null, color text not null, sku text not null,
  unit_price_lkr integer not null check (unit_price_lkr >= 0), quantity integer not null check (quantity > 0),
  discount_lkr integer not null default 0 check (discount_lkr >= 0), created_at timestamptz not null default now()
);
create table public.promotion_redemptions (
  id uuid primary key default gen_random_uuid(), promotion_id uuid not null references public.promotions(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  qualifying_quantity integer not null check (qualifying_quantity > 0), discount_lkr integer not null check (discount_lkr >= 0),
  status text not null default 'reserved' check (status in ('reserved','confirmed','released')), created_at timestamptz not null default now()
);
create index promo_redemption_capacity on public.promotion_redemptions(promotion_id,status);
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null, quantity_delta integer not null check (quantity_delta <> 0),
  movement_type text not null check (movement_type in ('restock','adjustment','reservation','release','sale')),
  note text not null default '', actor uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
  storage_path text not null unique, mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
  file_size integer not null check (file_size between 1 and 5242880), status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  verification_note text not null default '', reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
  previous_status text, next_status text not null, actor uuid references auth.users(id) on delete set null,
  note text not null default '', created_at timestamptz not null default now()
);
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(), email text not null unique check (length(email) <= 254),
  unsubscribe_token_hash text not null unique,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  consented_at timestamptz not null, unsubscribed_at timestamptz, created_at timestamptz not null default now()
);
create table public.api_rate_limits (
  key_hash text not null, window_start timestamptz not null, hits integer not null check(hits>0),
  primary key(key_hash,window_start)
);
alter table public.api_rate_limits enable row level security;
create table public.store_settings (
  key text primary key, value jsonb not null, updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.collections(slug,name,description,position) values
 ('obsidian','Obsidian','The foundation. A study in form and shadow.',1),
 ('form','Form','Essential shapes for every day.',2),
 ('night-shift','Night Shift','After hours, in motion.',3),
 ('static','Static','Pieces with a point of view.',4);
insert into public.promotions(name,discount_type,discount_value,eligible_category,max_qualifying_quantity,active)
values ('Launch: first three T-shirts',null,null,'tshirt',3,false);
insert into public.products(collection_id,name,slug,description,category,price_lkr,status,position)
values ((select id from public.collections where slug='obsidian'),'DRACO Studio Tee','draco-studio-tee','An embroidered DRACO essential. Product photography and final garment details can be added in the admin studio.','tshirt',4590,'active',1);
insert into public.product_variants(product_id,size,color,sku,stock,active)
select id,v.size,v.color,'DRACO-TEE-'||upper(v.size)||'-'||upper(v.color),0,true
from public.products cross join (values ('M','White'),('M','Black'),('L','White'),('L','Black')) as v(size,color)
where slug='draco-studio-tee';
insert into public.store_settings(key,value) values
 ('delivery_charge_lkr','450'::jsonb),('whatsapp','"+94741389234"'::jsonb),
 ('payment_instructions','{"status":"required","text":"Add business bank transfer details in Admin → Settings before accepting payments."}'::jsonb),
 ('social_links','{}'::jsonb),('policy_review_required','true'::jsonb);

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.promotion_redemptions enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.order_status_history enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.store_settings enable row level security;

create policy "public_read_active_collections" on public.collections for select to anon,authenticated using (active = true);
create policy "public_read_active_products" on public.products for select to anon,authenticated using (status = 'active');
create policy "public_read_active_variants" on public.product_variants for select to anon,authenticated using (active = true and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "admins_manage_collections" on public.collections for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_products" on public.products for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_variants" on public.product_variants for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_promotions" on public.promotions for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_orders" on public.orders for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_order_items" on public.order_items for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_redemptions" on public.promotion_redemptions for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_movements" on public.inventory_movements for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_receipts" on public.payment_receipts for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_history" on public.order_status_history for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_subscribers" on public.newsletter_subscribers for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_manage_settings" on public.store_settings for all to authenticated using (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check (exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));

create or replace function public.create_store_order(p_customer jsonb,p_items jsonb,p_idempotency_key uuid,p_access_token_hash text)
returns table(public_reference text,total_lkr integer)
language plpgsql security definer set search_path = '' as $$
declare
  existing public.orders%rowtype; item jsonb; v record; qty integer; subtotal integer:=0; delivery integer:=450;
  discount integer:=0; qualifying integer:=0; eligible integer:=0; eligible_value integer:=0; capacity integer:=0; take_qty integer:=0; promo public.promotions%rowtype;
  order_id uuid; ref text; line_total integer; snapshots jsonb:='[]'::jsonb; contact jsonb;
begin
  if jsonb_typeof(p_customer)<>'object' or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 then raise exception 'Invalid order'; end if;
  perform public.release_expired_reservations();
  select * into existing from public.orders o where o.idempotency_key=p_idempotency_key;
  if found then return query select existing.public_reference,existing.total_lkr; return; end if;
  select value into contact from public.store_settings where key='delivery_charge_lkr'; if contact is not null then delivery:=(contact#>>'{}')::integer; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::integer;
    if qty<1 or qty>10 then raise exception 'Invalid quantity'; end if;
    select v.id,v.product_id,v.size,v.color,v.sku,v.stock,v.reserved_stock,v.active,p.name,p.price_lkr,p.category,p.status
      into v from public.product_variants v join public.products p on p.id=v.product_id
      where v.id=(item->>'variantId')::uuid for update of v;
    if not found or not v.active or v.status<>'active' then raise exception 'Variant unavailable'; end if;
    if v.stock-v.reserved_stock<qty then raise exception 'Insufficient stock'; end if;
    update public.product_variants set reserved_stock=reserved_stock+qty,updated_at=now() where id=v.id;
    subtotal:=subtotal+(v.price_lkr*qty);
    if v.category='tshirt' then qualifying:=qualifying+qty; end if;
    snapshots:=snapshots||jsonb_build_array(jsonb_build_object('product_id',v.product_id,'variant_id',v.id,'name',v.name,'size',v.size,'color',v.color,'sku',v.sku,'price',v.price_lkr,'quantity',qty,'category',v.category));
    insert into public.inventory_movements(variant_id,quantity_delta,movement_type,note) values(v.id,qty,'reservation','Order reservation');
  end loop;
  select * into promo from public.promotions p where p.active and p.discount_type is not null and p.discount_value is not null
    and (p.starts_at is null or p.starts_at<=now()) and (p.ends_at is null or p.ends_at>now()) and p.eligible_category='tshirt'
    order by p.created_at limit 1 for update;
  if found then
    qualifying:=0;
    for item in select value from jsonb_array_elements(snapshots) loop
      if promo.eligible_category='all' or item->>'category'=promo.eligible_category then qualifying:=qualifying+(item->>'quantity')::integer;end if;
    end loop;
  end if;
  if found and qualifying>0 then
    select coalesce(sum(pr.qualifying_quantity),0)::integer into eligible from public.promotion_redemptions pr where pr.promotion_id=promo.id and pr.status in ('reserved','confirmed');
    eligible:=greatest(0,least(qualifying,promo.max_qualifying_quantity-eligible));
    if eligible>0 then
      capacity:=eligible;
      for item in select value from jsonb_array_elements(snapshots) loop
        if (promo.eligible_category='all' or item->>'category'=promo.eligible_category) and capacity>0 then
          take_qty:=least((item->>'quantity')::integer,capacity);
          eligible_value:=eligible_value+take_qty*(item->>'price')::integer;
          capacity:=capacity-take_qty;
        end if;
      end loop;
      if promo.discount_type='percent' then discount:=least(subtotal,((eligible_value*promo.discount_value)/100)); else discount:=least(subtotal,eligible*promo.discount_value); end if;
    end if;
  end if;
  ref:='DR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
  insert into public.orders(public_reference,idempotency_key,access_token_hash,customer,subtotal_lkr,delivery_lkr,discount_lkr,total_lkr)
    values(ref,p_idempotency_key,p_access_token_hash,p_customer,subtotal,delivery,discount,subtotal+delivery-discount) returning id into order_id;
  for item in select value from jsonb_array_elements(snapshots) loop
    line_total:=(item->>'price')::integer*(item->>'quantity')::integer;
    insert into public.order_items(order_id,product_id,variant_id,product_name,size,color,sku,unit_price_lkr,quantity)
      values(order_id,(item->>'product_id')::uuid,(item->>'variant_id')::uuid,item->>'name',item->>'size',item->>'color',item->>'sku',(item->>'price')::integer,(item->>'quantity')::integer);
  end loop;
  if eligible>0 then insert into public.promotion_redemptions(promotion_id,order_id,qualifying_quantity,discount_lkr) values(promo.id,order_id,eligible,discount); end if;
  insert into public.order_status_history(order_id,next_status,note) values(order_id,'pending_payment','Order placed; inventory reserved for 60 minutes.');
  return query select ref,subtotal+delivery-discount;
end $$;
revoke all on function public.create_store_order(jsonb,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.create_store_order(jsonb,jsonb,uuid,text) to service_role;

create or replace function public.quote_store_order(p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; v record; qty integer; subtotal integer:=0; delivery integer:=450; discount integer:=0;
  qualifying integer:=0; eligible integer:=0; eligible_value integer:=0; capacity integer:=0; take_qty integer:=0;
  promo public.promotions%rowtype; s jsonb; line jsonb; lines jsonb:='[]'::jsonb;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 then raise exception 'Invalid items'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    qty:=(item->>'quantity')::integer;if qty<1 or qty>10 then raise exception 'Invalid quantity';end if;
    select v.id,v.product_id,v.size,v.color,v.sku,v.stock,v.reserved_stock,v.active,p.name,p.price_lkr,p.category,p.status
      into v from public.product_variants v join public.products p on p.id=v.product_id where v.id=(item->>'variantId')::uuid;
    if not found or not v.active or v.status<>'active' then raise exception 'Variant unavailable';end if;
    if v.stock-v.reserved_stock<qty then raise exception 'Insufficient stock';end if;
    subtotal:=subtotal+v.price_lkr*qty;if v.category='tshirt' then qualifying:=qualifying+qty;end if;
    line:=jsonb_build_object('variant_id',v.id,'name',v.name,'size',v.size,'color',v.color,'price_lkr',v.price_lkr,'quantity',qty,'category',v.category);
    lines:=lines||jsonb_build_array(line);
  end loop;
  select value into s from public.store_settings where key='delivery_charge_lkr';if s is not null then delivery:=(s#>>'{}')::integer;end if;
  select * into promo from public.promotions p where p.active and p.discount_type is not null and p.discount_value is not null
    and (p.starts_at is null or p.starts_at<=now()) and (p.ends_at is null or p.ends_at>now()) and p.eligible_category='tshirt'
    order by p.created_at limit 1;
  if found then
    qualifying:=0;
    for item in select value from jsonb_array_elements(lines) loop
      if promo.eligible_category='all' or item->>'category'=promo.eligible_category then qualifying:=qualifying+(item->>'quantity')::integer;end if;
    end loop;
  end if;
  if found and qualifying>0 then
    select coalesce(sum(pr.qualifying_quantity),0)::integer into eligible from public.promotion_redemptions pr where pr.promotion_id=promo.id and pr.status in ('reserved','confirmed');
    eligible:=greatest(0,least(qualifying,promo.max_qualifying_quantity-eligible));capacity:=eligible;
    for item in select value from jsonb_array_elements(lines) loop
      if (promo.eligible_category='all' or item->>'category'=promo.eligible_category) and capacity>0 then take_qty:=least((item->>'quantity')::integer,capacity);eligible_value:=eligible_value+take_qty*(item->>'price_lkr')::integer;capacity:=capacity-take_qty;end if;
    end loop;
    if promo.discount_type='percent' then discount:=least(subtotal,eligible_value*promo.discount_value/100);else discount:=least(subtotal,eligible*promo.discount_value);end if;
  end if;
  return jsonb_build_object('items',lines,'subtotal_lkr',subtotal,'delivery_lkr',delivery,'discount_lkr',discount,'total_lkr',subtotal+delivery-discount);
end $$;
revoke all on function public.quote_store_order(jsonb) from public,anon,authenticated;
grant execute on function public.quote_store_order(jsonb) to service_role;

create or replace function public.release_expired_reservations()
returns integer language plpgsql security definer set search_path = '' as $$
declare o record; i record; released integer:=0;
begin
  for o in select id from public.orders where order_status='pending_payment' and reservation_expires_at<now() for update skip locked loop
    for i in select variant_id,quantity from public.order_items where order_id=o.id and variant_id is not null loop
      update public.product_variants set reserved_stock=greatest(0,reserved_stock-i.quantity),updated_at=now() where id=i.variant_id;
      insert into public.inventory_movements(variant_id,order_id,quantity_delta,movement_type,note) values(i.variant_id,o.id,-i.quantity,'release','Reservation expired');
    end loop;
    update public.orders set order_status='expired',updated_at=now() where id=o.id;
    update public.promotion_redemptions set status='released' where order_id=o.id and status='reserved';
    insert into public.order_status_history(order_id,previous_status,next_status,note) values(o.id,'pending_payment','expired','Inventory reservation expired.');
    released:=released+1;
  end loop;
  return released;
end $$;
revoke all on function public.release_expired_reservations() from public,anon,authenticated;
grant execute on function public.release_expired_reservations() to service_role;

create or replace function public.admin_review_payment(p_reference text,p_action text,p_note text,p_actor uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; i record; receipt public.payment_receipts%rowtype;
begin
  if p_action not in ('verify','reject') then raise exception 'Invalid payment action'; end if;
  select * into o from public.orders where public_reference=p_reference for update;
  if not found or o.order_status not in ('pending_payment','confirmed') then raise exception 'Order unavailable for review'; end if;
  select * into receipt from public.payment_receipts where order_id=o.id and status='submitted' order by created_at desc limit 1 for update;
  if not found then raise exception 'No submitted payment receipt'; end if;
  if p_action='verify' then
    for i in select variant_id,quantity from public.order_items where order_id=o.id and variant_id is not null loop
      update public.product_variants set stock=stock-i.quantity,reserved_stock=greatest(0,reserved_stock-i.quantity),updated_at=now()
        where id=i.variant_id and stock>=i.quantity and reserved_stock>=i.quantity;
      if not found then raise exception 'Inventory reservation is unavailable'; end if;
      insert into public.inventory_movements(variant_id,order_id,quantity_delta,movement_type,note,actor) values(i.variant_id,o.id,-i.quantity,'sale','Payment verified',p_actor);
    end loop;
    update public.orders set payment_status='verified',order_status='confirmed',updated_at=now() where id=o.id;
    update public.promotion_redemptions set status='confirmed' where order_id=o.id and status='reserved';
    update public.payment_receipts set status='verified',verification_note=left(p_note,1000),reviewed_by=p_actor,reviewed_at=now() where id=receipt.id;
    insert into public.order_status_history(order_id,previous_status,next_status,actor,note) values(o.id,o.order_status,'confirmed',p_actor,'Payment verified. '||left(p_note,800));
  else
    update public.orders set payment_status='rejected',updated_at=now() where id=o.id;
    update public.payment_receipts set status='rejected',verification_note=left(p_note,1000),reviewed_by=p_actor,reviewed_at=now() where id=receipt.id;
  end if;
end $$;
revoke all on function public.admin_review_payment(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.admin_review_payment(text,text,text,uuid) to service_role;

create or replace function public.admin_adjust_inventory(p_variant uuid,p_delta integer,p_note text,p_actor uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.product_variants%rowtype;
begin
  if p_delta=0 or abs(p_delta)>10000 then raise exception 'Invalid inventory adjustment'; end if;
  select * into v from public.product_variants where id=p_variant for update;
  if not found or v.stock+p_delta<v.reserved_stock then raise exception 'Adjustment would reduce available stock below current reservations'; end if;
  update public.product_variants set stock=stock+p_delta,updated_at=now() where id=p_variant;
  insert into public.inventory_movements(variant_id,quantity_delta,movement_type,note,actor) values(p_variant,p_delta,case when p_delta>0 then 'restock' else 'adjustment' end,left(p_note,500),p_actor);
end $$;
revoke all on function public.admin_adjust_inventory(uuid,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.admin_adjust_inventory(uuid,integer,text,uuid) to service_role;

create or replace function public.admin_transition_order(p_reference text,p_next text,p_actor uuid,p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; i record;
begin
  if p_next not in ('processing','shipped','delivered','cancelled') then raise exception 'Invalid order status'; end if;
  select * into o from public.orders where public_reference=p_reference for update;
  if not found then raise exception 'Order not found'; end if;
  if not ((o.order_status='confirmed' and p_next='processing') or (o.order_status='processing' and p_next='shipped') or (o.order_status='shipped' and p_next='delivered') or (o.order_status='pending_payment' and p_next='cancelled')) then raise exception 'Invalid order transition'; end if;
  if p_next='cancelled' then
    for i in select variant_id,quantity from public.order_items where order_id=o.id and variant_id is not null loop
      update public.product_variants set reserved_stock=greatest(0,reserved_stock-i.quantity),updated_at=now() where id=i.variant_id;
      insert into public.inventory_movements(variant_id,order_id,quantity_delta,movement_type,note,actor) values(i.variant_id,o.id,-i.quantity,'release','Order cancelled',p_actor);
    end loop;
    update public.promotion_redemptions set status='released' where order_id=o.id and status='reserved';
  end if;
  update public.orders set order_status=p_next,updated_at=now() where id=o.id;
  insert into public.order_status_history(order_id,previous_status,next_status,actor,note) values(o.id,o.order_status,p_next,p_actor,left(p_note,1000));
end $$;
revoke all on function public.admin_transition_order(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_transition_order(text,text,uuid,text) to service_role;

create or replace function public.consume_rate_limit(p_key_hash text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare window_at timestamptz; current_hits integer;
begin
  if p_limit<1 or p_window_seconds<1 or length(p_key_hash)<>64 then return false; end if;
  window_at:=to_timestamp(floor(extract(epoch from clock_timestamp())/p_window_seconds)*p_window_seconds);
  insert into public.api_rate_limits(key_hash,window_start,hits) values(p_key_hash,window_at,1)
    on conflict(key_hash,window_start) do update set hits=public.api_rate_limits.hits+1 returning hits into current_hits;
  delete from public.api_rate_limits where window_start<now()-interval '2 days';
  return current_hits<=p_limit;
end $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;

grant select on public.collections,public.products,public.product_variants to anon,authenticated;
grant select on public.profiles to authenticated;
grant select,insert,update,delete on public.collections,public.products,public.product_variants,public.promotions,
  public.orders,public.order_items,public.promotion_redemptions,public.inventory_movements,public.payment_receipts,
  public.order_status_history,public.newsletter_subscribers,public.store_settings to authenticated;
grant all on public.api_rate_limits to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('payment-receipts','payment-receipts',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "admins_read_payment_receipts" on storage.objects for select to authenticated using (bucket_id='payment-receipts' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_write_payment_receipts" on storage.objects for insert to authenticated with check (bucket_id='payment-receipts' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "public_read_product_images" on storage.objects for select to anon,authenticated using (bucket_id='product-images');
create policy "admins_write_product_images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "admins_delete_product_images" on storage.objects for delete to authenticated using (bucket_id='product-images' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
