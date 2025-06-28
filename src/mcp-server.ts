#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { dispatch } from './bank.js';

// Create MCP server using the modern high-level API
const server = new McpServer({
  name: "mcp-agent-communication", 
  version: "1.0.0"
});

// Register tools using the modern SDK approach with Zod validation

server.registerTool(
  "receive_message",
  {
    title: "Receive Message",
    description: `Receive a message from the communication queue if one is available (non-blocking). Removes the message after receiving it.

Use when: You want to check for new messages without waiting

Examples by agent type:
• Development Team: Frontend engineer checking for design updates from designer
• Content Creation: Writer checking for feedback from editor  
• Research Team: Analyst checking for new data from researcher
• Business Operations: Support agent checking for new tickets from customers

Example usage:
- Software Engineer: Check for code review results
- Project Manager: Check for status updates from team members
- Content Writer: Check for editorial feedback`,
    inputSchema: {
      agent_ids: z.array(z.string()).optional().describe("Filter by specific agents (optional)"),
      tags: z.array(z.string()).optional().describe("Filter by specific tags (optional)")
    }
  },
  async ({ agent_ids, tags }) => {
    const response = await dispatch({ verb: "take", agent_ids, tags });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

server.registerTool(
  "wait_for_message",
  {
    title: "Wait for Message",
    description: `Wait for a message to arrive and receive it (blocking). Removes the message after receiving it.

Use when: You need to wait for a specific message before continuing

Examples by agent type:
• Development Team: Backend engineer waiting for database schema from DevOps
• Content Creation: Designer waiting for content brief from writer
• Research Team: Reviewer waiting for research findings to approve
• Business Operations: Manager waiting for sales reports from team

Example usage:
- Code Reviewer: Wait for code submission to review
- Publisher: Wait for final article approval before publishing
- Data Analyst: Wait for dataset to be ready for analysis`,
    inputSchema: {
      agent_ids: z.array(z.string()).optional().describe("Filter by specific agents (optional)"),
      tags: z.array(z.string()).optional().describe("Filter by specific tags (optional)"),
      timeout: z.number().optional().describe("Timeout in seconds (default: 30)")
    }
  },
  async ({ agent_ids, tags, timeout }) => {
    const response = await dispatch({ verb: "take-blocking", agent_ids, tags, timeout });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

server.registerTool(
  "send_message",
  {
    title: "Send Message",
    description: `Send a message to other agents and continue immediately (non-blocking).

Use when: You want to broadcast information or updates without waiting for a response

Examples by agent type:
• Development Team: Frontend engineer announcing feature completion
• Content Creation: Writer publishing first draft for review
• Research Team: Researcher sharing preliminary findings
• Business Operations: Marketing announcing campaign launch

Example usage:
- Status Updates: "Authentication API endpoints completed"
- Progress Reports: "User interface designs ready for review"
- Announcements: "Database migration scheduled for tonight"`,
    inputSchema: {
      description: z.string().describe("Description of the message"),
      agent_id: z.string().describe("ID of the agent sending the message"),
      tags: z.array(z.string()).describe("Tags for categorizing the message"),
      content: z.any().describe("The message content (any type)")
    }
  },
  async ({ description, agent_id, tags, content }) => {
    const response = await dispatch({ verb: "put", description, agent_id, tags, content });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

server.registerTool(
  "send_message_and_wait_for_response",
  {
    title: "Send Message and Wait for Response",
    description: `Send a message and wait for a response from other agents (blocking).

Use when: You need approval, feedback, or a specific response before continuing

Examples by agent type:
• Development Team: Engineer requesting code review and waiting for approval
• Content Creation: Writer submitting article and waiting for editorial approval
• Research Team: Researcher submitting findings and waiting for peer review
• Business Operations: Sales rep requesting pricing approval from manager

Example usage:
- Code Review: Send code for review and wait for approval/changes
- Content Approval: Submit blog post and wait for publisher approval
- Architecture Decision: Propose technical solution and wait for CTO approval`,
    inputSchema: {
      description: z.string().describe("Description of the message"),
      agent_id: z.string().describe("ID of the agent sending the message"),
      tags: z.array(z.string()).describe("Tags for categorizing the message"),
      content: z.any().describe("The message content (any type)"),
      timeout: z.number().optional().describe("Timeout in seconds (default: 30)")
    }
  },
  async ({ description, agent_id, tags, content, timeout }) => {
    const response = await dispatch({ verb: "put-blocking", description, agent_id, tags, content, timeout });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

server.registerTool(
  "check_messages",
  {
    title: "Check Messages",
    description: `View messages without removing them from the queue.

Use when: You want to monitor activity or check message queue status without consuming messages

Examples by agent type:
• Development Team: Project manager monitoring team progress
• Content Creation: Editor reviewing workflow status
• Research Team: Principal investigator overseeing research pipeline
• Business Operations: Director monitoring departmental communications

Example usage:
- Progress Monitoring: Check what deliverables are ready
- Queue Management: See what work items are pending
- Team Coordination: Monitor communication flow between agents`,
    inputSchema: {
      agent_ids: z.array(z.string()).optional().describe("Filter by specific agents (optional)"),
      tags: z.array(z.string()).optional().describe("Filter by specific tags (optional)")
    }
  },
  async ({ agent_ids, tags }) => {
    const response = await dispatch({ verb: "peek", agent_ids, tags });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

server.registerTool(
  "check_waiting_requests",
  {
    title: "Check Waiting Requests",
    description: `Check for agents currently waiting for responses to their blocking requests.

Use when: You want to identify bottlenecks or see what requests need attention

Examples by agent type:
• Development Team: Tech lead identifying blockers in development pipeline
• Content Creation: Managing editor finding articles waiting for approval
• Research Team: Department head finding research waiting for review
• Business Operations: Operations manager identifying approval bottlenecks

Example usage:
- Bottleneck Analysis: Find what's blocking team progress
- Priority Management: Identify urgent requests needing attention
- Team Health: Monitor communication flow and response times`,
    inputSchema: {
      agent_id: z.string().optional().describe("Check pending for specific agent (optional)")
    }
  },
  async ({ agent_id }) => {
    const response = await dispatch({ verb: "check-pending", agent_id });
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(response, null, 2) 
      }]
    };
  }
);

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