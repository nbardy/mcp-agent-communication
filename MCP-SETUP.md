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

The agent communication system provides these human-readable tools:

| Tool Name | Description | Use Case |
|-----------|-------------|----------|
| **send_message** | Send a message without waiting for response | Status updates, announcements |
| **send_message_and_wait_for_response** | Send message and wait for response | Approvals, reviews, feedback |
| **receive_message** | Check for messages (non-blocking) | Polling for new work items |
| **wait_for_message** | Wait for specific messages (blocking) | Waiting for deliverables |
| **check_messages** | View messages without consuming them | Progress monitoring |
| **check_waiting_requests** | See what requests need attention | Bottleneck analysis |

### Quick Examples:

```javascript
// Send status update
await send_message({
  description: "Feature implementation complete", 
  agent_id: "developer_alice",
  tags: ["feature", "complete"],
  content: { feature: "user-auth", status: "ready-for-testing" }
});

// Request code review and wait
const review = await send_message_and_wait_for_response({
  description: "Please review authentication module",
  agent_id: "developer_alice", 
  tags: ["review", "backend"],
  content: { files: ["auth.ts", "user.ts"] }
});

// Check for new work items
const work = await receive_message({
  tags: ["todo", "assigned-to-me"]
});
```

Your original bank functionality is preserved - just now properly exposed via MCP with intuitive tool names!
