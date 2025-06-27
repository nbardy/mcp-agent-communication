import { dispatch } from './bank.js';

async function demo() {
  console.log('=== MCP Agent Communication Demo ===\n');

  try {
    // Demo 1: Non-blocking put and take
    console.log('1. Non-blocking put and take:');
    console.log('   Agent1 puts a message...');
    const putResult = await dispatch({
      verb: 'put',
      description: 'Status update from Agent1',
      agent_id: 'agent1',
      tags: ['status', 'update'],
      content: { status: 'working', progress: 50 }
    });
    console.log('   Put result:', JSON.stringify(putResult, null, 2));

    console.log('   Agent2 takes the message...');
    const takeResult = await dispatch({
      verb: 'take',
      tags: ['status']
    });
    console.log('   Take result:', JSON.stringify(takeResult, null, 2));

    console.log('   Agent2 tries to take again (should be empty)...');
    const takeResult2 = await dispatch({
      verb: 'take',
      tags: ['status']
    });
    console.log('   Take result 2:', JSON.stringify(takeResult2, null, 2));

    // Demo 2: Peek without removing
    console.log('\n2. Peek without removing:');
    console.log('   Agent1 puts another message...');
    await dispatch({
      verb: 'put',
      description: 'Another message',
      agent_id: 'agent1',
      tags: ['info'],
      content: { data: 'important info' }
    });

    console.log('   Agent2 peeks at messages...');
    const peekResult = await dispatch({
      verb: 'peek',
      tags: ['info']
    });
    console.log('   Peek result:', JSON.stringify(peekResult, null, 2));

    console.log('   Agent2 peeks again (message still there)...');
    const peekResult2 = await dispatch({
      verb: 'peek',
      tags: ['info']
    });
    console.log('   Peek result 2:', JSON.stringify(peekResult2, null, 2));

    // Demo 3: Blocking operations with timeout
    console.log('\n3. Blocking operations:');
    console.log('   Agent2 starts waiting for a specific message...');
    
    // Start a blocking take in the background
    const blockingPromise = dispatch({
      verb: 'take-blocking',
      agent_ids: ['agent1'],
      tags: ['urgent'],
      timeout: 5
    });

    // Wait a bit, then send the message
    setTimeout(async () => {
      console.log('   (2 seconds later) Agent1 sends urgent message...');
      await dispatch({
        verb: 'put',
        description: 'Urgent notification',
        agent_id: 'agent1',
        tags: ['urgent', 'alert'],
        content: { priority: 'high', message: 'System alert!' }
      });
    }, 2000);

    const blockingResult = await blockingPromise;
    console.log('   Blocking take result:', JSON.stringify(blockingResult, null, 2));

    // Demo 4: Put-blocking (waiting for response)
    console.log('\n4. Put-blocking (waiting for response):');
    console.log('   Agent1 sends message and waits for response...');
    
    // Start a blocking put
    const putBlockingPromise = dispatch({
      verb: 'put-blocking',
      description: 'Request for review',
      agent_id: 'agent1',
      tags: ['review', 'request'],
      content: { document: 'proposal.pdf', action: 'please review' },
      timeout: 5
    });

    // Simulate another agent responding
    setTimeout(async () => {
      console.log('   (1 second later) Agent2 responds...');
      await dispatch({
        verb: 'put',
        description: 'Review response',
        agent_id: 'agent2',
        tags: ['review', 'response'],
        content: { status: 'approved', comments: 'Looks good!' }
      });
    }, 1000);

    const putBlockingResult = await putBlockingPromise;
    console.log('   Put-blocking result:', JSON.stringify(putBlockingResult, null, 2));

    // Demo 5: Check pending requests
    console.log('\n5. Check pending requests:');
    
    // Start another blocking request without resolution
    const pendingPromise = dispatch({
      verb: 'put-blocking',
      description: 'Another request',
      agent_id: 'agent3',
      tags: ['help', 'question'],
      content: { question: 'How do I configure this?' },
      timeout: 10
    });

    // Check what's pending
    setTimeout(async () => {
      console.log('   Checking pending requests...');
      const pendingResult = await dispatch({
        verb: 'check-pending'
      });
      console.log('   Pending requests:', JSON.stringify(pendingResult, null, 2));

      console.log('   Checking pending for specific agent...');
      const pendingForAgent = await dispatch({
        verb: 'check-pending',
        agent_id: 'agent3'
      });
      console.log('   Pending for agent3:', JSON.stringify(pendingForAgent, null, 2));
    }, 500);

    // Let the pending request timeout
    await pendingPromise;

    console.log('\n=== Demo completed successfully! ===');

  } catch (error) {
    console.error('Demo error:', error);
  }
}

demo(); 