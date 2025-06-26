# MCP Agent Communication

A TypeScript library for coordinating communication between multiple agents using the Model Context Protocol (MCP). This system allows agents to send messages, gather responses from multiple agents, and coordinate distributed work.

## Features

- **Agent Coordination**: Send messages between agents with tagging system
- **Gather Operations**: Wait for multiple agents to complete tasks
- **Timeout Support**: Handle partial completions with configurable timeouts
- **Banking System**: Track agent balances and transactions
- **Real-time Communication**: WebSocket-based message passing

## Installation

```bash
npm install mcp-agent-communication
```

## Quick Start

### Basic Usage

```typescript
import { startServer } from 'mcp-agent-communication/server';
import { MCPClient } from 'mcp-agent-communication/client';

// Start the MCP server
startServer();

// Create a client and send messages
const client = new MCPClient();

await client.send({
  verb: 'put!',
  description: 'task completed',
  agent_id: 'agent1',
  tags: ['complete'],
  content: { result: 'success' }
});
```

### Coordination Example

```typescript
// Wait for multiple agents to complete a task
const result = await client.send({
  verb: 'gather!',
  agent_ids: ['agent1', 'agent2', 'agent3'],
  tags: ['task_complete'],
  timeout: 30
});

console.log('Completed agents:', result.completed);
console.log('Partial result:', result.partial);
```

## API Reference

### MCPClient

#### `send(message: MCPMessage)`

Send a message through the MCP system.

**Message Types:**

- `put!` - Send a message from an agent
- `gather!` - Wait for messages from multiple agents
- `bank!` - Perform banking operations

### Banking Operations

```typescript
// Transfer funds between agents
await client.send({
  verb: 'bank!',
  from: 'agent1',
  to: 'agent2',
  amount: 100
});

// Check balance
const balance = await client.send({
  verb: 'bank!',
  agent_id: 'agent1',
  action: 'balance'
});
```

## Demo

Run the included demo to see agent coordination in action:

```bash
npx tsx src/demo.ts
```

This demo simulates engineers working on tasks while a project manager coordinates and reviews their work.

## Development

### Setup

```bash
git clone https://github.com/yourusername/mcp-agent-communication
cd mcp-agent-communication
npm install
```

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## Configuration

The MCP server runs on port 4545 by default. You can configure this by setting the `MCP_PORT` environment variable.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 