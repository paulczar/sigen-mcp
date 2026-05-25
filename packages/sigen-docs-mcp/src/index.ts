#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";

const GITBOOK_API_BASE = "https://sigenergy.gitbook.io/sige-doc-en";

const SCOPE_PAGES = {
  user: `${GITBOOK_API_BASE}/mysigen-app-user-manual/dian-zhan-can-shu-she-zhi/energy-management-settings/energy-storage-working-mode.md`,
  installer: `${GITBOOK_API_BASE}/mysigen-app-installer-manual/device-parameter-setup/sigenstor/operational-parameters.md`,
} as const;

type Scope = keyof typeof SCOPE_PAGES;

const server = new Server(
  { name: "sigen-docs-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "query_sigen_docs",
      description:
        "Query Sigenergy mySigen App documentation. Use this to understand how to configure operational modes, " +
        "solar settings, battery settings (charging/discharging, automation, preheating), grid settings (peak shaving, " +
        "tariff plans, exporting priority, automation), and all other system configuration parameters. " +
        "Returns an AI-synthesized answer with source references from the official Sigenergy docs.",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "Natural language question about Sigenergy system configuration. Be specific about your scenario. " +
              "Examples: 'How do I set up peak shaving with my TOU rate plan?', " +
              "'What parameters are available in Battery Automation?', " +
              "'I have peak rates from 4-9pm and off-peak overnight, how should I configure my battery?'",
          },
          scope: {
            type: "string",
            enum: ["user", "installer"],
            description:
              "Which manual to query. 'user' (default) covers daily operation and settings. " +
              "'installer' covers device parameter setup, grid code config, and commissioning.",
          },
        },
        required: ["question"],
      },
    },
  ],
}));

async function queryGitBook(question: string, scope: Scope): Promise<string> {
  const pageUrl = SCOPE_PAGES[scope];
  const askUrl = `${pageUrl}?ask=${encodeURIComponent(question)}`;

  const response = await fetch(askUrl);
  if (!response.ok) {
    throw new McpError(
      ErrorCode.InternalError,
      `GitBook API returned status ${response.status}`,
    );
  }

  const text = await response.text();

  // Strip HTML tags if the response is HTML (GitBook can return either)
  const isHtml = text.trim().startsWith("<");
  const clean = isHtml
    ? text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : text;

  return clean;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "query_sigen_docs") {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`,
    );
  }

  const args = request.params.arguments ?? {};
  const question = String(args.question ?? "");
  const scope: Scope = (args.scope as Scope) ?? "user";

  if (!question.trim()) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "question is required",
    );
  }

  if (scope !== "user" && scope !== "installer") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "scope must be 'user' or 'installer'",
    );
  }

  try {
    const answer = await queryGitBook(question, scope);
    return {
      content: [{ type: "text", text: answer }],
    };
  } catch (err) {
    if (err instanceof McpError) throw err;
    const msg = err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);
    throw new McpError(ErrorCode.InternalError, `Failed to query docs: ${msg}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("sigen-docs-mcp running on stdio");
