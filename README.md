# MCP Agent Communication

A TypeScript implementation of a Message Communication Protocol (MCP) for coordinating autonomous agents. This system enables asynchronous communication between software agents using a simple TCP-based message queue.

## Overview

The MCP system provides a lightweight coordination layer for autonomous agents to communicate progress, gather information, and synchronize workflows. Agents communicate via JSON messages over TCP sockets, using a simple verb-based DSL.

## Quick Start

```bash
npm install
npx tsx src/demo.ts
```

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