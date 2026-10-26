# Zia Flat Lite — version autonome en essai

Cette branche remplace le couple Zia + surcouche Flat par un seul mod Sine.
Elle conserve la présentation choisie et retire les autres modules JavaScript.
La branche `main` reste la surcouche CSS 0.1.1, qui nécessite Zia.

## Ce qui reste

- Disposition Zia de la sidebar, avec le nom et l'icône du workspace en haut.
- Aspect flat : coins carrés, sans halos, ombres ni flou d'arrière-plan.
- Barre d'adresse : domaine et titre au repos, adresse au survol, édition et
  suggestions natives de Zen au clic, habillées avec les styles Zia.
- Lecteur média natif de Zen habillé comme Zia, avec pochette issue des
  métadonnées du média et contour de progression carré.
- Animation du fichier vers le bouton de téléchargement/bibliothèque et
  progression des téléchargements.
- Apparence claire/sombre suivant le workspace et Zen.

## Ce qui est retiré

Détection des couleurs des sites et captures de page, drag personnalisé,
cartes de split, aperçu Glance, cartes d'onglets au survol de Zia, rebonds et
traitements des dossiers par Zia, icônothèque, PiP personnalisé, Multiview,
IA, PDF personnalisé et effets Ultra. Les fonctions natives de Zen restent
accessibles : on ne désactive pas ses splits, ses dossiers ou ses aperçus.
Les correctifs expérimentaux des boutons souris ne sont pas inclus.

Le script n'ajoute aucune boucle de vérification périodique. Les changements
proviennent des événements natifs, de quelques observations ciblées et de
callbacks regroupés par frame. Le lecteur utilise la progression déjà mise
à jour par Zen ; il ne crée pas un deuxième minuteur.

## Installer cette branche sous Windows

1. Installer Sine dans Zen et autoriser les scripts des dépôts non officiels
   dans ses réglages.
2. Télécharger le ZIP de la branche `feat/lightweight-standalone` et l'extraire,
   ou cloner cette branche :

   ```powershell
   git clone --branch feat/lightweight-standalone https://github.com/SHIRO-Suit/zia-flat.git
   ```

3. Dans `about:support`, relever le chemin du **Dossier de profil**.
4. Depuis le dossier téléchargé, exécuter :

   ```powershell
   .\Install-Lite.ps1 -ProfilePath 'CHEMIN DU DOSSIER DE PROFIL'
   ```

5. Fermer complètement Zen puis le relancer.

Le script sauvegarde la configuration Sine, désactive Zia d'origine et active
Zia Flat Lite. Il conserve les autres mods et ne change pas `prefs.js`.
Les mises à jour automatiques de cette version locale sont suspendues pendant
l'essai pour éviter qu'elle soit remplacée par la surcouche CSS de `main`.

Le mod n'a pas besoin de Zia activé ; ne pas activer les deux scripts ensemble.
Sous Linux/macOS, utiliser les fichiers `theme.json`, `chrome.css`,
`zia-flat.uc.js` et `icons/` dans un mod Sine ; l'installation n'y est pas testée.

## Revenir en arrière

Dans ce même dossier :

```powershell
.\Restore-Lite.ps1
```

Puis redémarrer Zen. Le script refuse d'écraser une configuration Sine modifiée
entre-temps. Les sauvegardes restent dans `local-backup/`, exclu de Git.

## Validation et limites

```sh
npm test
npm run check
```

Tests : édition/retour d'adresse, déplacement et restauration de l'indicateur
de workspace, métadonnées et progression média, abonnement/désabonnement aux
téléchargements, absence d'animation de l'historique au démarrage et vérification
des ressources. Le script d'installation et son retour arrière sont également
testés dans un profil fictif.

La fluidité et les détails d'affichage restent à vérifier dans Zen après le
redémarrage. Cette version est destinée au Zen installé lors du développement
et aux styles Zia 2.110.1. Les API internes de Zen peuvent changer.

La détection spéciale des pochettes YouTube/Kick et les contournements de Zia
pour les flux sans position ne sont pas inclus : sans métadonnée exploitable,
la pochette reste l'icône native du site, et la disponibilité d'une carte live
dépend de Zen. Le popup d'adresse conserve le placement et les interactions
natifs ; les ajustements géométriques spécifiques de Zia sont retirés.

## Sources et licences

Styles sélectionnés et animation de téléchargement dérivés de
[Zia](https://github.com/z1n-k/zia), version 2.110.1, commit
`1c6751193b29b241cdcc05d24a1edc601e19a62b`, licence MIT (z1nk).
Les modules se trouvent sous `src/`. Les options propres à Zia y ont été
figées et les blocs désactivés retirés ; les réglages natifs de Zen restent
référencés là où ils concernent sa disposition.

Les icônes nécessaires seulement sont livrées, dont des icônes Tabler :
voir `icons/tabler-LICENSE`. Adaptations et runtime Lite préparés pour
SHIRO-Suit avec assistance IA. Projet indépendant de Zia, Zen et Sine.

Construire les fichiers distribués avec `node scripts/build.cjs`.
