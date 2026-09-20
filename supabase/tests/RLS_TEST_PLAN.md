# RLS Test Plan

Use two users: A and B.

For every user-owned table:

1. A inserts own row: ALLOW.
2. A selects own row: ALLOW.
3. B selects A row by exact UUID: DENY / zero rows.
4. B updates A row: DENY.
5. B deletes A row: DENY.
6. anon selects row: DENY.
7. A attempts insert with `user_id = B`: DENY.
8. A attempts to update an owned row to `user_id = B`: DENY.
9. A attempts to reference a parent row owned by B: DENY.

Storage:
1. A uploads under `<A_UID>/...`: ALLOW.
2. A uploads under `<B_UID>/...`: DENY.
3. B reads A object: DENY.
4. B updates A object: DENY.
5. Anonymous read: DENY.
6. Owner delete: ALLOW.

Use the current Supabase database testing tooling if available in the project.
