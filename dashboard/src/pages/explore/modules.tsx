import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ArrowUpRight, Plus, RefreshCw, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, Button, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui';
import { api, send } from '../../lib/api';
import { matches } from '../../lib/modules';
import type { FeedPreset, CatalogModule } from '../../lib/types';

// The dashboard page of each module that has one.
const MODULE_PAGES: Record<string, string> = {
  points: 'points',
  storefront: 'store',
  calendar: 'calendar',
  leetcode: 'leetcode',
  godfather: 'godfather',
  runpod: 'hosting',
  job_webhook: 'job-alerts',
  hackathon_webhook: 'hackathons',
  knowledge: 'knowledge',
  agents: 'agents',
  uptime: 'uptime',
};

// The webhook modules, whose sub-modules are feeds
const FEED_MODULES = { job_webhook: true, hackathon_webhook: true };

type KnowledgeSubmodule = { name: string; title: string; description: string; pages: number; queries: string[]; sources: number };

// One sub-module row inside a module card: a sub-module or a feed the module can add.
function SubRow({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-2 border-t border-line px-4 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {meta ? <span className="shrink-0 text-xs text-muted tabular-nums">{meta}</span> : null}
      {action}
    </div>
  );
}

const subButton = 'h-7 px-2 text-xs';

// The sub-modules of the knowledge module. Add or sync crawls the sub-module's pages into knowledge.
function KnowledgeSubmodules({ prefix, onSynced }: { prefix: string; onSynced: (message: string) => void }) {
  const client = useQueryClient();
  const submodules = useQuery({
    queryKey: ['knowledge', prefix, 'submodules'],
    queryFn: () => api<{ submodules: KnowledgeSubmodule[] }>(`/api/dashboard/${prefix}/knowledge/submodules`),
  });
  const sync = useMutation({
    mutationFn: (submodule: KnowledgeSubmodule) =>
      send<{ added: number; updated: number; retired: number }>(`/api/dashboard/${prefix}/knowledge/submodules/${submodule.name}/sync`, 'POST'),
    onSuccess: (r, submodule) => {
      client.invalidateQueries({ queryKey: ['knowledge', prefix] });
      onSynced(`${submodule.title}: ${r.added} added, ${r.updated} updated, ${r.retired} retired.`);
    },
  });
  const list = (submodules.data?.submodules ?? []).filter((p) => p.pages || p.queries.length);
  return (
    <>
      {list.map((submodule) => (
        <SubRow
          key={submodule.name}
          title={submodule.title}
          meta={submodule.sources ? `${submodule.sources} sources` : `${submodule.pages} pages`}
          action={
            <Button variant={submodule.sources ? 'ghost' : 'secondary'} className={subButton} disabled={sync.isPending} onClick={() => sync.mutate(submodule)}>
              {sync.isPending && sync.variables?.name === submodule.name ? (
                <Spinner className="size-3.5" />
              ) : submodule.sources ? (
                <RefreshCw className="size-3.5" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {submodule.sources ? 'Sync' : 'Add'}
            </Button>
          }
        />
      ))}
      {sync.error ? (
        <div className="px-4 pb-3">
          <ErrorNote error={sync.error} />
        </div>
      ) : null}
    </>
  );
}

// The feeds a webhook module offers. Add opens the new feed form on the module's page, which asks for the webhook.
function ModuleFeeds({ module, prefix }: { module: string; prefix: string }) {
  const presets = useQuery({
    queryKey: ['feeds', prefix, 'presets'],
    queryFn: () => api<{ presets: FeedPreset[] }>(`/api/feeds/${prefix}/presets`),
  });
  return (
    <>
      {(presets.data?.presets ?? [])
        .filter((p) => p.module === module)
        .map((p) => (
        <SubRow
          key={`${p.submodule}/${p.key}`}
          title={p.title}
          meta={`every ${p.every_hours}h`}
          action={
            p.added ? (
              <Badge tone="ok">Added</Badge>
            ) : (
              <Link
                to={`/${prefix}/${MODULE_PAGES[module]}?new=${encodeURIComponent(`${p.submodule}/${p.key}`)}`}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-panel px-2 text-xs font-medium shadow-xs hover:bg-panel-2"
              >
                <Plus className="size-3.5" /> Add
              </Link>
            )
          }
        />
      ))}
    </>
  );
}

// The sub-modules of a module that is on. A module that is off lists its sub-modules by title.
function SubModules({ m, prefix, onSynced }: { m: CatalogModule; prefix: string; onSynced: (message: string) => void }) {
  if (m.enabled && m.name === 'knowledge') return <KnowledgeSubmodules prefix={prefix} onSynced={onSynced} />;
  if (m.enabled && m.name in FEED_MODULES) return <ModuleFeeds module={m.name} prefix={prefix} />;
  if (m.enabled || !m.submodules.length) return null;
  return (
    <>
      {m.submodules.map((p) => (
        <SubRow key={p.name} title={p.title} meta="Add the module first" />
      ))}
    </>
  );
}

// One module: title, one line of what it does, what it still needs, its sub-modules and one action.
export function ModuleCard({
  m,
  prefix,
  busy,
  onAdd,
  onRemove,
  onSynced,
}: {
  m: CatalogModule;
  prefix: string;
  busy: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onSynced: (message: string) => void;
}) {
  const page = MODULE_PAGES[m.name];
  const missing = m.needs.filter((n) => !n.connected && !n.optional);
  return (
    <Card className="flex flex-col" data-module={m.name}>
      <div className="flex min-h-32 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">{m.title}</h3>
          {m.enabled && page ? (
            <Link to={`/${prefix}/${page}`} aria-label={`Open ${m.title}`} className="text-muted transition-colors hover:text-fg">
              <ArrowUpRight className="size-4" />
            </Link>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-pretty text-muted">{m.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {missing.length ? (
            <Link to={`/${prefix}/explore?tab=integrations`} className="truncate text-xs text-warn hover:underline">
              Needs {missing.map((n) => n.label).join(', ')}
            </Link>
          ) : (
            <span />
          )}
          {!m.switchable ? (
            <span className="shrink-0 text-xs text-muted">Included</span>
          ) : m.enabled ? (
            <Button variant="ghost" className={`${subButton} shrink-0`} disabled={busy} onClick={onRemove}>
              Remove
            </Button>
          ) : (
            <Button className={`${subButton} shrink-0`} disabled={busy || !m.ready} onClick={onAdd}>
              <Plus className="size-3.5" /> Add
            </Button>
          )}
        </div>
      </div>
      <SubModules m={m} prefix={prefix} onSynced={onSynced} />
    </Card>
  );
}

// The modules in category sections, filtered by the search text.
export function ModuleGrid({
  categories,
  modules,
  query,
  render,
}: {
  categories: string[];
  modules: CatalogModule[];
  query: string;
  render: (m: CatalogModule) => ReactNode;
}) {
  const shown = modules.filter((m) => matches(m, query));
  if (!shown.length) {
    return (
      <Card>
        <EmptyState icon={SearchX} title="No module matches" />
      </Card>
    );
  }
  return (
    <div className="space-y-8">
      {categories
        .map((c) => ({ c, items: shown.filter((m) => m.category === c) }))
        .filter((g) => g.items.length)
        .map(({ c, items }) => (
          <section key={c} aria-label={c}>
            <h2 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{c}</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(render)}</div>
          </section>
        ))}
    </div>
  );
}
