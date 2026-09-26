import { createFileRoute } from "@tanstack/react-router";
import { RELEASE_NOTES } from "@/lib/version";

export const Route = createFileRoute("/nouveautes")({ component: NouveautesPage });

function NouveautesPage() {
  const releases = [...RELEASE_NOTES].sort((first, second) => second.date.localeCompare(first.date));

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Historique des versions</p>
        <h1 className="mt-2 text-3xl font-bold">✨ Nouveautés</h1>
      </div>
      {releases.map((release) => (
        <article key={release.version} className="card-3d rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {release.emoji}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Version {release.version}
                </p>
                <h2 className="mt-1 text-xl font-bold">{release.title}</h2>
              </div>
            </div>
            <time dateTime={release.date} className="text-sm text-muted-foreground">
              {new Date(`${release.date}T00:00:00`).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          <ul className="mt-5 space-y-3">
            {release.highlights.map((highlight, index) => (
              <li key={`${release.version}-${index}`} className="text-sm text-muted-foreground">
                {highlight}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
