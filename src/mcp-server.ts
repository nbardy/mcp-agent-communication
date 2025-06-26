#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { dispatch } from './bank.js';

// Create MCP server
const server = new Server(
  { name: "mcp-agent-communication", version: "1.0.0" }
);

// Define the tools that expose your bank functionality
const tools = [
  {
    name: "put_message",
    description: "Store a message in the agent communication bank",
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
    name: "list_messages",
    description: "List messages from the agent communication bank",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Filter by agent IDs (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags (optional)" }
      },
      required: []
    }
  },
  {
    name: "read_messages",
    description: "Read messages from the agent communication bank since a timestamp",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Filter by agent IDs (optional)" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags (optional)" },
        since: { type: "number", description: "Timestamp to read messages since (epoch ms, optional)" }
      },
      required: []
    }
  },
  {
    name: "gather_messages",
    description: "Gather messages from specific agents with specific tags, waiting if necessary",
    inputSchema: {
      type: "object",
      properties: {
        agent_ids: { type: "array", items: { type: "string" }, description: "Required agent IDs" },
        tags: { type: "array", items: { type: "string" }, description: "Required tags" },
        timeout: { type: "number", description: "Timeout in seconds (default: 10)" }
      },
      required: ["agent_ids", "tags"]
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
      case "put_message":
        mcpRequest = { verb: "put!", ...args };
        break;
      case "list_messages":
        mcpRequest = { verb: "list", ...args };
        break;
      case "read_messages":
        mcpRequest = { verb: "read!", ...args };
        break;
      case "gather_messages":
        mcpRequest = { verb: "gather!", ...args };
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