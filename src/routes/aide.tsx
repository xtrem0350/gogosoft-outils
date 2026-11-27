import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CreditCard,
  Mail,
  Package,
  Phone,
  Store,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/aide")({ component: AidePage });

type HelpItem = {
  title: string;
  description: string;
  to?: string;
  action?: string;
};

type HelpSection = {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: HelpItem[];
};

const helpSections: HelpSection[] = [
  {
    id: "premiers-pas",
    title: "Premiers pas",
    description:
      "Créez votre compte, ouvrez votre atelier et préparez l’espace de travail avant d’inviter votre équipe.",
    icon: Building2,
    items: [
      {
        title: "Créer un compte",
        description: "Inscrivez-vous ou connectez-vous avec votre adresse e-mail.",
        to: "/auth",
        action: "Accéder à l’authentification",
      },
      {
        title: "Configurer un atelier",
        description: "Ajoutez le nom et les coordonnées de votre boutique ou atelier.",
        to: "/boutiques/nouveau",
        action: "Créer un atelier",
      },
      {
        title: "Préparer votre espace",
        description: "Choisissez les domaines utiles, puis ajoutez vos clients et membres d’équipe.",
        to: "/equipe",
        action: "Gérer l’équipe",
      },
    ],
  },
  {
    id: "atelier",
    title: "Gestion de l’atelier",
    description:
      "Les espaces Téléphone et Ordinateur séparent les fiches par activité et gardent les diagnostics et interventions au même endroit.",
    icon: Wrench,
    items: [
      {
        title: "Fiches téléphone",
        description: "Enregistrez le client, l’appareil, la panne constatée et l’emplacement de rangement.",
        to: "/phone/atelier",
        action: "Ouvrir l’atelier téléphone",
      },
      {
        title: "Fiches PC",
        description: "Suivez les ordinateurs, leurs caractéristiques, diagnostics, pièces et interventions.",
        to: "/computer/atelier",
        action: "Ouvrir l’atelier PC",
      },
      {
        title: "Statuts et carnet",
        description:
          "Faites progresser chaque fiche selon son état de traitement et consignez les notes utiles dans le carnet d’expérience.",
        to: "/phone/carnet",
        action: "Ouvrir le carnet téléphone",
      },
    ],
  },
  {
    id: "caisse-ventes",
    title: "Caisse et ventes",
    description:
      "Suivez les encaissements dans la caisse et distinguez les paiements des réparations de ceux des ventes.",
    icon: Wallet,
    items: [
      {
        title: "Sessions de caisse",
        description: "Ouvrez une session, enregistrez les entrées et sorties, puis consultez le récapitulatif.",
        to: "/caisse",
        action: "Ouvrir la caisse",
      },
      {
        title: "Ventes et commandes",
        description: "Créez une vente, suivez son paiement et consultez les commandes ou livraisons.",
        to: "/sales",
        action: "Accéder aux ventes",
      },
      {
        title: "Paiements mobiles",
        description:
          "Enregistrez le moyen réellement reçu (Wave, Orange Money, MTN ou Moov) et sa référence lorsque nécessaire.",
      },
    ],
  },
  {
    id: "stock-magasin",
    title: "Stock et magasin",
    description:
      "Gérez les articles et consommables, surveillez les seuils de stock et préparez les réceptions.",
    icon: Package,
    items: [
      {
        title: "Consommables",
        description: "Suivez les pièces, batteries, écrans et accessoires utilisés dans les réparations.",
        to: "/consumable/stock",
        action: "Gérer les consommables",
      },
      {
        title: "Magasin",
        description: "Consultez les quantités, mouvements, alertes et approvisionnements.",
        to: "/magasin",
        action: "Ouvrir le magasin",
      },
      {
        title: "Réception des appareils",
        description: "Enregistrez l’arrivée d’un appareil et son rangement avant le diagnostic.",
        to: "/reception",
        action: "Créer une réception",
      },
    ],
  },
  {
    id: "boutique-en-ligne",
    title: "Boutique en ligne",
    description:
      "Configurez la vitrine publique, publiez vos produits et suivez les commandes reçues.",
    icon: Store,
    items: [
      {
        title: "Configurer la vitrine",
        description: "Renseignez les informations publiques et les options de commande de la boutique.",
        to: "/admin/boutique",
        action: "Configurer la boutique",
      },
      {
        title: "Produits et commandes",
        description: "Gérez le catalogue visible en ligne, puis traitez les commandes et leur livraison.",
        to: "/admin/boutique/commandes",
        action: "Voir les commandes",
      },
      {
        title: "Lien public",
        description:
          "Partagez l’adresse publique de votre vitrine avec vos clients. Les commandes apparaissent dans votre espace de gestion.",
      },
    ],
  },
  {
    id: "roles",
    title: "Rôles et permissions",
    description:
      "Les menus et actions disponibles dépendent du rôle attribué et des domaines activés pour l’atelier.",
    icon: Users,
    items: [
      {
        title: "Owner / propriétaire",
        description: "Gère l’atelier, les paramètres, l’équipe, les modules et l’abonnement.",
        to: "/equipe",
        action: "Gérer l’équipe",
      },
      {
        title: "Technicien et réceptionniste",
        description: "Le technicien suit les interventions ; le réceptionniste accueille les clients et enregistre les appareils.",
      },
      {
        title: "Caissier, magasinier et vendeur",
        description: "Le caissier suit les encaissements, le magasinier gère le stock et le vendeur traite les ventes.",
      },
      {
        title: "SuperAdmin",
        description: "Accède à la gestion de la plateforme, des abonnés, des paiements et des domaines.",
        to: "/admin",
        action: "Ouvrir l’espace admin",
      },
    ],
  },
  {
    id: "abonnement-facturation",
    title: "Abonnement et facturation",
    description:
      "Consultez votre forfait, sa période de validité et les options disponibles pour votre espace.",
    icon: CreditCard,
    items: [
      {
        title: "Gérer l’abonnement",
        description: "Consultez votre offre et les options de renouvellement depuis votre espace.",
        to: "/abonnement",
        action: "Voir mon abonnement",
      },
      {
        title: "Factures et paiements",
        description:
          "Suivez l’état d’une facture et conservez la référence de transaction pour tout paiement mobile.",
      },
      {
        title: "Utilisation sur mobile",
        description:
          "GogoSoft s’adapte aux écrans de téléphone et de tablette ; les menus et actions suivent le rôle actif.",
      },
    ],
  },
];

function AidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleSections = useMemo(
    () =>
      normalizedQuery
        ? helpSections.filter((section) =>
            `${section.title} ${section.description} ${section.items
              .map((item) => `${item.title} ${item.description}`)
              .join(" ")}`
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : helpSections,
    [normalizedQuery],
  );

  const supportMessage = encodeURIComponent("Bonjour, j’ai besoin d’aide avec GogoSoft.");

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <PageHero
        title="Centre d’aide"
        subtitle="Guides pratiques pour configurer et utiliser GogoSoft au quotidien."
        icon={BookOpen}
        iconColor="orange"
        imageSrc={new URL("../assets/images/hero-centre-aide.jpg", import.meta.url).href}
        breadcrumb={[{ label: "Accueil", to: "/dashboard" }, { label: "Aide" }]}
      />

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <label className="relative block">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher dans les guides…"
            aria-label="Rechercher dans les guides d’aide"
            className="h-12 rounded-xl"
          />
        </label>
      </div>

      {visibleSections.length ? (
        <Card>
          <Accordion type="single" collapsible className="w-full">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              return (
                <AccordionItem key={section.id} value={section.id} className="px-5 last:border-0">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                        <Icon className="size-5" />
                      </span>
                      <span>
                        <span className="block font-semibold">{section.title}</span>
                        <span className="mt-1 block text-sm font-normal text-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 pb-3 md:grid-cols-2">
                      {section.items.map((item) => (
                        <Card key={item.title} className="h-full border-dashed">
                          <CardContent className="flex h-full flex-col items-start gap-3 p-4">
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            {item.to ? (
                              <Button asChild variant="outline" size="sm" className="mt-auto">
                                <Link to={item.to}>{item.action ?? "Ouvrir"}</Link>
                              </Button>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      ) : (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Aucun guide ne correspond à « {searchQuery} ».
        </p>
      )}

      <section id="support" className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold">Contacter le support</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Décrivez votre besoin et, si possible, indiquez le nom de votre atelier et l’écran concerné.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <a
              href={`https://wa.me/2250758966156?text=${supportMessage}`}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="mr-2 size-4" />
              WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:2024dibo@gmail.com?subject=Support%20GogoSoft">
              <Mail className="mr-2 size-4" />
              Envoyer un e-mail
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t pt-6 text-sm text-muted-foreground">
        <p>Version de l’application : v{APP_VERSION}</p>
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
