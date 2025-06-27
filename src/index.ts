// Export main API
export { dispatch } from './bank.js';

// Export individual handlers for advanced usage
export { 
  handleTake, 
  handleTakeBlocking, 
  handlePut, 
  handlePutBlocking, 
  handlePeek, 
  handleCheckPending 
} from './bank.js';

// Export types
export * from './types.js'; 