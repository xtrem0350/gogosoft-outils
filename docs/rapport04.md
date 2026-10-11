# Rapport 04 — Harmonisation visuelle de la démo

## Audit de référence : `/auth` (avant correction)

### Structure JSX

- `<main>` plein écran avec image de fond positionnée en absolu et overlay noir.
- Conteneur centré `max-w-6xl`, puis carte `w-full max-w-5xl` en deux colonnes à partir de `lg` (`lg:grid-cols-[0.9fr_1.1fr]`).
- Colonne gauche de présentation avec logo et texte de marque ; colonne droite contenant le titre, les champs du formulaire et les Tabs shadcn Connexion / Inscription.
- Le formulaire est une page, pas une modale. Les deux overlays présents sont la tarification (`PricingModal`, `Dialog`) et la confirmation d’avatar (`AlertDialog`).

### Fond, logo et classes visuelles exactes

- Image de fond : `https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop`, `bg-cover bg-center`.
- Overlay : `absolute inset-0 bg-black/60`.
- Carte : `overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md`, largeur `max-w-5xl`.
- Colonne de marque : `bg-slate-900/70 p-8 text-white`, puis `lg:p-10`; logo `leprofile.png` dans `size-32`, `rounded-full`, `object-cover`.
- Colonne formulaire : `bg-slate-950/60 p-7 sm:p-10 lg:p-12`; contenu `mx-auto max-w-md`.
- Titre de marque : `text-2xl font-bold text-white`; titre principal : `text-3xl font-bold text-white`; accents liens en `text-orange-300`.
- Tabs : composants shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, avec liste `grid w-full grid-cols-2 bg-white/5`.
- Inputs : surfaces `border-white/10 bg-white/5`, texte blanc et placeholder slate. Les boutons principaux utilisent le bouton shadcn pleine largeur avec transition standard.

### Modalités de défilement et animations

- Pas de modale autour du formulaire ou d’`ScrollArea` sur la route.
- L’`AlertDialogContent` commun est `max-h-[90vh] overflow-y-auto`; le `PricingModal` contient une zone `min-h-0 flex-1 overflow-y-auto` dans un Dialog `max-h-[90vh]`.
- Aucun fade-in de la carte de connexion/inscription. Les composants d’input et boutons utilisent leurs transitions standard ; le contenu tarifaire emploie `animate-fadeIn`.

## Comparatif de `/demo` (avant correction)

- Fond : `bg-gradient-to-br from-orange-50 via-white to-green-50`, sans l’image de fond ni l’overlay de `/auth`.
- Structure : `PageHero` indépendant, grille de modules directement sur la page, sans carte en deux colonnes ni panneau de marque. Aucun logo `leprofile.png`.
- Présentation : titre avec emoji et styles du hero (`text-2xl` puis `sm:text-3xl`), différents du titre blanc `text-3xl font-bold` de `/auth`.
- Cartes modules : `rounded-lg border bg-white shadow-sm`, bordures/fonds slate ou orange clair ; aucune classe `card-3d`/`shadow-3d-hover` et pas de `ring-2 ring-orange-500` à la sélection.
- CTA : thème ivoirien déjà utilisé, mais libellé et taille spécifiques (`h-12`, emoji); lien retour compte vert souligné.
- Défilement : défilement de document naturel, sans zone dédiée ; aucun Dialog propre à la démo.
- Animations : transitions de couleur simples sur les cartes et bouton ; pas d’animation d’entrée de carte.
- Aucun stepper ni composant de pricing dédié à `/demo`. Le wizard et le Dialog tarifaire de `PricingModal` appartiennent à `/auth` et ne sont pas utilisés par la route de démo.

## Logique de démo observée (à préserver)

- Sélection initiale chargée depuis `getDemoModuleCodes()` et convertie via `moduleIdsFromShopCodes()`.
- Chaque carte bascule un `ModuleId` dans l’état local ; le lancement convertit la sélection par `selectedDemoModuleIds()`, appelle `startDemo()` et navigue vers `/dashboard`.
- `demoService` enregistre les modules et la session de démo dans `sessionStorage`; aucun appel à ce service ne sera modifié.

## Harmonisation et validation

À compléter après modification et exécution des vérifications demandées.