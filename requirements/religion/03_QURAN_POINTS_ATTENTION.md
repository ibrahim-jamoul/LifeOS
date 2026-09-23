# 03 — Points d'attention Coran ("tickets" de révision)

## Besoin

Pendant une mémorisation ou une récitation, l'utilisateur peut constater qu'il se trompe régulièrement sur un passage précis.

Il doit pouvoir ouvrir un **point d'attention** en quelques secondes, sans quitter son workflow.

Exemple :
- Sourate : Al-Mulk
- Verset : 8
- Type : hésitation / confusion / mémorisation / prononciation / tajwid / autre
- Note : "Je confonds le début avec le verset précédent."
- Priorité : normale / haute
- Statut : actif

Ce point reste persistant jusqu'à résolution.

## UX

### Entrées possibles
Ajouter le bouton `Signaler une difficulté` :
- dans la page Coran > En cours ;
- dans le formulaire de fin d'une session Coran ;
- éventuellement depuis Coran > Révisions.

### Formulaire en tiroir / menu déroulant

Le composant doit être un **drawer / panneau latéral / accordéon** léger, pas une nouvelle page obligatoire.

Champs :
1. Sourate — select.
2. Verset — select dépendant de la sourate.
3. Type de difficulté.
4. Note courte.
5. Priorité.
6. Option : "Me le reproposer à la prochaine révision".
7. Enregistrer.

Le sélecteur de verset doit être borné par les métadonnées réelles de la sourate.
Ne pas inventer le nombre de versets : utiliser une source de métadonnées Coran fiable ou un dataset déjà présent dans l'application.

## Cycle de vie

```text
ACTIF
  ↓
REVU
  ↓
ENCORE FRAGILE ───────┐
  ↓                   │
MAÎTRISÉ              │
  ↓                   │
RÉSOLU                 │
                      └── augmente le compteur d'occurrences
```

Statuts techniques simples recommandés :
- `active`
- `resolved`
- `archived`

L'état "revu mais encore fragile" peut rester `active` tout en mettant à jour :
- `last_seen_at`
- `occurrence_count`
- `next_review_at`
- `priority`

## Mise en avant pendant la révision

Dans Coran > Révisions, créer un bloc placé avant les révisions standards :

### À surveiller

Pour chaque point :
- Sourate + verset ;
- type ;
- note ;
- nombre d'occurrences ;
- dernière occurrence ;
- priorité ;
- bouton `Réviser maintenant`;
- bouton `Toujours fragile`;
- bouton `Maîtrisé`.

### Logique

Un point actif doit être remonté si :
- `next_review_at <= now()`, ou
- on entre dans la semaine mensuelle de consolidation, ou
- la page / plage de versets contenant ce point est en cours de révision.

Pendant la semaine 4/5 de consolidation :
- tous les points actifs du mois doivent être remontés en priorité ;
- les points à priorité haute doivent apparaître avant les autres.

## Comportement après révision

### Toujours fragile
- conserver `status = active`;
- `occurrence_count += 1`;
- mettre à jour `last_seen_at`;
- proposer/recalculer `next_review_at`.

### Maîtrisé
- `status = resolved`;
- définir `resolved_at`;
- ne plus apparaître dans la file active ;
- conserver l'historique.

### Réouverture
Un point résolu peut être rouvert si l'erreur revient.

## Intégration avec quran_items

Le ticket peut être lié à `quran_item_id` lorsque l'élément Coran concerné existe.
Cependant le ticket doit également pouvoir être créé même si le passage n'est pas encore modélisé dans `quran_items`.

Donc :
- `quran_item_id` : nullable ;
- `surah_number` + `ayah_number` : obligatoires.

## Règle métier importante

Ne pas stocker ces difficultés uniquement dans `quran_items.notes` ou `quran_sessions.outcome`.

Pourquoi :
- une difficulté doit survivre à plusieurs sessions ;
- elle possède son propre cycle de vie ;
- elle doit être priorisable ;
- elle doit être résoluble ;
- elle doit être recherchable ;
- elle doit pouvoir être remontée automatiquement.

Il faut donc un objet/table dédié.
