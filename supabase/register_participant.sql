-- Run in Supabase SQL Editor. Registration only; winners are selected by the owner.
create table if not exists public.campaign_registrations (
 id uuid primary key,
 first_name text not null,
 last_name text not null,
 phone text not null check (phone ~ '^0[0-9]{8,9}$'),
 age_range text not null,
 gender text not null,
 occupation text not null,
 education text not null,
 consented_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.campaign_registrations enable row level security;
revoke all on public.campaign_registrations from anon, authenticated;
create or replace function public.register_participant(
 p_submission_id uuid, p_code text, p_first_name text, p_last_name text,
 p_phone text, p_age_range text, p_gender text, p_occupation text,
 p_education text, p_consent boolean
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 if lower(regexp_replace(coalesce(p_code,''),'[[:space:]]','','g')) <> 'confidencenocompromises' then
  return jsonb_build_object('status','invalid_code');
 end if;
 if p_submission_id is null or not coalesce(p_consent,false)
 or length(trim(coalesce(p_first_name,''))) not between 1 and 80
 or length(trim(coalesce(p_last_name,''))) not between 1 and 80
 or trim(coalesce(p_phone,'')) !~ '^0[0-9]{8,9}$'
 or coalesce(p_age_range,'') not in ('ต่ำกว่า 18 ปี','18–20 ปี','21–23 ปี','24–26 ปี','27–30 ปี','มากกว่า 30 ปี')
 or coalesce(p_gender,'') not in ('หญิง','ชาย','นอนไบนารี / หลากหลายทางเพศ','ไม่ประสงค์ระบุ')
 or coalesce(p_occupation,'') not in ('นักศึกษา','เริ่มทำงาน','ทำงานแล้ว','อื่น ๆ')
 or coalesce(p_education,'') not in ('มัธยมศึกษา','อาชีวศึกษา / ปวส.','ปริญญาตรี','สูงกว่าปริญญาตรี','อื่น ๆ') then
  return jsonb_build_object('status','invalid_details');
 end if;
 insert into public.campaign_registrations(id,first_name,last_name,phone,age_range,gender,occupation,education)
 values(p_submission_id,trim(p_first_name),trim(p_last_name),trim(p_phone),p_age_range,p_gender,p_occupation,p_education)
 on conflict(id) do nothing;
 return jsonb_build_object('status','registered','registration_id',p_submission_id);
end;
$$;
revoke all on function public.register_participant(uuid,text,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.register_participant(uuid,text,text,text,text,text,text,text,text,boolean) to anon;
-- Owner: export campaign_registrations from the Table Editor for your draw.
