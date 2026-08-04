# @pipeworx/trakt

Trakt.tv MCP — TV/movie metadata + trending/popular signals.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(query, type?, fields?, years?, genres?, countries?, languages?, page?, limit?)`
- `get_movie(id, extended?)`
- `get_show(id, extended?)`
- `list_seasons(show_id, extended?)`
- `get_episode(show_id, season, episode, extended?)`
- `trending(type, limit?, page?)`
- `popular(type, limit?, page?)`

## Auth

- **Platform key:** gateway env `PLATFORM_TRAKT_KEY` (client_id from a registered Trakt app).
- **BYO:** `?_apiKey=<client_id>` after registering at https://trakt.tv/oauth/applications.

Read-only endpoints work with just the client_id (no user OAuth required).

## Data source

`https://api.trakt.tv` — header `trakt-api-key` + `trakt-api-version: 2`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "trakt": {
      "url": "https://gateway.pipeworx.io/trakt/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Trakt data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
