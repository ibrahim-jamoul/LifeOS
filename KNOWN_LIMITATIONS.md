# Known limitations

This file is updated as implementation and verification progress. No limitation
is accepted silently.

- Les sous-règles Coran « semaines 1–3 » et « semaine 4/5 » sont conservées
  dans le contexte de la routine. Le moteur gère la fréquence hebdomadaire ou
  mensuelle, mais n’impose pas automatiquement la semaine du mois.
- Une routine `flexible` ou `contextual` peut être cochée, mais n’est pas
  comptée comme manquée puisqu’aucun jour précis n’est connu.
- Les rappels internes et échéances sont opérationnels. Les notifications push
  navigateur ne sont pas ajoutées dans cette mission.
- Les heures absentes du référentiel restent à configurer ; aucun rappel à une
  heure arbitraire n’est généré.
- Les valeurs historiques déjà présentes et différentes du Word sont
  conservées. Elles apparaissent comme conflits dans la simulation d’import et
  doivent être arbitrées manuellement si l’utilisateur souhaite les remplacer.
- L’IA reste facultative et désactivée tant que les variables serveur du
  fournisseur ne sont pas configurées.
