-- T3 Vira - Supabase şema kurulumu
-- Bu dosyayı Supabase SQL Editor'e yapıştır ve çalıştır.

create extension if not exists "pgcrypto";

-- 1. girisim
create table if not exists girisim (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  sektor text,
  kurulus_yili integer,
  logo text,
  kisa_aciklama text,
  teknoloji text[] default '{}',
  ekip_buyuklugu integer,
  durum text not null default 'onay_bekliyor' check (durum in ('onayli', 'onay_bekliyor')),
  ai_durum text check (ai_durum in ('HAZIR', 'IZLEMEDE', 'VERI_EKSIK')),
  ai_gerekce text,
  son_guncelleme date default current_date,
  bekleyen_veri jsonb
);

-- Bu tabloyu Role 2 daha önce oluşturduysa da (bekleyen_veri kolonu yoksa) aşağıki satır güvenle ekler:
alter table girisim add column if not exists bekleyen_veri jsonb;

-- 2. program
create table if not exists program (
  id uuid primary key default gen_random_uuid(),
  ad text not null
);

-- 3. girisim_program_gecmisi
create table if not exists girisim_program_gecmisi (
  id uuid primary key default gen_random_uuid(),
  girisim_id uuid not null references girisim(id) on delete cascade,
  program_id uuid not null references program(id) on delete cascade,
  donem text,
  durum text,
  onemli_adimlar text
);

-- 4. kullanici
create table if not exists kullanici (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  eposta text unique not null,
  rol text not null check (rol in ('super_admin', 'program_yoneticisi', 'startup', 'karar_verici'))
);

-- 5. satis_yatirim_kaydi
create table if not exists satis_yatirim_kaydi (
  id uuid primary key default gen_random_uuid(),
  girisim_id uuid not null references girisim(id) on delete cascade,
  ciro numeric,
  ihracat numeric,
  yatirim_turu text,
  tutar numeric,
  hibe_odul text,
  tarih date
);

-- 6. dokuman
create table if not exists dokuman (
  id uuid primary key default gen_random_uuid(),
  girisim_id uuid not null references girisim(id) on delete cascade,
  dosya text,
  tur text,
  yukleme_tarihi date default current_date
);

-- 7. sabitli_sorgular (AI Sorgu ekranından "panoya sabitle" ile eklenen sorular;
-- Yönetici Raporu'ndaki kartlar her açılışta bu sorulara göre AI'ı yeniden sorgular)
create table if not exists sabitli_sorgular (
  id uuid primary key default gen_random_uuid(),
  soru_metni text not null,
  created_at timestamp not null default now()
);

-- RLS: MVP demo, gerçek login yok, anon key ile okuma serbest
alter table girisim enable row level security;
alter table program enable row level security;
alter table girisim_program_gecmisi enable row level security;
alter table kullanici enable row level security;
alter table satis_yatirim_kaydi enable row level security;
alter table dokuman enable row level security;
alter table sabitli_sorgular enable row level security;

drop policy if exists "public select girisim" on girisim;
drop policy if exists "public select program" on program;
drop policy if exists "public select girisim_program_gecmisi" on girisim_program_gecmisi;
drop policy if exists "public select kullanici" on kullanici;
drop policy if exists "public select satis_yatirim_kaydi" on satis_yatirim_kaydi;
drop policy if exists "public select dokuman" on dokuman;
drop policy if exists "public update girisim" on girisim;
drop policy if exists "public select sabitli_sorgular" on sabitli_sorgular;
drop policy if exists "public insert sabitli_sorgular" on sabitli_sorgular;
drop policy if exists "public delete sabitli_sorgular" on sabitli_sorgular;

create policy "public select girisim" on girisim for select using (true);
create policy "public select program" on program for select using (true);
create policy "public select girisim_program_gecmisi" on girisim_program_gecmisi for select using (true);
create policy "public select kullanici" on kullanici for select using (true);
create policy "public select satis_yatirim_kaydi" on satis_yatirim_kaydi for select using (true);
create policy "public select dokuman" on dokuman for select using (true);
create policy "public select sabitli_sorgular" on sabitli_sorgular for select using (true);

-- Startup portalı ve admin onay ekranı girisim satırını güncelleyebilmeli
-- (MVP demo: gerçek login yok, anon key ile güncelleme serbest; ileride auth eklenince daraltılmalı)
create policy "public update girisim" on girisim for update using (true) with check (true);

-- AI Sorgu ekranından soru sabitleme / Yönetici Raporu'ndan kaldırma
-- (aynı MVP demo gerekçesiyle anon key ile serbest)
create policy "public insert sabitli_sorgular" on sabitli_sorgular for insert with check (true);
create policy "public delete sabitli_sorgular" on sabitli_sorgular for delete using (true);

-- Örnek veri (demo/test için)
insert into program (ad) values ('T3 Girişim Fabrikası'), ('Teknofest Hızlandırma');

insert into girisim (ad, sektor, kurulus_yili, logo, kisa_aciklama, teknoloji, ekip_buyuklugu, durum, ai_durum, ai_gerekce)
values
  ('UçanKod', 'Havacılık', 2021, null, 'İnsansız hava aracı yazılım platformu.', array['Python','ROS2','Computer Vision'], 8, 'onayli', 'HAZIR', 'Tüm veriler güncel ve eksiksiz.'),
  ('AgroSense', 'Tarım Teknolojileri', 2022, null, 'Sensör tabanlı akıllı sulama sistemi.', array['IoT','Next.js','Node.js'], 5, 'onay_bekliyor', 'VERI_EKSIK', 'Satış verileri eksik.'),
  ('SağlıkAI', 'Sağlık', 2020, null, 'Görüntü tabanlı ön tanı asistanı.', array['TensorFlow','React'], 12, 'onayli', 'IZLEMEDE', 'Yatırım turu takip ediliyor.');

insert into girisim_program_gecmisi (girisim_id, program_id, donem, durum, onemli_adimlar)
select g.id, p.id, '2023 Güz', 'tamamlandi', 'Prototip teslim edildi, pilot müşteri bulundu.'
from girisim g, program p where g.ad = 'UçanKod' and p.ad = 'T3 Girişim Fabrikası';

insert into girisim_program_gecmisi (girisim_id, program_id, donem, durum, onemli_adimlar)
select g.id, p.id, '2024 Bahar', 'devam_ediyor', 'Seri üretime geçiş için yatırım görüşmeleri.'
from girisim g, program p where g.ad = 'UçanKod' and p.ad = 'Teknofest Hızlandırma';

insert into satis_yatirim_kaydi (girisim_id, ciro, ihracat, yatirim_turu, tutar, hibe_odul, tarih)
select id, 1500000, 300000, 'Seed', 2000000, 'TÜBİTAK 1512', '2024-03-15' from girisim where ad = 'UçanKod';

insert into dokuman (girisim_id, dosya, tur, yukleme_tarihi)
select id, 'sunum.pdf', 'Sunum', '2024-03-01' from girisim where ad = 'UçanKod';

-- ================= Kayıt + Rol Atama (basvuran rolü) =================
-- Bu bloğu Supabase SQL Editor'e yapıştırıp çalıştır.

-- 1) 'basvuran' rolünü check constraint'e ekle
alter table kullanici drop constraint if exists kullanici_rol_check;
alter table kullanici add constraint kullanici_rol_check
  check (rol in ('super_admin', 'program_yoneticisi', 'startup', 'karar_verici', 'basvuran'));

-- 2) Gerçek DB'de elle eklenmiş sifre_hash kolonunu şemaya resmen kaydet
alter table kullanici add column if not exists sifre_hash text;

-- 3) GÜVENLİK: sifre_hash'i anon select'ten çıkar (mevcut açık policy'yi kaldır)
drop policy if exists "public select kullanici" on kullanici;

-- 4) Rol atama ekranı için sifre_hash İÇERMEYEN bir view
create or replace view kullanici_public as
  select id, ad, eposta, rol from kullanici;

grant select on kullanici_public to anon, authenticated;

-- 5) Kayıt formu: anon INSERT sadece rol='basvuran' ile sınırlı
--    (kimse kendini doğrudan super_admin olarak kaydedemez)
drop policy if exists "public insert kullanici basvuran" on kullanici;
create policy "public insert kullanici basvuran" on kullanici
  for insert
  with check (rol = 'basvuran');

-- NOT: kullanici tablosuna UPDATE policy'si BİLİNÇLİ OLARAK eklenmiyor.
-- Rol değişikliği sadece /api/rol-guncelle (service role key, RLS bypass)
-- üzerinden yapılabilecek — anon key ile tarayıcıdan doğrudan rol
-- yükseltme saldırısı mümkün olmayacak.

-- ================= EN dil modu: girişim sektör/açıklama çevirisi =================
-- Dil EN'e alınınca sektor_en / kisa_aciklama_en gösterilir; boşsa (örn. Portal'dan
-- eklenen yeni bir girişim henüz çevrilmediyse) kod tarafında otomatik olarak
-- Türkçe orijinaline düşülür (bkz. sayfalardaki dil==="en" ? (x_en ?? x) : x deseni).
alter table girisim add column if not exists sektor_en text;
alter table girisim add column if not exists kisa_aciklama_en text;

update girisim set sektor_en = 'Defense / Air Defense', kisa_aciklama_en = 'Low-altitude air defense systems. (test)' where ad = 'Alp Hava Savunma';
update girisim set sektor_en = 'Defense / Sensors', kisa_aciklama_en = 'Electro-optical sensor systems for aerial platforms.' where ad = 'Anka Sensör';
update girisim set sektor_en = 'Naval Defense / Sonar', kisa_aciklama_en = 'Sonar systems for submarines and ships.' where ad = 'Barbaros Sonar Sistemleri';
update girisim set sektor_en = 'Defense / UAV', kisa_aciklama_en = 'Manufactures tactical and reconnaissance unmanned aerial vehicles.' where ad = 'Bozok İHA Sistemleri';
update girisim set sektor_en = 'Naval Defense', kisa_aciklama_en = 'Autonomous navigation and defense systems for naval platforms.' where ad = 'Deniz Kartalı Denizcilik';
update girisim set sektor_en = 'Defense / Mini UAV', kisa_aciklama_en = 'Squad-level mini reconnaissance drones.' where ad = 'Efe Drone';
update girisim set sektor_en = 'Aviation / Propulsion', kisa_aciklama_en = 'Electric propulsion motors for UAVs.' where ad = 'Ejder Motor Teknolojileri';
update girisim set sektor_en = 'Aviation / Avionics', kisa_aciklama_en = 'Develops domestic avionics systems for military and civil aircraft.' where ad = 'Göktürk Aviyonik';
update girisim set sektor_en = 'Defense / Optics', kisa_aciklama_en = 'Thermal and night-vision optical systems.' where ad = 'Kılıç Optik Sistemler';
update girisim set sektor_en = 'Space / Propulsion', kisa_aciklama_en = 'Hybrid propulsion systems for rockets and satellites.' where ad = 'Meriç İtki Teknolojileri';
update girisim set sektor_en = 'Cybersecurity', kisa_aciklama_en = 'Cyber defense solutions for critical infrastructure.' where ad = 'Pusat Siber Güvenlik';
update girisim set sektor_en = 'Defense / Artificial Intelligence', kisa_aciklama_en = 'Image-processing AI for defense applications.' where ad = 'Simurg Yapay Zeka';
update girisim set sektor_en = 'Space / Communications', kisa_aciklama_en = 'Satellite communication terminals.' where ad = 'Tuğrul Haberleşme';
update girisim set sektor_en = 'Defense / Radar', kisa_aciklama_en = 'Develops short-range surveillance radar.' where ad = 'Turaç Radar';
update girisim set sektor_en = 'Space / Satellite', kisa_aciklama_en = 'Small satellite (CubeSat) design and ground station solutions.' where ad = 'Yıldızlar Uzay Teknolojileri';
