#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { dispatch } from './bank.js';

// Create MCP server
const server = new Server(
  { name: "mcp-agent-communication", version: "1.0.0" }
);

// Define the tools that expose the new agent communication API
const tools = [
  {
    name: "take",
    description: "Check for a message and return it if found (non-blocking). Removes the message from memory after taking it. Use when: You want to check for messages without waiting.",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Filter by specific agents (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by specific tags (optional)" }
      },
      required: []
    }
  },
  {
    name: "take_blocking",
    description: "Wait for a message and return it (blocking). Removes the message from memory after taking it. Use when: You want to wait for a specific message to arrive.",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Filter by specific agents (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by specific tags (optional)" },
        timeout: { type: "number", description: "Timeout in seconds (default: 30)" }
      },
      required: []
    }
  },
  {
    name: "put",
    description: "Send a message without waiting for a response (non-blocking). Use when: You want to send a message and continue immediately.",
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Description of the message" },
        agent_id: { type: "string", description: "ID of the agent sending the message" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for categorizing the message" },
        content: { description: "The message content (any type)" }
      },
      required: ["description", "agent_id", "tags", "content"]
    }
  },
  {
    name: "put_blocking",
    description: "Send a message and wait for a response (blocking). Use when: You need to wait for a review or response before continuing.",
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Description of the message" },
        agent_id: { type: "string", description: "ID of the agent sending the message" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for categorizing the message" },
        content: { description: "The message content (any type)" },
        timeout: { type: "number", description: "Timeout in seconds (default: 30)" }
      },
      required: ["description", "agent_id", "tags", "content"]
    }
  },
  {
    name: "peek",
    description: "Look at messages without removing them from memory. Use when: You want to check what messages are available without consuming them.",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Filter by specific agents (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by specific tags (optional)" }
      },
      required: []
    }
  },
  {
    name: "check_pending",
    description: "Check for currently blocking requests waiting on a response. Use when: You want to see what requests are still waiting for responses.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Check pending for specific agent (optional)" }
      },
      required: []
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    let mcpRequest;
    switch (name) {
      case "take":
        mcpRequest = { verb: "take", ...args };
        break;
      case "take_blocking":
        mcpRequest = { verb: "take-blocking", ...args };
        break;
      case "put":
        mcpRequest = { verb: "put", ...args };
        break;
      case "put_blocking":
        mcpRequest = { verb: "put-blocking", ...args };
        break;
      case "peek":
        mcpRequest = { verb: "peek", ...args };
        break;
      case "check_pending":
        mcpRequest = { verb: "check-pending", ...args };
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
    
    const response = await dispatch(mcpRequest);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
    
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Agent Communication server started");
  } catch (error: any) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Server error: ${error.message}`);
  process.exit(1);
}); 