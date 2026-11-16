# Journal de veille — sauvegardes et rançongiciels

Sujet : sauvegardes hors ligne et immuables face aux rançongiciels dans les collectivités. Contexte : Veeam et bandes LTO.

Début du dispositif : 2 novembre 2026. Aucun historique antérieur n’est revendiqué.

## Sources de départ — collectées le 2 novembre 2026

### ANSSI — guide TPE/PME, sauvegardes
Source : https://messervices.cyber.gouv.fr/documents-guides/20241212_np_anssi_guide_tpe-pme_v2.pdf
Date : version datée du 12 décembre 2024 dans le nom du document.
Résumé : les copies déconnectées et les tests réguliers de restauration complètent la sauvegarde en ligne.
Intérêt : réfléchir à la rotation et à la déconnexion des bandes LTO ainsi qu’à la vérification des restaurations.
Limite : guide général TPE/PME, à adapter au contexte d’une collectivité ; ne décrit pas l’infrastructure de la mairie.
Analyse personnelle de Farès : à compléter.
Piste de test : documenter en laboratoire la restauration d’un fichier et mesurer son délai ; test non réalisé.

### Veeam — Immutability for Backup Files
Source : https://helpcenter.veeam.com/docs/vbr/userguide/immutability_hv.html
Date de publication : non établie ; documentation évolutive, consultée le 2 novembre 2026.
Résumé : l’immutabilité protège les sauvegardes contre la suppression pendant la période configurée, selon les conditions du produit.
Intérêt : comparer une copie immuable avec un support LTO déconnecté.
Limite : source éditeur, dépend de la version et du type de dépôt ; ce n’est pas une preuve de configuration locale.
Analyse personnelle de Farès : à compléter.
Piste de test : comparer en laboratoire les droits de suppression avant et après expiration de la conservation ; test non réalisé.

## Fiche à compléter pour chaque nouveauté

- Date de publication et date de collecte :
- Titre, auteur/source et URL :
- Nouveauté technique et résumé factuel :
- Impact potentiel pour une collectivité :
- Limites et recoupement :
- Mon analyse personnelle :
- Test envisagé ou réalisé, résultat et preuve :

## Vérification pédagogique

Le guide d’accompagnement BTS SIO demande une veille régulière pour identifier les évolutions et renforcer les compétences, avec des outils et une stratégie explicables. Source : https://www.reseaucerta.org/sites/default/files/sio/GuideAccompagnement16mars.pdf (pages 25–26).
Le dispositif est cohérent avec ces attentes ; il reste à produire des analyses personnelles régulières et à faire confirmer les consignes spécifiques de la session 2027 par le formateur.

Organisation proposée : flux CERT-FR dans Feedly et Google Alertes par e-mail. Abonnements à configurer dans les comptes personnels. L’automatisation du chat a été supprimée à la demande de Farès. Aucun abonnement externe n’a été créé.
