# Zia Flat

Une surcouche CSS pour **Zia dans Zen Browser** : coins carres, sans ombres,
halos ni flou d'arriere-plan. Les couleurs, espacements et fonctions de Zia
sont conserves. Les cartes de depot gauche/droite restent fixes et le flou de
transition de la vignette de drag est retire.
La pochette du lecteur media et son contour de progression sont carres aussi ;
l'indication de progression reste fonctionnelle.

## Installation avec Sine

1. Installer et activer [Zia](https://github.com/z1n-k/zia) dans Sine.
2. Dans **Parametres > Sine Mods**, ajouter `SHIRO-Suit/zia-flat` depuis le champ
   d'installation par depot GitHub, puis activer **Zia Flat**.
3. Redemarrer Zen.

Zia Flat contient uniquement du CSS : aucune autorisation JavaScript
supplementaire n'est necessaire pour cette surcouche. Zia lui-meme conserve ses
propres besoins. Le depot doit etre publie et accessible avant l'installation
par cette adresse.

Pour recuperer le meme aspect sur un autre ordinateur, installer les deux mods
de la meme facon. Aucun nom de profil ni chemin personnel n'est embarque.

## Installation manuelle

Telecharger ce depot et copier `chrome.css` dans le dossier `chrome` du profil
Zen sous le nom `zia-flat.css`. Pour trouver le profil, ouvrir `about:support`
puis **Dossier de profil > Ouvrir le dossier**.

Ajouter a la fin de `chrome/userChrome.css`, sans effacer son contenu :

```css
@import "zia-flat.css";
```

Les imports CSS doivent preceder les regles CSS ordinaires : si votre fichier
contient deja des regles, placer cet import avec les autres imports en tete,
apres ceux des autres themes. Activer
`toolkit.legacyUserProfileCustomizations.stylesheets` dans `about:config` si
necessaire, puis redemarrer Zen. Preferer Sine pour eviter la gestion manuelle.

## Revenir en arriere

Desactiver Zia Flat dans Sine et redemarrer. En installation manuelle, retirer
l'import ajoute et redemarrer.

Si le style a deja ete colle directement dans le fichier de Zia sur un ancien
ordinateur, il faut restaurer ce fichier pour qu'une simple desactivation de
la surcouche fasse reapparaitre les arrondis.

## Portee et limites

- Developpe sur Zia **2.110.1**, sous Windows. L'installation Sine separee et
  les autres plateformes restent a verifier.
- Ne modifie pas les pages web, les fenetres PiP separees ou les coins natifs
  de la fenetre dessines par le systeme.
- Les coins deja dessines dans les pixels d'une miniature ne peuvent pas etre
  changes par CSS.
- Les anciens essais JavaScript de performance et de boutons souris ne font
  pas partie de ce mod. Cette version partage l'apparence flat uniquement.
- Le gain de fluidite varie selon la machine et les sites ; aucun gain chiffre
  n'est garanti.
- Les mises a jour de Zia peuvent necessiter une adaptation de cette surcouche.

## Credits

[Zia](https://github.com/z1n-k/zia) par z1nk, licence MIT.
Surcouche flat par SHIRO-Suit, preparee avec assistance IA, licence MIT.
Projet independant de Zia, Zen Browser et Sine.
