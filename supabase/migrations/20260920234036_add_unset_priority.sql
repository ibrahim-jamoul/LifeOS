-- Preserve unknown priorities from imported reference material instead of
-- silently coercing them to the previous `medium` default.
alter type public.priority_level add value if not exists 'unset' before 'low';
