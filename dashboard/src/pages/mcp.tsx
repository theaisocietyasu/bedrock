import type { ReactNode } from 'react';
import { Bot } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardHeader, Code, EmptyState, ErrorNote, PageHeader, PageSkeleton, Table, Td, Th, Tr } from '../components/ui';
import { timeAgo } from '../lib/format';
import { useCurrentOrg } from '../lib/org';
import { useOverview } from '../lib/queries';

// How an agent connects: the MCP path and the token header.
function ConnectCard({ prefix }: { prefix: string }) {
  const rows: [string, ReactNode][] = [
    ['Server', <Code key="s">/mcp on port 8001</Code>],
    ['Header', <Code key="h">Authorization: Bearer plat_...</Code>],
    [
      'Token',
      <Link key="t" to={`/${prefix}/tokens`} className="underline underline-offset-2 hover:text-fg">
        Create on Tokens
      </Link>,
    ],
  ];
  return (
    <Card>
      <CardHeader title="Connect" />
      <dl className="divide-y divide-line text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3 px-4 py-2.5">
            <dt className="w-16 shrink-0 text-xs text-muted">{label}</dt>
            <dd className="min-w-0 truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// The MCP server: how agents connect, and the tokens they use. An agent sees only the tools its scopes and modules allow.
export function McpPage() {
  const { prefix } = useCurrentOrg();
  const { data, isLoading, error } = useOverview(prefix);
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorNote error={error ?? 'No data'} />;
  const agents = data.sections.tokens.tokens.filter((t) => t.kind === 'agent');
  return (
    <>
      <PageHeader title="MCP" description="The server that gives agents the tools of your modules." docs="architecture" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Agent tokens" hint={`${agents.length} ${agents.length === 1 ? 'token' : 'tokens'}`} />
          {agents.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th className="hidden sm:table-cell">Scopes</Th>
                  <Th className="text-right">Last used</Th>
                </tr>
              </thead>
              <tbody>
                {agents.map((t) => (
                  <Tr key={t.name}>
                    <Td className="font-medium whitespace-nowrap">{t.name}</Td>
                    <Td className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {t.scopes.map((scope) => (
                          <Code key={scope}>{scope}</Code>
                        ))}
                      </div>
                    </Td>
                    <Td className="text-right text-xs whitespace-nowrap text-muted tabular-nums">{timeAgo(t.last_used_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={Bot}>No agent tokens.</EmptyState>
          )}
        </Card>
        <ConnectCard prefix={prefix} />
      </div>
    </>
  );
}
