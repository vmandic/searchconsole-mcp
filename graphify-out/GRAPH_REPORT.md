# Graph Report - gsc-mcp  (2026-06-10)

## Corpus Check
- 38 files · ~10,868 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 317 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `488cdff1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `Search Console MCP` - 18 edges
2. `compilerOptions` - 11 edges
3. `Ship release (searchconsole-mcp)` - 11 edges
4. `getGscClient()` - 10 edges
5. `Security best practices report — searchconsole-mcp` - 8 edges
6. `scripts` - 7 edges
7. `Connect your MCP client` - 7 edges
8. `sanitizeToolError()` - 6 edges
9. `Tools reference` - 6 edges
10. `Releases and distribution` - 6 edges

## Surprising Connections (you probably didn't know these)
- `safeTool()` --calls--> `sanitizeToolError()`  [EXTRACTED]
  src/tools/index.ts → src/errors.ts
- `gscInspectUrl()` --calls--> `getGscClient()`  [EXTRACTED]
  src/tools/gscInspectUrl.ts → src/clients.ts
- `gscSearchAnalytics()` --calls--> `getGscClient()`  [EXTRACTED]
  src/tools/gscSearchAnalytics.ts → src/clients.ts
- `gscListSitemaps()` --calls--> `getGscClient()`  [EXTRACTED]
  src/tools/gscSitemaps.ts → src/clients.ts
- `gscListSites()` --calls--> `getGscClient()`  [EXTRACTED]
  src/tools/gscSites.ts → src/clients.ts

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (39): 1. Claude Code (set up first), 2. Cursor, 3. GitHub Copilot (VS Code), 4. OpenAI Codex, 5. Claude Desktop, Agentic install prompt, CLI, Configuration (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (21): CliOptions, getArg(), isCliParseError(), parseCli(), printHelp(), TransportMode, VALID_TRANSPORTS, ADC_SCOPES_GSC_ONLY (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (33): author, name, url, bin, searchconsole-mcp, bugs, url, description (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (17): formatToolResult(), getOutputFormat(), OutputFormat, prepareSearchAnalyticsForToon(), ToolTextResult, ToonPayloadKind, registerGscTools(), safeTool() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (22): Authentication, Critical (remediated with caveats), Data, Executive summary, Finding 10 — Dependencies, Finding 1 — Unauthenticated HTTP MCP exposes Google credentials, Finding 2 — HTTP server binds all interfaces, Finding 3 — Unbounded HTTP request body (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (12): getGscClient(), GscClient, resetGscClientForTests(), setGscClientForTests(), auth, auth, gscInspectUrl(), InspectUrlParams (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, rootDir (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): Before you start, Hard rules, References, Rollback (if publish was wrong), Ship release (searchconsole-mcp), Step 1 — Prepare code (git only), Step 2 — Publish to npm (user machine), Step 3 — GitHub tag and release (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (10): [1.0.0] - 2026-05-21, [1.0.1] - 2026-05-21, [1.1.0] - 2026-05-22, Added, Added, Added, Changelog, Notes (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (7): CI, GitHub Packages tab, GitHub Releases, Maintainer checklist (new version), npm package (primary install), Releases and distribution, Version alignment

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, rootDir, exclude, extends, include

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Agent guide — searchconsole-mcp, Ask before doing, Cursor rules (primary), Cursor skills, Quick reference

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (6): dependencies, google-auth-library, @googleapis/searchconsole, @modelcontextprotocol/sdk, @toon-format/toon, zod

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (6): `gsc_inspect_url`, `gsc_list_sitemaps`, `gsc_list_sites`, `gsc_mcp_server_ping`, `gsc_search_analytics`, Tools reference

## Knowledge Gaps
- **148 isolated node(s):** `pkg`, `name`, `version`, `description`, `type` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Search Console MCP` connect `Community 0` to `Community 13`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `pkg`, `name`, `version` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0796221322537112 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._