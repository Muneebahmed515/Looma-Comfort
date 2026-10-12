-- Looma Comfort: scheduled refresh
-- Offers, hero slides, promo banners and announcements can start and end at set times.
-- Every 10 minutes this job checks whether any of them crossed a start or end time and,
-- if so, asks the website to refresh its cached pages (POST /api/revalidate).
--
-- It needs two Vault secrets, created once after deploying (see README):
--   select vault.create_secret('https://your-domain.com/api/revalidate', 'revalidate_url');
--   select vault.create_secret('<same value as REVALIDATE_SECRET on Vercel>', 'revalidate_secret');
-- Without them the job does nothing (the site still refreshes hourly on its own).

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_schedule_boundaries()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_crossed boolean;
  v_window interval := interval '11 minutes';
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'revalidate_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'revalidate_secret' limit 1;
  if v_url is null or v_secret is null then
    return;
  end if;

  select exists (
    select 1 from public.offers
      where starts_at between now() - v_window and now() or ends_at between now() - v_window and now()
    union all
    select 1 from public.hero_slides
      where starts_at between now() - v_window and now() or ends_at between now() - v_window and now()
    union all
    select 1 from public.promo_banners
      where starts_at between now() - v_window and now() or ends_at between now() - v_window and now()
    union all
    select 1 from public.announcements
      where starts_at between now() - v_window and now() or ends_at between now() - v_window and now()
  ) into v_crossed;

  if v_crossed then
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
      body := jsonb_build_object('tag', 'site', 'reason', 'schedule')
    );
  end if;
end;
$$;
revoke all on function public.notify_schedule_boundaries() from public, anon, authenticated;

-- Keep tracking tables small on the free tier.
create or replace function public.prune_old_rows()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.whatsapp_clicks where created_at < now() - interval '12 months';
  delete from public.activity_log where created_at < now() - interval '6 months';
$$;
revoke all on function public.prune_old_rows() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('looma-schedule-boundaries', 'looma-prune');
  perform cron.schedule('looma-schedule-boundaries', '*/10 * * * *', 'select public.notify_schedule_boundaries()');
  perform cron.schedule('looma-prune', '17 3 * * 0', 'select public.prune_old_rows()');
end $$;
