# MCP Agent Communication 🤖✨

> **We don't need an agent framework!** Claude Code already has sub-agents and it works damn well.
> 
> **We just need a way for them to coordinate!** A simple MCP server that lets your sub-agents talk to each other.

**Coordinate autonomous agent swarms with blocking and non-blocking message queues**

## 🚀 Quick Start: Launch an Agent Development Team

Imagine deploying a complete development team of autonomous agents to build a new user authentication feature. Here's how you'd coordinate them:

```bash
# One-liner install and launch
npx mcp-agent-communication

# In your LLM interface (Claude, etc), create your agent swarm:
```

**Agent Coordination Prompt:**
```
Launch 5 sub agents that use mcp-agent-communication to coordinate

🔧 **Alice** (Frontend Engineer): Build React login/signup components
🔧 **Bob** (Backend Engineer): Implement JWT auth API endpoints  
🔧 **Carol** (DevOps Engineer): Set up database schema & deployment
👔 **David** (PM): Coordinate milestones and handle blockers
🎯 **Eve** (CTO): Make architectural decisions and final approvals

**Communication Protocol:**
- Use `send_message` for status updates and progress reports
- Use `send_message_and_wait_for_response` when you need approval or review before proceeding
- Use `wait_for_message` to wait for specific deliverables from other agents
- Use `check_messages` to check team progress without consuming messages
- Use `check_waiting_requests` to see what's blocking the team

**Workflow:**
1. David (PM) kicks off by putting the feature requirements
2. Eve (CTO) reviews and puts architectural decisions
3. Engineers take their assignments and work in parallel
4. Engineers use put-blocking for code reviews
5. Everyone coordinates on deployment timing

Start by having David put the initial project kickoff message with tag "kickoff".
```

## 🎯 Why This Matters

Traditional agent orchestration requires complex state management and rigid workflows. **MCP Agent Communication** lets autonomous agents coordinate naturally through a shared message queue - just like human teams use Slack, but designed for AI agents.

**Perfect for:**
- 🏗️ **Multi-agent development teams** building software features
- 🔄 **Autonomous workflow coordination** across specialized agents  
- 📊 **Complex data processing pipelines** with interdependent steps
- 🎮 **Game AI coordination** between multiple NPC agents
- 🏭 **Industrial automation** with multiple autonomous systems

## ⚡ Core Operations

| Human-Readable Tool | Technical Verb | Behavior | Use When |
|-------------------|---------------|----------|----------|
| `send_message` | `put` | Send message, continue immediately | Broadcast status updates, fire-and-forget |
| `send_message_and_wait_for_response` | `put-blocking` | Send message, wait for response | Need approval/review before proceeding |
| `receive_message` | `take` | Grab message if available, don't wait | Check for work items non-blocking |
| `wait_for_message` | `take-blocking` | Wait for specific message to arrive | Wait for deliverables from other agents |
| `check_messages` | `peek` | View messages without consuming | Monitor team progress |
| `check_waiting_requests` | `check-pending` | See what requests are waiting | Debug coordination bottlenecks |

### 🎯 Agent Type Examples

**Development Teams:**
- **Frontend Engineer**: Use `wait_for_message` to wait for API specs from backend team
- **Backend Engineer**: Use `send_message_and_wait_for_response` to request database schema review
- **DevOps Engineer**: Use `send_message` to announce deployment window
- **Project Manager**: Use `check_messages` to monitor team progress
- **Tech Lead**: Use `check_waiting_requests` to identify development bottlenecks

**Content Creation:**
- **Writer**: Use `send_message_and_wait_for_response` to submit article for editorial approval
- **Editor**: Use `receive_message` to check for new submissions
- **Designer**: Use `wait_for_message` to wait for content brief before creating visuals
- **Publisher**: Use `check_messages` to see approved content ready for publication

**Research Teams:**
- **Researcher**: Use `send_message` to share preliminary findings
- **Data Analyst**: Use `wait_for_message` to wait for cleaned dataset
- **Peer Reviewer**: Use `receive_message` to check for papers needing review
- **Principal Investigator**: Use `check_waiting_requests` to see what research needs approval

**Business Operations:**
- **Sales Rep**: Use `send_message_and_wait_for_response` to request pricing approval
- **Marketing**: Use `send_message` to announce campaign launch
- **Support Agent**: Use `receive_message` to check for new customer tickets
- **Manager**: Use `check_messages` to monitor departmental communications

## 🔥 Real-World Patterns

### Request-Response Coordination
```javascript
// Agent requests code review and waits (using MCP tool)
const review = await send_message_and_wait_for_response({
  description: "React auth component ready for review",
  agent_id: "alice", 
  tags: ["review", "frontend"],
  content: { files: ["Login.tsx", "Signup.tsx"], pr: "PR-123" },
  timeout: 300  // 5 minute timeout
});

// Senior engineer provides review
await send_message({
  description: "Code review complete", 
  agent_id: "eve",
  tags: ["review", "approved"],
  content: { status: "LGTM", suggestions: ["Add loading states"] }
});
```

### Pipeline Coordination
```javascript
// Backend engineer waits for database schema
const schema = await wait_for_message({
  agent_ids: ["carol"],  // Only from DevOps
  tags: ["database", "schema"],
  timeout: 600
});

// Now implement API endpoints using the schema
await send_message({
  description: "Auth API endpoints implemented",
  agent_id: "bob",
  tags: ["backend", "complete"],
  content: { endpoints: ["/login", "/register", "/refresh"] }
});
```

### Progress Monitoring
```javascript
// PM checks overall progress without disrupting work
const progress = await check_messages({
  tags: ["complete", "blocked", "in-progress"]
});

// Check what's causing delays
const blockers = await check_waiting_requests();
```

## 🛠️ Installation & Setup

```bash
npm install mcp-agent-communication

# Run the demo to see it in action
npm run demo

# Or use as MCP server with Claude Desktop
npm run build
# Add to your MCP config: node /path/to/dist/mcp-server.js
```

## 📡 Message Format

Every message includes rich metadata for smart filtering:

```typescript
{
  id: "uuid-v4",           // Unique message ID
  ts: 1640995200000,       // Server timestamp  
  description: "Auth API ready",
  agent_id: "bob",         // Who sent it
  tags: ["backend", "api", "complete"],  // Categorization
  content: {               // Your payload
    endpoints: ["/login", "/register"],
    database: "postgres://...",
    tests_passing: true
  }
}
```

## 🏗️ Architecture

- **In-Memory Queue**: Fast message storage with event-driven notifications
- **Blocking Coordination**: Agents can wait for specific messages with timeouts  
- **Filter System**: Route messages by agent ID, tags, or custom criteria
- **MCP Protocol**: Standard interface works with Claude Desktop and other LLM tools
- **TypeScript**: Full type safety for message contracts

## 🎮 Advanced Usage

**Custom Coordination Patterns:**
- **Leader Election**: Agents compete for coordinator role
- **Consensus Building**: Wait for majority agreement before proceeding  
- **Circuit Breakers**: Timeout and fallback when agents are unresponsive
- **Resource Pooling**: Coordinate access to shared systems/APIs
- **Hierarchical Workflows**: Parent agents managing sub-agent teams

**Scaling Options:**
- Replace in-memory storage with Redis/PostgreSQL
- Add message persistence and replay capabilities
- Implement message routing across multiple servers
- Add authentication and agent identity verification

## 🤝 Contributing

This is infrastructure for the autonomous agent future. Pull requests welcome!

```bash
git clone https://github.com/nbardy/mcp-agent-communication
cd mcp-agent-communication
npm install && npm run demo
```

## 📄 License

MIT - Build the future of agent coordination freely.

---

**Ready to coordinate your agent swarm?** `npm install mcp-agent-communication` and start building! 🚀 