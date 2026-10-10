import Image from 'next/image';
import { repoUrl } from '@/lib/shared';

type Contributor = { login: string; avatar_url: string; html_url: string; type: string };

const API = repoUrl.replace('https://github.com/', 'https://api.github.com/repos/') + '/contributors?per_page=100';
// Accounts of agents that GitHub lists as users
const SKIP = new Set(['claude']);
const SIZE = 28;

/** The people who committed to the repo, refreshed once a day. Empty when GitHub does not answer. */
async function contributors(): Promise<Contributor[]> {
  try {
    const response = await fetch(API, { next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const list = (await response.json()) as Contributor[];
    return list.filter((c) => c.type === 'User' && !SKIP.has(c.login.toLowerCase()));
  } catch {
    return [];
  }
}

/** The avatar of each contributor as overlapping circles, each a link to their GitHub profile. */
export async function Contributors({ className }: { className?: string }) {
  const people = await contributors();
  if (!people.length) return null;
  return (
    <div className={className}>
      <ul aria-label="Contributors" className="flex flex-wrap items-center">
        {people.map((person, i) => (
          <li key={person.login} className="relative hover:z-10 focus-within:z-10" style={{ marginLeft: i ? -SIZE / 3 : 0 }}>
            <a
              href={person.html_url}
              aria-label={person.login}
              title={person.login}
              className="block rounded-full ring-2 ring-fd-background transition-transform duration-150 ease-out outline-none hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-fd-ring"
            >
              <Image
                src={`${person.avatar_url}&s=${SIZE * 2}`}
                alt=""
                width={SIZE}
                height={SIZE}
                className="rounded-full border border-black/10 dark:border-white/15"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
