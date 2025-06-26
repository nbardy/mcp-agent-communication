# MCP Agent Communication Server

An MCP (Model Context Protocol) server that enables agent communication and message coordination through Claude Desktop and other MCP-compatible clients.

## Installation

```bash
npm install mcp-agent-communication
```

## Overview

This MCP server provides a communication layer for autonomous agents to coordinate work, share progress updates, and synchronize workflows. It exposes your agent communication functionality as standard MCP tools that can be used directly in Claude Desktop.

## Quick Start

### As an MCP Server for Claude Desktop

1. Install and build:
```bash
npm install
npm run build
```

2. Add to your Claude Desktop MCP settings:
```json
{
  "mcpServers": {
    "mcp-agent-communication": {
      "command": "node",
      "args": ["/full/path/to/mcp-agent-communication/dist/mcp-server.js"]
    }
  }
}
```

3. Restart Claude Desktop

### As a Development Tool

```bash
npm install
npx tsx src/demo.ts  # Run the original TCP-based demo
```

## MCP Tools Available

Once configured, you'll have access to these tools in Claude:

### `put_message`
Store a message in the agent communication bank
- **description**: Human-readable description
- **agent_id**: ID of the agent sending the message  
- **tags**: Array of tags for categorizing
- **content**: The message content (any type)

### `list_messages`
List messages from the communication bank
- **agent_ids** (optional): Filter by specific agent IDs
- **tags** (optional): Filter by specific tags

### `read_messages`
Read messages since a timestamp
- **agent_ids** (optional): Filter by specific agent IDs
- **tags** (optional): Filter by specific tags
- **since** (optional): Timestamp to read messages since (epoch ms)

### `gather_messages`
Wait for specific messages from specific agents
- **agent_ids**: Required agent IDs to wait for
- **tags**: Required tags to wait for
- **timeout** (optional): Timeout in seconds (default: 10)

## Communication Patterns

### How Agents Communicate

**Engineers** should:
- Put frequent progress updates using `put_message`
- Use descriptive tags like `"start"`, `"update"`, `"finish"`, `"blocked"`
- Include relevant work artifacts in the `content` field
- Use `gather_messages` to wait for PM feedback

**Project Managers** should:
- Use `gather_messages` to wait for engineer milestones
- Provide timely feedback using `put_message` with `"review"` tags
- Monitor overall project progress with `list_messages` and `read_messages`

### Example Usage in Claude

```
Put a start message:
Tool: put_message
- description: "Starting work on authentication feature"
- agent_id: "alice"
- tags: ["start"]
- content: {"feature": "auth", "estimated_hours": 8}

Wait for completion from multiple agents:
Tool: gather_messages
- agent_ids: ["alice", "bob", "carol"]
- tags: ["finish"]
- timeout: 300

List recent updates:
Tool: read_messages
- tags: ["update"]
- since: 1640995200000
```

## Legacy TCP Protocol

The original TCP-based protocol is still available for backwards compatibility:

## Architecture

- **Message Store**: In-memory message queue with event-driven notifications
- **TCP Server**: JSON-line protocol over raw TCP (port 4545)
- **Client Library**: Lightweight wrapper for agent communication
- **Demo**: Complete example with 3 engineers + 1 PM

## MCP Protocol

### Connection
Connect to the MCP server via TCP socket at `HOST:PORT` (default localhost:4545).
Send one JSON object per line.

### Verbs

#### `put!` - Store a message
```json
{
  "verb": "put!",
  "description": "human-readable description",
  "agent_id": "your-agent-id",
  "tags": ["tag1", "tag2"],
  "content": { "any": "data" }
}
```
**Response**: `{"ok": true, "id": "uuid"}`

#### `list` - Query existing messages
```json
{
  "verb": "list",
  "agent_ids": ["alice", "bob"],  // optional filter
  "tags": ["finish"]              // optional filter
}
```
**Response**: `{"messages": [...]}`

#### `read!` - Get messages since timestamp
```json
{
  "verb": "read!",
  "agent_ids": ["alice"],         // optional filter
  "tags": ["update"],             // optional filter
  "since": 1640995200000          // epoch-ms, optional
}
```
**Response**: `{"messages": [...]}`

#### `gather!` - Wait for messages (blocking)
```json
{
  "verb": "gather!",
  "agent_ids": ["alice", "bob", "carol"],  // required
  "tags": ["finish"],                      // required
  "timeout": 10                            // seconds, default 10
}
```
**Response**: 
- `{"completed": [["alice","finish"], ...], "partial": false, "messages": [...]}`
- `{"completed": [...], "partial": true, "messages": [...]}` (if timeout)

## Communication Patterns

### How to Communicate

**Engineers** should:
- Put frequent progress updates on the message queue using `put!`
- Use descriptive tags like `"start"`, `"update"`, `"finish"`, `"blocked"`
- Include relevant work artifacts in the `content` field
- Listen for PM feedback using `gather!` on their own agent ID

**Project Managers** should:
- Use `gather!` to wait for engineer milestones
- Provide timely feedback using `put!` with `"review"` tags
- Monitor overall project progress with `list` and `read!`

### Typical Engineer Workflow

```json
// 1. Signal work start
{"verb": "put!", "description": "begin feature X", "agent_id": "alice", "tags": ["start"], "content": {}}

// 2. Share progress updates
{"verb": "put!", "description": "API design complete", "agent_id": "alice", "tags": ["update"], "content": {"design": "..."}}

// 3. Mark completion
{"verb": "put!", "description": "feature X complete with tests", "agent_id": "alice", "tags": ["finish"], "content": {"pr": "https://github.com/..."}}

// 4. Wait for review
{"verb": "gather!", "agent_ids": ["alice"], "tags": ["review"], "timeout": 30}

// 5. Respond to feedback if needed
{"verb": "put!", "description": "addressed review comments", "agent_id": "alice", "tags": ["update"], "content": {}}
```

### Typical PM Workflow

```json
// 1. Wait for all engineers to start
{"verb": "gather!", "agent_ids": ["alice", "bob", "carol"], "tags": ["start"], "timeout": 10}

// 2. Monitor for completions
{"verb": "gather!", "agent_ids": ["alice", "bob", "carol"], "tags": ["finish"], "timeout": 60}

// 3. Provide reviews
{"verb": "put!", "description": "LGTM - good work!", "agent_id": "alice", "tags": ["review"], "content": {"approved": true}}
```

## Agent Instructions

You are an autonomous software engineer agent.

### Mission
Implement your assigned feature then mark it **finish** when done.

### Communication
Talk to the MCP server via a plain-text TCP socket at HOST:PORT (default 4545).
Every line you send MUST be one JSON object containing:
- `"verb"`: one of `"put!"`, `"list"`, `"gather!"`, `"read!"`
- verb-specific fields (see protocol above)

### Typical Workflow
1. `put!` tag `"start"` when you begin
2. Optionally `put!` `"update"` with progress and decisions
3. `put!` tag `"finish"` when feature & tests pass
4. `gather!` `"review"` from PM; react to feedback if needed

### Example Session
```bash
# Connect to MCP server
nc localhost 4545

# Start work
{"verb":"put!", "description":"implementing login API", "agent_id":"alice", "tags":["start"], "content":{}}

# Progress update
{"verb":"put!", "description":"database schema ready", "agent_id":"alice", "tags":["update"], "content":{"schema":"users table created"}}

# Mark completion
{"verb":"put!", "description":"login API complete with tests", "agent_id":"alice", "tags":["finish"], "content":{"pr":"https://git/alice/login-api"}}

# Wait for review
{"verb":"gather!", "agent_ids":["alice"], "tags":["review"], "timeout":30}
```

## Files

- `src/types.ts` - Protocol interfaces and types
- `src/bank.ts` - Message store and query logic
- `src/server.ts` - TCP server implementation
- `src/client.ts` - Client library for agents
- `src/demo.ts` - Complete demo with engineers + PM
- `tsconfig.json` - TypeScript configuration

## Running the Demo

```bash
npm install
npx tsx src/demo.ts
```

You'll see output like:
```
MCP listening on 4545
[alice] Starting work
[bob] Starting work
[carol] Starting work
[PM] Waiting for all engineers to start
[PM] All engineers started, waiting for all finishes
[alice] Finished work after 1.50s
[bob] Finished work after 2.53s
[carol] Finished work after 2.67s
[PM] Reviewing alice
[PM] Reviewing bob
[PM] Reviewing carol
[PM] Done reviewing
```

## Extending

- **Persistence**: Replace the in-memory `messages` array with a database
- **Scaling**: Stream events to Kafka or Redis for distributed coordination  
- **Transport**: Swap TCP for HTTP, WebSocket, or gRPC by changing only `server.ts`
- **Security**: Add authentication and message encryption
- **UI**: Build a web dashboard to monitor agent communications

The protocol is transport-agnostic and designed for easy extension to real LLM agents or any process that can send JSON over a socket. 