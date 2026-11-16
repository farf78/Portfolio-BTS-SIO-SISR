# Portfolio de Farès Aref — édition blanche

Direction visuelle : fond blanc, typographie ample, accents bleus et globe argenté. `white.css` contient la nouvelle présentation ; les anciennes feuilles de style ne sont plus chargées. L’introduction « Bonjour. » et les transitions utilisent des fondus et de légers déplacements. La version spatiale précédente est conservée dans `archive/version-spatiale/`.

## Ouvrir
Double-cliquer sur **Lancer le portfolio.cmd**. Le lanceur trouve Node.js (installation système ou runtime de ce PC), démarre un serveur privé sur la boucle locale puis ouvre le navigateur. Il réutilise seulement un serveur identifié comme appartenant à ce dossier et choisit un autre port si nécessaire. Aucun paquet à installer.

On peut aussi ouvrir **index.html** directement : bibliothèques, polices, carte, photo et texture sont locales. La texture 3D est intégrée dans un script pour éviter le blocage des images WebGL avec file://.

## Animations
Les animations complètes démarrent dès l’ouverture. Le bouton **Réglages** de l’en-tête permet de les réduire (voir ci-dessous). Le bouton Rejouer l’introduction permet de revoir l’entrée.

L’entrée est passable. Dix rubriques indépendantes restent accessibles par menu, précédent/suivant, historique et lien direct. Le document global ne défile pas ; une rubrique longue reste défilable sur un petit écran ou à fort zoom.

## Interactions
- Voyage Terre → Europe → France → Île-de-France → Mantes-la-Ville, puis photo réelle de la mairie. Étapes sélectionnables, voyage passable et rejouable.
- Aperçus des projets, flux discrets et ouverture animée des détails.
- Liens pédagogiques entre compétences et projets justificatifs, sans prétendre à une validation officielle du diplôme.
- Radar décoratif et panneaux de veille ; aucun faux flux d’actualités.
- Formulaire préparant un brouillon dans la messagerie, sans serveur d’envoi.

## Introduction
Séquence de déchiffrement (`experience.js`, styles dans `intro.css`) : une clé se verrouille octet par octet, puis le nom, la formation, l’alternance et les domaines passent du texte chiffré au texte en clair pendant qu’un fond de caractères s’efface ; le cadenas s’ouvre et le portfolio apparaît. Environ 6 s, passable avec le bouton ou `Échap`, rejouable depuis le pied de page. Elle est purement décorative : aucun chiffrement réel n’est effectué. Elle se joue quel que soit le réglage d’animations du système ; seul le réglage du portfolio la raccourcit.

## Réglages
Le bouton **Réglages** (en haut à droite) regroupe trois options :
- **Thème sombre** : bascule clair/sombre, mémorisée sur le navigateur. Le globe, la carte du voyage et l’introduction suivent le thème.
- **Réduire les animations** : changements de rubrique instantanés, introduction jouée trois fois plus vite (environ 2 s) et sans fond animé, relief des cartes et halos coupés. Choix mémorisé. Utile sur un PC peu puissant.
- **Mode oral** : plein écran sans en-tête ni pied de page, avec une barre discrète (étape, chronomètre, bouton Quitter). `→` / `Espace` / `Page suivante` avancent, `←` recule, `1` à `0` ouvrent directement une rubrique, `Début` / `Fin` vont aux extrémités, `Échap` ferme une fiche puis quitte. Après la rubrique Projets, `→` ouvre les quatre fiches projet l’une après l’autre. L’ordre de passage se modifie dans la liste `ORAL_ORDER` en tête de `settings.js`.

## Organisation
`index.html` : structure. `white.css` : styles et adaptation aux écrans. `app.js` : contenu interactif et globe. `experience.js` : navigation et introduction. `premium.js` : voyage et projets. `settings.css` / `settings.js` : bouton Réglages, thème sombre, réduction des animations, mode oral. `wow.css` / `wow.js` : couche d’animations (rideau de transition entre rubriques, titres révélés mot à mot, nom animé lettre par lettre, cartes en relief 3D avec reflet, boutons magnétiques, pointeur personnalisé natif, halos d’ambiance, compteurs, frise qui se dessine, indicateur de menu glissant). `assets/` : ressources locales. `server.cjs` / `launcher.cjs` : aperçu local. `archive/` : versions antérieures (`version-avant-reglages/` : fichiers tels qu’ils étaient avant l’ajout du bouton Réglages).

## Crédits
- Mairie : **Spedona**, mars 2006, « Mantes-la-Ville mairie01.jpg », Wikimedia Commons, **CC BY-SA 3.0**. https://commons.wikimedia.org/wiki/File:Mantes-la-Ville_mairie01.jpg — https://creativecommons.org/licenses/by-sa/3.0/ . Source conservée ; recadrage et filtre à l’affichage. Photo historique, non présentée comme récente.
- Monde : johan/world.geo.json, contours dérivés de Natural Earth (domaine public). https://github.com/johan/world.geo.json
- Départements : Grégoire David, france-geojson, Licence Ouverte 2.0. https://github.com/gregoiredavid/france-geojson . Localisation illustrative de la commune, pas un relevé cadastral du bâtiment.
- Texture terrestre : exemples Three.js. Three.js r128 (MIT), GSAP 3.12.5 et ScrollTrigger (mentions dans les fichiers).
- Polices : Outfit et Space Mono, Google Fonts, SIL Open Font License ; fichiers locaux utilisés.

## Informations
CV, parcours, missions, coordonnées, projets et documents conservés. Pourcentages : auto-évaluations d’origine. Cloud : perspective d’apprentissage. Le tableau E5 fourni reste la référence et son ancien libellé « session 2024 » n’est pas modifié. Aucun script de migration absent n’est proposé en téléchargement.
