# integrations

Gives agents the tools of the services an org connects on the Integrations page, through the same token and MCP server as the Platform tools. Platform passes a call to the service's own MCP server when that server takes an API key (GitHub, RunPod). Else it calls the service's API itself (Google, Notion, web search). The agent never gets the keys.

## Files

| File | Holds |
| --- | --- |
| `servers.py` | The MCP server of each service: URL, sign-in with the org's keys, scopes, and the repo a call acts on; declares the `github:*` and `runpod:*` scopes and the GitHub token limits |
| `service.py` | The pass-through tools a token may see and the call to the remote server: scope, confirm, tool name and repo limits |
| `mcp_client.py` | A small MCP client over streamable HTTP |
| `google.py` | Calendar, Drive, Sheets and Gmail tools with the org's service account; declares `google:*` and `gmail:*` |
| `notion.py` | Notion search, read, query and create tools with the org's integration token; declares `notion:*` |
| `web.py` | The web search tool through SearXNG; declares `web:read` |
| `tools.py` | Imports the tool files so that their tools register |

## Surface

- Routes: none. The tools are served by the mcp module at `/mcp` and `/api/tools`.
- Jobs: none.
- Tools: `github.*` and `runpod.*`, the tools that those MCP servers list. The read scope gives the read-only tools; the write scope gives the others, which run only with `confirm=true`. `google.*`, `notion.*` and `web.search`, shown only when the org connected the service. Tools that change something run only with `confirm=true`.
- Tables: none. Token limits are the `limits` column of `machine_tokens`.

See [docs/integrations.md](../../docs/integrations.md#tools-for-agents).
