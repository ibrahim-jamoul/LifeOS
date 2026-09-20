# LifeOS — Codex Build Pack

**Version:** 1.0  
**Date:** 2026-09-20  
**Target:** private personal web application, deployed on **Vercel** with **Supabase** for authentication, PostgreSQL and storage.

## What this pack is

This repository pack is the source of truth for building LifeOS. Codex should not treat it as a loose brainstorm. The files define:

- product intent and scope;
- the 9 branches of LifeOS;
- functional rules;
- information architecture and routes;
- Supabase data model and RLS expectations;
- alerts and review engine;
- security and privacy requirements;
- initial 2026 portfolio;
- testing and acceptance criteria;
- implementation sequence;
- Codex operating instructions.

## Read order for Codex

1. `AGENTS.md`
2. `01_PRODUCT_VISION.md`
3. `02_USER_GUIDE.md`
4. `03_FUNCTIONAL_SPEC.md`
5. `04_INFORMATION_ARCHITECTURE.md`
6. `05_TECH_ARCHITECTURE.md`
7. `06_ALERTS_AND_REVIEWS.md`
8. `07_SECURITY_PRIVACY.md`
9. `08_INITIAL_2026_PORTFOLIO.md`
10. `09_IMPLEMENTATION_PLAN.md`
11. `10_ACCEPTANCE_TESTS.md`
12. `11_CODEX_MASTER_PROMPT.md`
13. `supabase/migrations/001_initial_schema.sql`

## Product principle

LifeOS is not a collection of disconnected trackers.

Its core loop is:

**Vision → Objective → Project → Action → Measurement → Review → Decision → Adjustment**

The application is considered useful only if opening it answers, in under two minutes:

1. What matters now?
2. What must I do today/this week?
3. What is late or at risk?
4. Am I progressing against my objectives?
5. Which project should receive or lose resources?

## Non-negotiable build principles

- Functional before visual.
- Single-user use case first, but secure multi-user data isolation from day one.
- No fake data in production.
- All user-owned data protected by Supabase RLS.
- No service-role or LLM secret in the browser.
- CRUD must work end-to-end before visual polish.
- Every key record must have edit/delete or archive behavior.
- Destructive actions require confirmation.
- Dates/times must be timezone-aware.
- Mobile usable, desktop optimized.
- No branch may become a dead-end silo; goals/projects/tasks can link across branches.

## Minimum deployable result

A signed-in user can:

- create and edit goals, projects, tasks and KPIs;
- see overdue/upcoming alerts;
- perform weekly reviews and log decisions;
- use each of the 9 branches to enter and retrieve real data;
- upload private documents and photos;
- track finances, health/habits, Arabic, Quran and religion/study activity;
- access a scoped AI assistant if an AI provider key is configured;
- deploy the app to Vercel and connect it to Supabase without code changes.

See `10_ACCEPTANCE_TESTS.md` for the formal definition of done.
