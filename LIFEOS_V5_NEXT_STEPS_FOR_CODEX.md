> **Note V5 lot 2 (plus récent)** : ce fichier documente le lot 1. Lire d’abord `docs/learning-v5/LOT2_AVANCEMENT.md` et `tests/integration/learning-v5-lot2-rls.md`. Le lot 2 est un développement non déployé qui nécessite validations SQL, RLS, build et mobile.

# Mandat Codex — continuer V5 à partir du code de ce ZIP

**Ne recommence pas le module ni l'audit.** Ce snapshot contient un lot 1 implémenté mais non buildé ; démarre par son intégration, la vérification de typage/build et le test sur Supabase staging.

## Étape 0 — sécuriser la base

- Comparer la branche courante du dépôt LifeOS au snapshot ici ; procéder par diff, garder toutes les améliorations plus récentes de la branche distante.
- Lire `AGENTS.md`, le cahier fonctionnel joint et le document UX ; préserver le flux Coran et les données existantes.
- Vérifier le schéma production vs migrations. Ne jamais rejouer aveuglément les migrations déjà appliquées.
- Corriger tout échec lint/TS/tests/build du lot 1. Installer une version de Node compatible.
- Vérifier SQL via staging, routes utilisateurs A/B, RPC security definer et la séparation des propriétés entre utilisateurs.
- Photographier les 5 écrans mobile 390×844 en staging pour revue humaine, au lieu d'utiliser les maquettes comme preuves.

## Étape 1 — terminer le cœur du produit

- Édition des parcours et modules, ordre explicite, statut, prérequis, sources vérifiées et contenu leçon.
- Sessions spécialisées par type (lecture, exercice, lab, anglais, arabe, Quran), retour sur erreur et capture rapide avec notes minimales.
- Révisions QCM, erreurs, fiches et cartes, historique détaillé, import idempotent avec version et provenance.
- Référencement et recherche transversale des ressources, connaissances, sessions et erreurs.
- Association et synchronisation avec tâches Aujourd'hui **uniquement sur planification explicite**, sans créer de duplicata de routine.
- Statistiques basées sur des preuves et revue hebdomadaire automatique factuelle.

## Étape 2 — modules spécialisés

- Arabe : 5 étapes de la bible personnelle ; réutiliser `arabic_profiles` et `arabic_sessions`.
- Anglais : interactions oral, entretien, réunion, présentation ; source contextualisée.
- Certifications : sujets officiels versionnés, lab, QCM, examen blanc, projet appliqué ; réutiliser projets existants.
- Coran : planning 3 pages / mois + semaine consolidation, suivi sourate/verset, points d'attention, tafsir/sens avec provenance.
- Lecture, business et finance : synthèses, décisions et application sans conseils financiers automatiques.

## Étape 3 — assistant pédagogique

- Sources officielles/validées et preuves conservées ; ne jamais inventer de référence religieuse.
- L'IA propose une leçon, quiz, révision et fiche, mais aucune mutation silencieuse. Consentement explicite pour contenu privé.
- Les recommandations ne remplacent ni les résultats de tests ni les arbitrages manuels de priorité.

## Critère d'acceptation

- Utilisable chaque jour en moins de 5 minutes pour piloter et enregistrer les apprentissages.
- Zéro redondance entre Objectifs / Aujourd'hui / Apprentissage.
- Pas de régression Religion/Coran/Arabe.
- RLS vérifiée sur deux vrais comptes de staging ; impossible d'afficher/modifier l'objet d'autrui.
- `npm run check` passe, et le parcours complet mobile passe en E2E.
- Les 10 planches servent de référence esthétique, pas d'exigence de copie pixel-par-pixel.
