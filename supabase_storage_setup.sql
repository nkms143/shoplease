-- STORAGE SETUP SCRIPT
-- Run this in Supabase SQL Editor to enable Agreement Uploads.

-- 1. Create the Storage Bucket
insert into storage.buckets (id, name, public)
values ('agreements', 'agreements', true);

-- 2. Enable RLS on the new bucket (Good practice, though often on by default)
-- alter table storage.objects enable row level security;

-- 3. Policy: Allow Authenticated Users to UPLOAD files
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'agreements' );

-- 4. Policy: Allow Public/Authenticated Read Access
create policy "Allow public read access"
on storage.objects for select
to public
using ( bucket_id = 'agreements' );

-- 5. Add 'agreement_url' column to tenants table
alter table public.tenants
add column agreement_url text;
