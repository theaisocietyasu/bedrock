import { Link2 } from 'lucide-react';
import { useModuleOn } from '../components/module-gate';
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, PageSkeleton, Row, Stat, StatGrid } from '../components/ui';
import { compact } from '../lib/format';
import { useCurrentOrg } from '../lib/org';
import { useOverview } from '../lib/queries';

// What the org's agents keep for members: conversations, memories and actions waiting for a member. Counts only.
export function AgentsPage() {
  const { prefix } = useCurrentOrg();
  const { data, isLoading, error } = useOverview(prefix);
  const accounts = useModuleOn('accounts');
  if (isLoading) return <PageSkeleton stats />;
  if (error || !data) return <ErrorNote error={error ?? 'No data'} />;
  const a = data.sections.agents;
  const linked = Object.entries(data.sections.accounts.linked);
  return (
    <>
      <PageHeader title="Agents" description="Conversations and memories that agents keep for members. Counts only." docs="modules/agents" />
      <StatGrid>
        <Stat label="Conversations this week" value={compact(a.active_7_days)} sub={`${compact(a.conversations)} kept`} />
        <Stat label="Members this week" value={compact(a.members_7_days)} />
        <Stat label="Memories" value={compact(a.memories)} />
        <Stat label="Waiting for confirmation" value={a.pending_actions} />
      </StatGrid>
      {accounts.on ? (
        <Card className="mt-6">
          <CardHeader title="Linked accounts" hint={`${linked.length} ${linked.length === 1 ? 'provider' : 'providers'}`} />
          {linked.length ? (
            linked.map(([provider, count]) => (
              <Row key={provider}>
                <span className="flex-1 text-sm capitalize">{provider}</span>
                <span className="text-sm font-medium tabular-nums">{count}</span>
              </Row>
            ))
          ) : (
            <EmptyState icon={Link2}>No linked accounts.</EmptyState>
          )}
        </Card>
      ) : null}
    </>
  );
}
