import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Laptop,
  Package,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import profileLogo from "@/assets/images/leprofile.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-green-50">
      <header className="fixed top-0 z-50 w-full border-b border-orange-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={profileLogo} alt="GogoSoft" className="size-10 rounded-full" />
            <span className="text-lg font-bold text-slate-900">GogoSoft</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-ivoirien bg-ivoirien-hover shadow-3d">Créer un compte</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
            🇨🇮 Solution ivoirienne
          </div>
          <h1 className="mb-6 text-5xl font-bold text-slate-900 md:text-6xl">
            Gérez votre atelier
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
              comme un pro.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600">
            Réparations, ventes, consommables, clients, vitrine en ligne. Une seule application pour
            tout gérer.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/demo">
              <Button
                size="lg"
                className="h-14 bg-ivoirien bg-ivoirien-hover px-8 text-lg shadow-3d"
              >
                🎮 Tester la démo gratuitement
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                Créer mon compte
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">1 jour d&apos;essai gratuit · Sans engagement</p>
        </div>
      </section>

      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Choisissez uniquement ce que vous utilisez</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <ModuleCard
              icon={Smartphone}
              title="Réparation Téléphone"
              description="Fiches, diagnostics, WhatsApp auto"
              color="orange"
            />
            <ModuleCard
              icon={Laptop}
              title="Réparation PC"
              description="Maintenance, pièces, suivi"
              color="orange"
            />
            <ModuleCard
              icon={ShoppingCart}
              title="Ventes"
              description="Téléphones, PC, accessoires"
              color="green"
            />
            <ModuleCard
              icon={Package}
              title="Consommables"
              description="Stock, alertes, réappro"
              color="green"
            />
            <ModuleCard
              icon={Wrench}
              title="Vitrine en ligne"
              description="Boutique publique 24h/24"
              color="orange"
            />
            <ModuleCard
              icon={Sparkles}
              title="Multi-ateliers"
              description="Gérez plusieurs boutiques"
              color="green"
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-orange-50 to-green-50 py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Tarifs simples et transparents</h2>
          <p className="mb-12 text-center text-slate-600">À partir de 6 000 FCFA/mois</p>
          <div className="grid gap-6 md:grid-cols-3">
            <PriceCard
              title="Application"
              price="6 000"
              subtitle="1 module / mois"
              features={["1 module au choix", "Support WhatsApp", "Multi-appareils"]}
            />
            <PriceCard
              title="Pro"
              price="10 000"
              subtitle="2 modules / mois"
              featured
              features={["2 modules au choix", "Support prioritaire", "Multi-appareils"]}
            />
            <PriceCard
              title="Vitrine"
              price="20 000"
              subtitle="1 côté / mois"
              features={["Boutique publique", "Commandes en ligne", "Paiement Wave/OM"]}
            />
          </div>
          <p className="mt-8 text-center text-slate-500">+ Nom de domaine .com : 10 000 FCFA/an</p>
        </div>
      </section>

      <section className="bg-slate-900 py-20 px-6 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold">Prêt à tester ?</h2>
          <p className="mb-10 text-xl text-slate-300">Démarrez votre essai gratuit en 30 secondes.</p>
          <Link to="/demo">
            <Button size="lg" className="h-14 bg-ivoirien bg-ivoirien-hover px-10 text-lg shadow-3d">
              🎮 Tester maintenant
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 py-10 px-6 text-center text-sm text-slate-400">
        <p>© 2026 GogoSoft · Développé par Thierry GOGO & Co · Abidjan, Côte d&apos;Ivoire</p>
      </footer>
    </main>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "orange" | "green";
}) {
  return (
    <div className="card-3d p-6 transition-all hover:shadow-3d-hover">
      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-xl ${
          color === "orange" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
        }`}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  subtitle,
  features,
  featured,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div className={`card-3d p-6 ${featured ? "scale-105 ring-2 ring-orange-500" : ""}`}>
      {featured ? <div className="mb-2 text-xs font-bold text-orange-600">RECOMMANDÉ</div> : null}
      <h3 className="mb-1 text-xl font-bold">{title}</h3>
      <p className="mb-4 text-sm text-slate-500">{subtitle}</p>
      <div className="mb-6 text-3xl font-bold">
        {price} <span className="text-sm text-slate-500">FCFA</span>
      </div>
      <ul className="mb-6 space-y-2">
        {features.map((feature, index) => (
          <li key={`${title}-${index}`} className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-green-600" /> {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
