# mcp-trakt

Trakt MCP — TV/movie metadata + watch tracking signals

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_movie` | Movie record by trakt ID / slug / IMDB ID. Use extended=full for plot/runtime/genres/cast. |
| `get_show` | Show record. Use extended=full for runtime/genres/cast/rating/airs/etc. |
| `list_seasons` | Seasons + episode counts for a show. |
| `get_episode` | Single episode by show + season + episode number. |
| `trending` | Currently-trending movies or shows. |
| `popular` | All-time popular movies or shows. |

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

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
