# job_webhook

Posts new internship and new grad roles to a Discord channel. The source is the job table in the README of a GitHub repository, such as the lists that SimplifyJobs and vanshb03 keep. The [feeds](../feeds/README.md) module runs the feeds of kind `github_jobs`.

## Files

| File | Holds |
| --- | --- |
| `source.py` | Reads the job table: config checks and the fetch |

## Surface

- Sub-modules: the `github_jobs` feeds of `submodules/careers` (software internships, new grad roles).
- Routes, jobs, tools and tables: those of [feeds](../feeds/README.md), for feeds of kind `github_jobs`.

See [docs/modules/feeds.md](../../docs/modules/feeds.md).
