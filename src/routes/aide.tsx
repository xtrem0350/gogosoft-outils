import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  HelpCircle,
  Laptop,
  Package,
  Palette,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { APP_VERSION } from "@/lib/version";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/aide")({
  component: AidePage,
});

type HelpStep = {
  title: string;
  description: string;
  to: string;
  icon: typeof Sparkles;
};

type HelpSection = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  icon: typeof BookOpen;
  items: HelpStep[];
};

const quickStartSteps: HelpStep[] = [
  {
    title: "Créer votre compte",
    description: "En 2 minutes, ouvrez votre compte à partir de /auth.",
    to: "/auth",
    icon: UserCheck,
  },
  {
    title: "Créer votre premier atelier",
    description: "Ajoutez votre boutique ou votre atelier de réparation.",
    to: "/boutiques/nouveau",
    icon: Building2,
  },
  {
    title: "Ajouter votre premier client",
    description: "Renseignez le nom, le WhatsApp et l'historique de client.",
    to: "/clients/nouveau",
    icon: Users,
  },
  {
    title: "Créer votre première fiche",
    description: "Démarrez une réparation téléphone ou ordinateur.",
    to: "/phone/atelier/nouveau",
    icon: Smartphone,
  },
  {
    title: "Configurer votre forfait",
    description: "Choisissez votre plan et activez votre accès complet.",
    to: "/abonnement",
    icon: CreditCard,
  },
];

const helpSections: HelpSection[] = [
  {
    id: "demarrage",
    title: "Démarrage rapide",
    subtitle: "Tout commence en quelques minutes",
    description: "Apprenez le chemin le plus simple pour lancer votre atelier GogoSoft.",
    accent: "bg-orange-100 text-orange-700",
    icon: Sparkles,
    items: quickStartSteps,
  },
  {
    id: "interface",
    title: "Comprendre l'interface",
    subtitle: "Naviguer en mode pro",
    description:
      "Le header, le sidebar, le UserMenu et le dashboard sont pensés pour gagner du temps.",
    accent: "bg-blue-100 text-blue-700",
    icon: Palette,
    items: [],
  },
  {
    id: "telephone",
    title: "Gérer les réparations (Téléphone)",
    subtitle: "Créer, suivre et livrer",
    description: "Gérez les fiches téléphone, assignations, diagnostics et livraisons.",
    accent: "bg-green-100 text-green-700",
    icon: Smartphone,
    items: [],
  },
  {
    id: "ordinateur",
    title: "Gérer les réparations (Ordinateur)",
    subtitle: "Spécificités PC et diagnostics",
    description: "Suivez les réparations PC avec modèles, pannes et spécifications techniques.",
    accent: "bg-violet-100 text-violet-700",
    icon: Laptop,
    items: [],
  },
  {
    id: "consommables",
    title: "Gérer les consommables",
    subtitle: "Stock, seuils et alertes",
    description: "Suivez les pièces, écrans, batteries et accessoires pour éviter les ruptures.",
    accent: "bg-emerald-100 text-emerald-700",
    icon: Package,
    items: [],
  },
  {
    id: "ventes",
    title: "Gérer les ventes",
    subtitle: "Commandes, livraisons et ventes",
    description: "Enregistrez des ventes, suivez les livraisons et gérez les paiements.",
    accent: "bg-amber-100 text-amber-700",
    icon: ShoppingCart,
    items: [],
  },
  {
    id: "clients",
    title: "Gérer les clients",
    subtitle: "Historique, recherche et contact",
    description: "Conservez l'historique client et communiquez rapidement par WhatsApp.",
    accent: "bg-pink-100 text-pink-700",
    icon: Users,
    items: [],
  },
  {
    id: "emplacements",
    title: "Gérer les emplacements",
    subtitle: "Organisation de l'atelier",
    description: "Attribuez des cartons, tiroirs ou étagères pour chaque réparation.",
    accent: "bg-cyan-100 text-cyan-700",
    icon: Store,
    items: [],
  },
  {
    id: "ateliers",
    title: "Gérer les ateliers",
    subtitle: "Multi-boutiques et multi-équipe",
    description: "Passez d'un atelier à l'autre et gérez les statistiques par site.",
    accent: "bg-indigo-100 text-indigo-700",
    icon: BriefcaseBusiness,
    items: [],
  },
  {
    id: "forfait",
    title: "Forfait et paiement",
    subtitle: "Abonnement, essai et plan d'accès",
    description: "Choisissez le bon plan, vérifiez les avantages et suivez vos paiements.",
    accent: "bg-rose-100 text-rose-700",
    icon: CreditCard,
    items: [],
  },
  {
    id: "securite",
    title: "Sécurité et confidentialité",
    subtitle: "Protection des données et accès",
    description: "Gérez l'accès, la déconnexion automatique et la confidentialité des données.",
    accent: "bg-slate-100 text-slate-700",
    icon: ShieldCheck,
    items: [],
  },
  {
    id: "faq",
    title: "FAQ",
    subtitle: "Questions fréquentes",
    description: "Les réponses les plus utiles pour les réparateurs et gestionnaires d'atelier.",
    accent: "bg-red-100 text-red-700",
    icon: CircleHelp,
    items: [],
  },
  {
    id: "support",
    title: "Contacter le support",
    subtitle: "Aide humaine",
    description: "Trouvez le bon canal pour obtenir de l'assistance rapide.",
    accent: "bg-teal-100 text-teal-700",
    icon: HelpCircle,
    items: [],
  },
];

const faqs = [
  {
    question: "L'app fonctionne-t-elle sans internet ?",
    answer:
      "Oui, elle reste consultable localement, mais la synchronisation et les données partagées nécessitent une connexion active.",
  },
  {
    question: "Puis-je avoir plusieurs ateliers ?",
    answer:
      "Oui, GogoSoft est conçu pour gérer plusieurs boutiques ou ateliers depuis un seul compte.",
  },
  {
    question: "Comment bloquer un utilisateur abusif ?",
    answer:
      "Contactez le support ou le gestionnaire de compte pour sécuriser l'accès et corriger les droits.",
  },
  {
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui, la plupart des exports et vérifications de données passent par les paramètres de votre compte.",
  },
  {
    question: "Comment ajouter un technicien à mon équipe ?",
    answer: "Dans /equipe, vous pouvez inviter un technicien et suivre ses interventions.",
  },
  {
    question: "Comment changer de forfait ?",
    answer:
      "Depuis /abonnement, choisissez votre plan et suivez la mise à jour pour activer votre accès.",
  },
  {
    question: "Que se passe-t-il si mon abonnement expire ?",
    answer:
      "Vos données restent stockées, mais l'accès à certaines fonctions peut être limité tant que le forfait est renouvelé.",
  },
  {
    question: "Puis-je utiliser GogoSoft sur mon téléphone ?",
    answer:
      "Oui, l'application est responsive et fonctionne bien sur smartphone, tablette et ordinateur.",
  },
  {
    question: "Comment contacter un client rapidement ?",
    answer:
      "Depuis la fiche client ou la fiche réparation, utilisez le bouton WhatsApp pour envoyer un message direct.",
  },
  {
    question: "Puis-je vendre des accessoires ?",
    answer: "Oui, le module Ventes permet de suivre les ventes d'accessoires, appareils et pièces.",
  },
  {
    question: "Comment ajouter une photo à un client ?",
    answer: "Lors de la création du client, vous pouvez ajouter une photo depuis le formulaire.",
  },
  {
    question: "Le diagnostic est-il obligatoire ?",
    answer:
      "Oui, il est fortement recommandé et souvent exigé pour bien documenter la panne constatée.",
  },
  {
    question: "Comment imprimer une facture ?",
    answer:
      "Depuis la fiche ou le module de vente, utilisez l'option PDF ou la génération de document disponible.",
  },
  {
    question: "Puis-je restaurer une fiche supprimée ?",
    answer:
      "Une confirmation est demandée avant la suppression, et la restauration directe n'est pas prévue pour éviter les erreurs.",
  },
  {
    question: "Comment changer mon nom affiché ?",
    answer:
      "Passez par /profil pour modifier votre nom complet et les informations publicitaires du compte.",
  },
] as const;

function AidePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedQuery) return helpSections;

    return helpSections.filter((section) => {
      const baseText = `${section.title} ${section.subtitle} ${section.description}`.toLowerCase();
      if (baseText.includes(normalizedQuery)) return true;
      if (section.items.length === 0) return false;
      return section.items.some((item) => {
        const itemText = `${item.title} ${item.description}`.toLowerCase();
        return itemText.includes(normalizedQuery);
      });
    });
  }, [normalizedQuery]);

  const visibleFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;
    return faqs.filter((item) => {
      const text = `${item.question} ${item.answer}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const hasAnyResult = visibleSections.length > 0 || visibleFaqs.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <PageHero
        title="📚 Centre d'aide"
        subtitle="Tout ce qu'il faut savoir pour utiliser GogoSoft"
        icon={BookOpen}
        iconColor="orange"
        breadcrumb={[{ label: "Accueil", to: "/dashboard" }, { label: "Aide" }]}
      />

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher une aide..."
            aria-label="Rechercher une aide"
            className="h-12 rounded-xl pl-11 text-base"
          />
        </label>
      </div>

      {!hasAnyResult ? (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Aucun résultat pour "{searchQuery}". Contactez le support pour obtenir une réponse
            rapide.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Sommaire
            </p>
            <nav className="space-y-2">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    {section.title}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="space-y-8">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${section.accent}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <Badge variant="secondary">{section.title}</Badge>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                  </div>
                </div>

                <Card>
                  <CardContent className="space-y-5 p-5 sm:p-6">
                    <p className="text-base text-muted-foreground">{section.description}</p>

                    {section.id === "demarrage" ? (
                      <div className="space-y-4">
                        <div className="rounded-xl border bg-gradient-to-r from-orange-50 to-green-50 p-4">
                          <h3 className="text-xl font-semibold">👋 Bienvenue sur GogoSoft</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            En 5 minutes, découvrez comment gérer votre atelier comme un pro.
                          </p>
                          <Button asChild className="mt-4">
                            <Link to="/auth">Démarrer l'essai gratuit</Link>
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {quickStartSteps.map((step, index) => {
                            const StepIcon = step.icon;
                            return (
                              <Link key={step.to} to={step.to} className="block">
                                <Card className="h-full transition-colors hover:border-orange-300">
                                  <CardContent className="flex h-full flex-col gap-3 p-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                        <StepIcon className="size-5" />
                                      </div>
                                      <Badge variant="outline">Étape {index + 1}</Badge>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold">{step.title}</h3>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        {step.description}
                                      </p>
                                    </div>
                                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-orange-700">
                                      Ouvrir <ArrowRight className="size-4" />
                                    </span>
                                  </CardContent>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {section.id === "interface" ? (
                      <div className="space-y-5">
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Card className="border-dashed">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Bell className="size-4 text-orange-500" /> Le Header
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                Le header affiche le logo, le nom de l’application, le titre actif
                                et la recherche globale.
                              </p>
                              <p>
                                Vous pouvez lancer une recherche rapide, vérifier les notifications,
                                créer un nouveau client ou un nouveau document et changer le thème.
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-dashed">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Wrench className="size-4 text-orange-500" /> Le Sidebar
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                Le sidebar regroupe les fonctions essentielles par famille :
                                accueil, téléphone, ordinateur, consommables, ventes, clients et
                                compte.
                              </p>
                              <p>
                                Chaque groupe aide à retrouver rapidement l’outil dont vous avez
                                besoin.
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <Card className="border-dashed">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="size-4 text-orange-500" /> Le UserMenu
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                À partir du menu avatar, accédez à votre profil, aux paramètres, à
                                l’aide, aux nouveautés et à la déconnexion.
                              </p>
                              <p>Le super admin voit aussi l’espace admin dédié.</p>
                            </CardContent>
                          </Card>

                          <Card className="border-dashed">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="size-4 text-orange-500" /> Le Dashboard
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                Le dashboard centralise votre activité, vos statistiques et les
                                alertes intelligentes sur les stocks et les réparations.
                              </p>
                              <p>Il sert de point de départ pour toute la journée de travail.</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : null}

                    {section.id === "telephone" ? (
                      <div className="space-y-4">
                        <ol className="grid gap-3">
                          {[
                            "Cliquer sur TÉLÉPHONE dans le Sidebar",
                            "Cliquer sur + Nouvelle fiche",
                            "Choisir le client ou créer un client si absent",
                            "Sélectionner l’appareil ou renseigner un modèle libre",
                            "Cocher les pannes constatées et choisir un emplacement",
                            "Ajouter le montant du diagnostic et enregistrer",
                          ].map((item, index) => (
                            <li key={item} className="flex gap-3 rounded-xl border p-3 text-sm">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700">
                                {index + 1}
                              </span>
                              <span className="text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ol>
                        <Alert className="border-orange-200 bg-orange-50">
                          <BadgeCheck className="size-4 text-orange-700" />
                          <AlertDescription>
                            Le suivi de réparation passe par la timeline, les événements de statut
                            et le bouton WhatsApp pour informer le client.
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : null}

                    {section.id === "ordinateur" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Pour les PC, utilisez le même workflow que les téléphones en adaptant les
                          modèles et pannes typiques :
                        </p>
                        <ul className="grid gap-2 pl-5 list-disc">
                          <li>Modèles populaires : HP, Dell, Lenovo, Asus, Acer et MacBook.</li>
                          <li>
                            Pannes fréquentes : écran, clavier, batterie, OS, RAM ou disque SSD.
                          </li>
                          <li>
                            Spécificités : processeur, mémoire RAM, version OS et composants de
                            remplacement.
                          </li>
                        </ul>
                      </div>
                    ) : null}

                    {section.id === "consommables" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Le module stock permet d’ajouter des pièces, batteries, écrans et câbles,
                          puis d’alerter à partir d’un seuil.
                        </p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {["Suivre les entrées", "Suivre les sorties", "Réapprovisionner"].map(
                            (label) => (
                              <div
                                key={label}
                                className="rounded-xl border p-3 text-center font-medium text-foreground"
                              >
                                {label}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}

                    {section.id === "ventes" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Pour créer une vente, ouvrez le module Ventes, choisissez le type de
                          produit, définissez le prix, ajoutez une photo et validez avec le bon mode
                          de paiement.
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Card className="border-dashed">
                            <CardContent className="p-4">
                              <p className="font-semibold text-foreground">Nouvelle vente</p>
                              <p className="mt-1">
                                Produit, quantité, prix, paiement et validation.
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-dashed">
                            <CardContent className="p-4">
                              <p className="font-semibold text-foreground">Suivi des commandes</p>
                              <p className="mt-1">
                                Commandes à préparer, livraisons prêtes et ventes livrées.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : null}

                    {section.id === "clients" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Un client bien géré définit la qualité de la relation. Gardez son
                          identité, son WhatsApp, son historique d’achats et de réparations.
                        </p>
                        <ul className="grid gap-2 pl-5 list-disc">
                          <li>Ajouter un client depuis la liste ou le formulaire dédié.</li>
                          <li>Recherche rapide par nom, WhatsApp ou historique.</li>
                          <li>Contact direct par WhatsApp en 1 clic.</li>
                        </ul>
                      </div>
                    ) : null}

                    {section.id === "emplacements" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Les emplacements permettent de suivre le stockage physique d’un atelier.
                          Pour chaque réparation, choisissez un carton ou un tiroir dédié.
                        </p>
                        <ul className="grid gap-2 pl-5 list-disc">
                          <li>Créer des emplacements : C1, Tiroir-A, Carton-1.</li>
                          <li>Définir le type : carton, étagère, tiroir, sac, autre.</li>
                          <li>Libérer automatiquement le lieu à la livraison.</li>
                        </ul>
                      </div>
                    ) : null}

                    {section.id === "ateliers" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Le sélectionneur d’atelier en haut de votre interface permet de passer
                          d’un site à un autre et d’adapter les statistiques et les opérations.
                        </p>
                        <div className="rounded-xl border p-4">
                          <p className="font-medium text-foreground">Bonnes pratiques</p>
                          <p className="mt-2">
                            Gardez un atelier par localité, attribuez les techniciens et comparez
                            les performances pour mieux piloter votre entreprise.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {section.id === "forfait" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Le forfait current est visible dans le header, et le système propose un
                          essai gratuit pour tester GogoSoft avant de choisir votre plan.
                        </p>
                        <ul className="grid gap-2 pl-5 list-disc">
                          <li>Essai gratuit : 7 jours.</li>
                          <li>Mensuel : 5 000 FCFA.</li>
                          <li>Annuel : 50 000 FCFA.</li>
                          <li>Paiement possible en Wave, Orange Money, MTN ou Moov.</li>
                        </ul>
                      </div>
                    ) : null}

                    {section.id === "securite" ? (
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Les données de chaque atelier sont séparées. La déconnexion automatique
                          sécurise les sessions inactives.
                        </p>
                        <ul className="grid gap-2 pl-5 list-disc">
                          <li>Protection par atelier via les règles de sécurité de la base.</li>
                          <li>Déconnexion automatique après 30 minutes d’inactivité.</li>
                          <li>
                            Mot de passe et réinitialisation rapides depuis /parametres et /auth.
                          </li>
                        </ul>
                      </div>
                    ) : null}

                    {section.id === "faq" ? (
                      <Accordion type="single" collapsible className="w-full">
                        {visibleFaqs.map((item, index) => (
                          <AccordionItem key={`${item.question}-${index}`} value={`faq-${index}`}>
                            <AccordionTrigger className="text-left font-medium">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : null}

                    {section.id === "support" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-dashed">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Phone className="size-4 text-emerald-600" /> Contact direct
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>WhatsApp : +225 XX XX XX XX</p>
                            <p>Email : support@gogosoft.ci</p>
                            <p>Horaires : Lundi au samedi, 8h - 18h</p>
                            <a
                              href="https://wa.me/225XXXXXXXXX"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 font-medium text-emerald-700"
                            >
                              Ouvrir WhatsApp <ChevronRight className="size-4" />
                            </a>
                          </CardContent>
                        </Card>
                        <Card className="border-dashed">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <AlertCircle className="size-4 text-orange-500" /> Avant de contacter
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              Vérifiez votre connexion, votre atelier actif et votre abonnement.
                            </p>
                            <p>
                              Préparez le nom du module, l’URL de la page et un message détaillé
                              pour une réponse rapide.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </main>
      </div>

      <footer className="border-t pt-6 text-sm text-muted-foreground">
        <p>Version de l'application : v{APP_VERSION}</p>
        <p className="mt-2">
          Pour voir toutes les nouveautés :{" "}
          <Link to="/nouveautes" className="text-orange-700 hover:underline">
            Nouveautés
          </Link>
        </p>
      </footer>
    </div>
  );
}
