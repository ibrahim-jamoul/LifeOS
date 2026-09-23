# 02 — Contrat IA → LifeOS

## Objectif

Stabiliser un format indépendant du fournisseur de modèle afin que le même contrat soit utilisable :
- manuellement avec ChatGPT ;
- plus tard via API.

## Enveloppe commune

```json
{
  "schema_version": "1.0",
  "object_type": "learning_item",
  "module": "religion",
  "title": "...",
  "status": "draft",
  "scheduled_for": "2026-09-24",
  "estimated_minutes": 10,
  "difficulty": 2,
  "content": {},
  "sources": [],
  "pedagogy": {},
  "links": {},
  "metadata": {}
}
```

## Types V1 retenus

- `learning_item`
- `lesson`
- `revision`
- `quiz`
- `quiz_result`
- `memo`
- `recommendation`
- `weekly_summary`
- `monthly_summary`
- `resource`
- `dua`
- `hadith`
- `vocabulary`
- `concept`

Les types de domaine ne doivent pas forcément devenir chacun une table. Le mapping vers les tables existantes doit être défini après audit.

## Sources

```json
{
  "label": "...",
  "url": "...",
  "reference": "...",
  "author": "...",
  "retrieved_at": "...",
  "verification_status": "unverified|verified|validated"
}
```

Une source absente doit rester absente. Ne jamais fabriquer une référence.

## Métadonnées pédagogiques

```json
{
  "mastery_before": 0.4,
  "mastery_after": null,
  "importance": 3,
  "next_review_at": null,
  "revision_intervals_days": [1, 3, 7, 30],
  "prerequisites": [],
  "related_items": []
}
```

Les intervalles ci-dessus sont un exemple de structure, pas une règle métier imposée. Le moteur réel doit être configurable selon difficulté, résultat, importance et temps écoulé.

## Recommandation

```json
{
  "object_type": "recommendation",
  "module": "global",
  "reason": "...",
  "evidence": [],
  "proposed_action": {
    "action_type": "schedule_revision",
    "payload": {}
  },
  "requires_confirmation": true
}
```

Une recommandation ne doit jamais être confondue avec une action exécutée.
