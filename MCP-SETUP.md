# MCP Agent Communication Server Setup

## What Was Wrong

Your original implementation had fundamental issues:
1. **Wrong Protocol**: Custom TCP instead of MCP standard
2. **Missing Dependencies**: No MCP SDK
3. **Wrong Transport**: TCP sockets instead of stdio
4. **Custom Messages**: Custom verbs instead of MCP tools

## What's Fixed

The new `src/mcp-server.ts` properly implements MCP by:
1. Using MCP SDK and stdio transport
2. Exposing your bank functionality as MCP tools
3. Following MCP protocol standards

## Setup Instructions

1. Install: `npm install`
2. Build: `npm run build`
3. Add to Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "mcp-agent-communication": {
      "command": "node",
      "args": ["/full/path/to/your/project/dist/mcp-server.js"]
    }
  }
}
```

4. Restart Claude Desktop

## Available Tools

- **put_message**: Store a message in the bank
- **list_messages**: List messages (with filters)
- **read_messages**: Read messages since timestamp
- **gather_messages**: Wait for specific messages

Your original bank functionality is preserved - just now properly exposed via MCP!
