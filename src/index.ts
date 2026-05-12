interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Trakt MCP — TV/movie metadata + watch tracking signals
 *
 * Read-only endpoints work with just the client_id (no user OAuth) and give
 * trending / popular / search / movie-or-show detail. User-scoped features
 * (watch history, custom lists) need the full OAuth flow and are out of
 * scope here.
 *
 * API: https://trakt.docs.apiary.io/
 * Auth: header `trakt-api-key: <client_id>` + `trakt-api-version: 2`.
 *
 * Tools:
 * - search:          search movies/shows/episodes/people/lists
 * - get_movie:       movie record with full metadata
 * - get_show:        show record (seasons via list_seasons)
 * - list_seasons:    seasons of a show
 * - trending:        trending movies or shows
 * - popular:         popular movies or shows
 * - get_episode:     single episode
 */


const BASE_URL = 'https://api.trakt.tv';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description:
      'Search Trakt. type = comma-separated of movie, show, episode, person, list. Returns each result with score + matched object.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        type: { type: 'string', description: 'movie | show | episode | person | list (comma-sep ok)' },
        fields: { type: 'string', description: 'Restrict matched fields (title | tagline | overview | people | translations | aliases | ...)' },
        years: { type: 'string', description: 'Restrict to year/range (e.g., "1999" or "1999-2005")' },
        genres: { type: 'string', description: 'Genre slug filter (comma-sep ok)' },
        countries: { type: 'string', description: 'Country code filter (comma-sep)' },
        languages: { type: 'string', description: 'Language code filter' },
        page: { type: 'number', description: '1-based page (default 1)' },
        limit: { type: 'number', description: '1-100 (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_movie',
    description: 'Movie record by trakt ID / slug / IMDB ID. Use extended=full for plot/runtime/genres/cast.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'trakt ID, slug, or IMDB/TMDB ID' },
        extended: { type: 'string', description: 'full | metadata | images (default omitted = base record)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_show',
    description: 'Show record. Use extended=full for runtime/genres/cast/rating/airs/etc.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'trakt ID, slug, or IMDB/TMDB ID' },
        extended: { type: 'string', description: 'full | metadata | images' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_seasons',
    description: 'Seasons + episode counts for a show.',
    inputSchema: {
      type: 'object',
      properties: {
        show_id: { type: 'string', description: 'trakt ID or slug' },
        extended: { type: 'string', description: 'full | episodes | full,episodes' },
      },
      required: ['show_id'],
    },
  },
  {
    name: 'get_episode',
    description: 'Single episode by show + season + episode number.',
    inputSchema: {
      type: 'object',
      properties: {
        show_id: { type: 'string', description: 'trakt show ID/slug' },
        season: { type: 'number', description: 'Season number' },
        episode: { type: 'number', description: 'Episode number' },
        extended: { type: 'string', description: 'full | images' },
      },
      required: ['show_id', 'season', 'episode'],
    },
  },
  {
    name: 'trending',
    description: 'Currently-trending movies or shows.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'movies | shows', enum: ['movies', 'shows'] },
        limit: { type: 'number', description: '1-100 (default 10)' },
        page: { type: 'number', description: '1-based page' },
      },
      required: ['type'],
    },
  },
  {
    name: 'popular',
    description: 'All-time popular movies or shows.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'movies | shows', enum: ['movies', 'shows'] },
        limit: { type: 'number', description: '1-100 (default 10)' },
        page: { type: 'number', description: '1-based page' },
      },
      required: ['type'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'Trakt requires a client_id. Contact the operator about platform credentials, or BYO via ?_apiKey=<client_id> after registering at https://trakt.tv/oauth/applications.',
    );
  }
  switch (name) {
    case 'search':
      return search(apiKey, args);
    case 'get_movie':
      return traktGet(apiKey, `/movies/${encodeURIComponent(reqStr(args, 'id', '"the-godfather-1972"'))}`, extendedParams(args));
    case 'get_show':
      return traktGet(apiKey, `/shows/${encodeURIComponent(reqStr(args, 'id', '"breaking-bad"'))}`, extendedParams(args));
    case 'list_seasons':
      return traktGet(apiKey, `/shows/${encodeURIComponent(reqStr(args, 'show_id', '"breaking-bad"'))}/seasons`, extendedParams(args));
    case 'get_episode':
      return traktGet(
        apiKey,
        `/shows/${encodeURIComponent(reqStr(args, 'show_id', '"breaking-bad"'))}/seasons/${args.season}/episodes/${args.episode}`,
        extendedParams(args),
      );
    case 'trending':
      return traktGet(apiKey, `/${args.type}/trending`, listParams(args));
    case 'popular':
      return traktGet(apiKey, `/${args.type}/popular`, listParams(args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing or empty. Pass a string like ${example}.`);
  }
  return v;
}

function extendedParams(args: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  if (args.extended) p.set('extended', String(args.extended));
  return p;
}

function listParams(args: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams({
    limit: String(Math.min(100, Math.max(1, (args.limit as number) ?? 10))),
    page: String(Math.max(1, (args.page as number) ?? 1)),
  });
  return p;
}

async function traktFetch<T>(apiKey: string, path: string, params: URLSearchParams): Promise<T> {
  const url = `${BASE_URL}${path}${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: {
      'trakt-api-key': apiKey,
      'trakt-api-version': '2',
      Accept: 'application/json',
      'User-Agent': 'pipeworx-mcp-trakt/1.0 (+https://pipeworx.io)',
    },
  });
  if (res.status === 401 || res.status === 403) throw new Error('Trakt: unauthorized — check the client_id');
  if (res.status === 404) throw new Error('Trakt: not found (HTTP 404)');
  if (res.status === 429) throw new Error('Trakt: rate-limit (HTTP 429)');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Trakt error: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function traktGet(apiKey: string, path: string, params: URLSearchParams) {
  return traktFetch<unknown>(apiKey, path, params);
}

async function search(apiKey: string, args: Record<string, unknown>) {
  const type = (args.type as string) ?? 'movie,show';
  const params = new URLSearchParams({
    query: String(args.query),
    limit: String(Math.min(100, Math.max(1, (args.limit as number) ?? 10))),
    page: String(Math.max(1, (args.page as number) ?? 1)),
  });
  if (args.fields) params.set('fields', String(args.fields));
  if (args.years) params.set('years', String(args.years));
  if (args.genres) params.set('genres', String(args.genres));
  if (args.countries) params.set('countries', String(args.countries));
  if (args.languages) params.set('languages', String(args.languages));

  return traktFetch<unknown>(apiKey, `/search/${encodeURIComponent(type)}`, params);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
