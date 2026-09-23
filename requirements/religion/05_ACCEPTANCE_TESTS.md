# 05 — Critères d'acceptation

## A. Navigation Religion

- [ ] La branche Religion possède les entrées définies dans la spec.
- [ ] Le design reste cohérent avec LifeOS existant.
- [ ] Les routes existantes non Religion ne régressent pas.

## B. Aujourd'hui

- [ ] Les routines quotidiennes pertinentes apparaissent.
- [ ] La sadaqa n'apparaît automatiquement que le vendredi.
- [ ] Les routines hebdomadaires apparaissent uniquement le jour configuré.
- [ ] Une action annuelle/long terme n'apparaît pas comme action quotidienne sans planification.
- [ ] Une routine réalisée peut être enregistrée sans double création accidentelle.

## C. Coran

- [ ] Création d'un `quran_item`.
- [ ] Enregistrement d'une `quran_session`.
- [ ] Affichage de la confiance et prochaine révision.
- [ ] Progression mensuelle vers 3 pages.
- [ ] Semaine de révision différente des semaines de nouvelle page.

## D. Point d'attention Coran

- [ ] Bouton `Signaler une difficulté`.
- [ ] Ouverture dans un drawer/menu non destructif.
- [ ] Sélection d'une sourate.
- [ ] Sélection d'un verset valide pour la sourate.
- [ ] Choix du type de difficulté.
- [ ] Note optionnelle.
- [ ] Priorité.
- [ ] Création persistante en base.
- [ ] Le point apparaît dans Coran > Révisions.
- [ ] Un point à haute priorité apparaît avant un point normal.
- [ ] Les points actifs sont mis en avant pendant la semaine de consolidation.
- [ ] `Toujours fragile` incrémente l'occurrence et conserve le point actif.
- [ ] `Maîtrisé` le résout sans supprimer son historique.
- [ ] Possibilité de rouvrir un point résolu.
- [ ] RLS : impossible de lire/modifier un point appartenant à un autre utilisateur.

## E. Arabe

- [ ] Session avec durée.
- [ ] Ressource/texte.
- [ ] Skill.
- [ ] Nouveaux mots.
- [ ] Mots révisés.
- [ ] Note.
- [ ] Historique visible.

## F. Étude religieuse

- [ ] Affichage des `study_topics`.
- [ ] Enregistrement de `study_sessions`.
- [ ] Domaine Seerah/Aqida/Fiqh/Hadith/Tafsir/Histoire/Biographies.
- [ ] Synthèse et takeaway.

## G. Bibliothèque

- [ ] Les ressources Religion utilisent `resources` avec `life_area='religion'`.
- [ ] Filtrage par statut/type/domaine possible.
- [ ] Pas de duplication d'un nouveau système de ressources.

## H. Progression

- [ ] KPI calculés à partir des vraies données.
- [ ] Vues semaine/mois.
- [ ] Nombre de points Coran actifs et résolus.
- [ ] Pas de données fictives en production.

## I. Tests

- [ ] Build réussi.
- [ ] Typecheck/lint selon repo.
- [ ] Tests fonctionnels minimum.
- [ ] Vérification de la migration.
- [ ] Vérification des RLS.
- [ ] Rollback possible de la migration avant mise en prod.
