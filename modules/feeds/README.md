# feeds

Runs the feeds of the webhook modules: each feed reads one source on a schedule and posts only new items to a Discord webhook. A feed has a kind, and each kind belongs to a module: `github_jobs` to [job_webhook](../job_webhook/README.md) and `hackathons` to [hackathon_webhook](../hackathon_webhook/README.md). A feed whose module is off is hidden and does not run. Other org events go through `core/webhooks.py`.

## Files

| File | Holds |
| --- | --- |
| `api.py` | Officer routes to create, list, update, delete and run feeds |
| `tools.py` | The `feeds.*` tools for agents |
| `service.py` | Feeds, runs, duplicate checks and Discord webhook posts |
| `types.py` | `Item`, `SourceError` and the fetch signature of a source |
| `models.py` | Feeds, the items each feed posted, and its runs |
| `jobs.py` | The scheduled run and the run on request |

## Surface

- Routes: `/api/feeds/<org>/feeds` and `/api/feeds/<org>/presets`. Officers of the org only. `GET /feeds/<key>/history` returns the runs and items of a feed. `GET /presets` returns the feeds that sub-modules offer, for the webhook modules that are on.
- Jobs: `feeds.run_due`, schedule `*/15 * * * *`; `feeds.run_feed`, started by the run route.
- Tools: `feeds.list`, `feeds.presets`, `feeds.history`, `feeds.save`, `feeds.run`, `feeds.delete` (confirm), all with scope `feeds:manage`. Tools marked confirm run only with `confirm=true`.
- Tables: `alert_feeds`, `alert_posts`, `alert_runs`. Secrets: `alert_webhook_<feed key>`.

See [docs/modules/feeds.md](../../docs/modules/feeds.md).
