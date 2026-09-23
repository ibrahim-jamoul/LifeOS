# 01 — Architecture cible V3 bis

## 1. Séparation des responsabilités

### A. Système global

Responsable de :
- `goals` ;
- `projects` si présent dans la V3 ;
- `tasks` ;
- `habits` ;
- `kpis` ;
- planification ;
- Aujourd'hui ;
- À venir ;
- Objectifs 2026 ;
- revue hebdomadaire/mensuelle globale.

### B. Module Religion

Responsable de :
- `religion_routines` / `religion_logs` ;
- `quran_items` / `quran_sessions` ;
- `quran_revision_points` si migration validée ;
- `arabic_profiles` / `arabic_sessions` ;
- `study_topics` / `study_sessions` ;
- ressources Religion dans `resources`.

Le module Religion ne crée pas un second système de tâches ou d'objectifs.

### C. Couche IA

Responsable de :
- produire du contenu structuré ;
- lire un contexte minimal ;
- analyser les données ;
- détecter ce qui doit être revu ;
- produire fiches mémo et synthèses ;
- formuler des recommandations ;
- préparer des actions mais ne pas les exécuter sans autorisation lorsque celles-ci modifient LifeOS.

### D. Supabase

Responsable de :
- mémoire long terme ;
- historique ;
- état de progression ;
- provenance et source ;
- dates de révision ;
- journalisation des actions.

## 2. Flux pédagogique

```text
Objectif / domaine
      ↓
Contexte utile sélectionné
      ↓
IA prépare une activité
      ↓
Objet JSON validé
      ↓
LifeOS / Supabase
      ↓
Utilisateur réalise l'activité
      ↓
Résultat / session / maîtrise
      ↓
Moteur de révision
      ↓
Fiche mémo / rappel / prochaine activité
```

## 3. Flux de revue hebdomadaire

```text
Données factuelles de la semaine
      ↓
Agrégations déterministes
      ↓
KPI structurés
      ↓
IA interprète uniquement les faits disponibles
      ↓
Résumé court + recommandations
      ↓
Validation utilisateur avant action
```

Les nombres doivent provenir de requêtes et calculs déterministes, pas être inventés par le modèle.

## 4. Déploiement progressif

### Phase 1 — manuel
ChatGPT génère des objets JSON qui sont importés dans LifeOS.

### Phase 2 — import contrôlé
LifeOS valide le JSON : schéma, doublons, source, ownership, dates.

### Phase 3 — API
Backend serveur → modèle IA → validation → Supabase.

### Phase 4 — assistant adaptatif
Context Builder + planification pédagogique + révisions + recommandations + actions contrôlées.
