import { startServer } from './server';
import { MCPClient } from './client';
const engineerIds = ['alice', 'bob', 'carol'];
async function engineer(id) {
    const cli = new MCPClient();
    console.log(`[${id}] Starting work`);
    await cli.send({
        verb: 'put!',
        description: 'begin work',
        agent_id: id,
        tags: ['start'],
        content: {},
    });
    // simulate work 1‑3 s
    const workTime = 1000 + Math.random() * 2000;
    await new Promise(r => setTimeout(r, workTime));
    console.log(`[${id}] Finished work after ${(workTime / 1000).toFixed(2)}s`);
    await cli.send({
        verb: 'put!',
        description: 'feature done',
        agent_id: id,
        tags: ['finish'],
        content: { pr: `https://git/${id}` },
    });
}
async function pm() {
    const cli = new MCPClient();
    console.log(`[PM] Waiting for all engineers to start`);
    // wait for all starts
    await cli.send({
        verb: 'gather!',
        agent_ids: engineerIds,
        tags: ['start'],
        timeout: 10,
    });
    console.log(`[PM] All engineers started, waiting for all finishes`);
    // wait for all finishes (retry if partial)
    while (true) {
        const g = await cli.send({
            verb: 'gather!',
            agent_ids: engineerIds,
            tags: ['finish'],
            timeout: 10,
        });
        for (const [agent] of g.completed) {
            console.log(`[PM] Reviewing ${agent}`);
            await cli.send({
                verb: 'put!',
                description: 'review',
                agent_id: agent,
                tags: ['review'],
                content: `LGTM for ${agent}`,
            });
        }
        if (!g.partial)
            break;
        console.log(`[PM] Partial completion, waiting again...`);
    }
    console.log('[PM] Done reviewing');
}
async function main() {
    startServer(); // fire up MCP
    // Wait a moment for the server to start
    await new Promise(r => setTimeout(r, 100));
    // Start engineers and PM, and wait for all to finish
    await Promise.all([
        ...engineerIds.map(engineer),
        pm()
    ]);
}
main();
