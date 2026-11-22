import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/legal")({ component: LegalPage });

function LegalPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHero
        title="Informations légales"
        subtitle="Conditions d'utilisation et informations sur la protection de vos données"
        icon={Scale}
      />

      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Modèle à personnaliser avant publication : complétez les champs entre crochets et faites
        vérifier ces informations selon la réglementation applicable.
      </p>

      <Tabs defaultValue="cgu" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="cgu" className="min-h-10 whitespace-normal px-2 text-xs sm:text-sm">
            CGU
          </TabsTrigger>
          <TabsTrigger
            value="mentions"
            className="min-h-10 whitespace-normal px-2 text-xs sm:text-sm"
          >
            Mentions légales
          </TabsTrigger>
          <TabsTrigger
            value="confidentialite"
            className="min-h-10 whitespace-normal px-2 text-xs sm:text-sm"
          >
            Confidentialité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cgu">
          <Card>
            <CardHeader>
              <CardTitle>Conditions générales d'utilisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6">
              <section className="space-y-2">
                <h2 className="font-semibold">1. Objet et acceptation</h2>
                <p>
                  Les présentes conditions encadrent l'accès à GogoSoft et l'utilisation de ses
                  outils de gestion d'atelier, de clients, de réparations, de ventes et de
                  facturation. La création d'un compte ou l'utilisation du service vaut acceptation
                  des conditions en vigueur.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">2. Accès au service</h2>
                <p>
                  L'utilisateur doit disposer d'un équipement, d'une connexion Internet et d'un
                  navigateur compatibles. L'éditeur s'efforce d'assurer la disponibilité du service
                  et peut effectuer des opérations de maintenance, de sécurité ou de mise à jour.
                  Certaines fonctionnalités peuvent nécessiter un abonnement actif.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">3. Compte utilisateur</h2>
                <p>
                  L'utilisateur fournit des informations exactes et les maintient à jour. Il
                  protège ses identifiants, limite leur partage et reste responsable des actions
                  effectuées depuis son compte. Toute suspicion d'accès non autorisé doit être
                  signalée rapidement à l'éditeur.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">4. Abonnement et paiement</h2>
                <p>
                  Le prix, la durée, les fonctionnalités incluses et les modalités de paiement sont
                  ceux présentés au moment de la souscription. Les paiements sont dus selon
                  l'échéancier indiqué. En cas d'impayé, l'accès aux fonctions payantes peut être
                  suspendu après information de l'utilisateur, sous réserve des règles impératives
                  applicables. Les conditions de renouvellement, de résiliation et de remboursement
                  sont précisées lors de la souscription.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">5. Obligations de l'utilisateur</h2>
                <p>
                  L'utilisateur utilise le service conformément aux lois, aux présentes conditions
                  et aux droits des tiers. Il reste responsable des données qu'il saisit, des
                  autorisations nécessaires pour les traiter et de la conservation de ses propres
                  copies. Il s'interdit notamment de compromettre la sécurité ou le fonctionnement
                  du service, de détourner ses accès ou d'y déposer des contenus illicites.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">6. Responsabilité</h2>
                <p>
                  Le service est fourni avec des efforts raisonnables de disponibilité et de
                  sécurité, sans garantie d'absence totale d'interruption ou d'erreur. Dans les
                  limites permises par la loi, l'éditeur ne répond pas des pertes résultant d'une
                  mauvaise utilisation, d'identifiants compromis, d'une panne de réseau ou de
                  données saisies incorrectement. Aucune disposition n'exclut une responsabilité
                  qui ne peut légalement être écartée.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">7. Modification et résiliation</h2>
                <p>
                  Les fonctionnalités et les présentes conditions peuvent évoluer. Les changements
                  importants sont communiqués par un moyen approprié. L'utilisateur peut cesser
                  d'utiliser le service et résilier son abonnement selon les modalités communiquées
                  lors de la souscription. Les dispositions qui, par leur nature, doivent survivre
                  à la résiliation restent applicables.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">8. Droit applicable et litiges</h2>
                <p>
                  Les présentes conditions sont régies par le droit de [pays à préciser]. En cas de
                  difficulté, les parties recherchent d'abord une solution amiable. À défaut, le
                  litige est porté devant les juridictions compétentes de [lieu à préciser], sous
                  réserve des règles impératives applicables.
                </p>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentions">
          <Card>
            <CardHeader>
              <CardTitle>Mentions légales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6">
              <section className="space-y-2">
                <h2 className="font-semibold">Éditeur</h2>
                <p>
                  Le service GogoSoft est édité par [raison sociale ou nom de l'éditeur], [forme
                  juridique et capital, le cas échéant], immatriculé sous le numéro [numéro
                  d'immatriculation], dont le siège est situé à [adresse complète].
                </p>
                <p>Directeur de la publication : [nom et fonction].</p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Hébergement</h2>
                <p>
                  Application : [nom, raison sociale, adresse et coordonnées de l'hébergeur].
                  Services de base de données et d'authentification : [prestataire, localisation et
                  coordonnées à compléter].
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Propriété intellectuelle</h2>
                <p>
                  Sauf indication contraire, les logiciels, marques, textes, éléments graphiques et
                  contenus éditoriaux du service sont protégés par les droits de propriété
                  intellectuelle. Toute reproduction ou réutilisation non autorisée est interdite.
                  Les données et contenus ajoutés par l'utilisateur restent soumis aux droits de
                  leurs titulaires ; l'utilisateur autorise leur traitement uniquement pour fournir
                  le service.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Contact</h2>
                <p>
                  Pour toute question relative au service ou aux présentes mentions : [adresse
                  postale] ou [adresse e-mail de contact].
                </p>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidentialite">
          <Card>
            <CardHeader>
              <CardTitle>Politique de confidentialité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6">
              <section className="space-y-2">
                <h2 className="font-semibold">Données collectées</h2>
                <p>
                  Selon les fonctions utilisées, le service traite les données de compte et de
                  contact (nom, adresse e-mail, téléphone), les données d'atelier et d'équipe, les
                  informations de clients et d'interventions saisies par l'utilisateur, les données
                  d'abonnement et de paiement nécessaires au suivi, ainsi que des données
                  techniques de connexion et de sécurité. Les données complètes de carte bancaire
                  ne doivent pas être saisies dans les champs libres du service.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Finalités et bases légales</h2>
                <p>
                  Ces données servent à créer et gérer les comptes, fournir les fonctions du SaaS,
                  traiter les abonnements, assister les utilisateurs, sécuriser la plateforme et
                  respecter les obligations légales. Les traitements nécessaires au contrat
                  reposent sur son exécution ; les obligations légales sur le respect de celles-ci ;
                  la sécurité et l'amélioration du service sur l'intérêt légitime de l'éditeur ;
                  les traitements optionnels soumis au consentement reposent sur celui-ci.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Conservation</h2>
                <p>
                  Les données de compte sont conservées pendant la durée d'utilisation du service,
                  puis supprimées ou anonymisées dans un délai de [délai à préciser], sauf
                  conservation nécessaire à la gestion d'un litige ou imposée par la loi. Les
                  pièces de facturation sont conservées pendant la durée légale applicable.
                  Certaines traces de sécurité peuvent être gardées pendant [durée à préciser].
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Partage et transferts</h2>
                <p>
                  Les données sont accessibles aux personnes autorisées qui en ont besoin et aux
                  prestataires techniques agissant pour fournir l'hébergement, l'authentification,
                  le paiement ou l'assistance. Elles ne sont pas vendues. Elles peuvent être
                  communiquées aux autorités lorsqu'une obligation légale l'exige. Si un
                  prestataire traite des données hors du pays de l'utilisateur, l'éditeur met en
                  place les garanties requises par la réglementation applicable.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Vos droits</h2>
                <p>
                  Selon la loi applicable, vous pouvez demander l'accès, la rectification,
                  l'effacement, la limitation ou la portabilité de vos données, vous opposer à
                  certains traitements ou retirer votre consentement. Vous pouvez aussi saisir
                  l'autorité de protection des données compétente. Adressez votre demande à
                  [adresse e-mail de contact] en précisant le compte concerné.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Sécurité et cookies</h2>
                <p>
                  Des mesures techniques et organisationnelles adaptées visent à protéger les
                  données contre l'accès, la perte ou la divulgation non autorisés. L'utilisateur
                  contribue à cette protection en gardant ses identifiants confidentiels.
                </p>
                <p>
                  Le service peut utiliser des éléments de stockage ou cookies strictement
                  nécessaires à la session, à la sécurité et au fonctionnement des fonctions
                  demandées. Tout outil optionnel de mesure d'audience ou de publicité doit être
                  décrit ici et soumis au consentement lorsque la loi l'impose.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="font-semibold">Contact et mises à jour</h2>
                <p>
                  Pour toute question ou demande relative aux données personnelles, contactez
                  [nom/coordonnées du responsable de traitement]. Cette politique peut être mise à
                  jour ; la date de dernière mise à jour doit être indiquée ici : [date].
                </p>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="border-t py-4 text-sm text-muted-foreground">
        <Link to="/legal" className="hover:underline">
          Informations légales
        </Link>
      </footer>
    </main>
  );
}
