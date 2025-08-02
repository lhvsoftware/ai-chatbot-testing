import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let chatbotResponses = new Counter('chatbot_responses');
export let timeouts = new Counter('timeouts');

// Test configuration
export let options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '3m', target: 25 },   // Ramp up to 25 users over 3 minutes
    { duration: '5m', target: 50 },   // Ramp up to 50 users over 5 minutes
    
    // Steady state
    { duration: '10m', target: 50 },  // Maintain 50 users for 10 minutes
    
    // Peak load
    { duration: '2m', target: 100 },  // Spike to 100 users
    { duration: '5m', target: 100 },  // Maintain peak for 5 minutes
    
    // Ramp down
    { duration: '3m', target: 25 },   // Ramp down to 25 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    // Response time thresholds
    'response_time': ['p(95)<5000', 'p(99)<10000'], // 95% under 5s, 99% under 10s
    'http_req_duration': ['p(95)<3000'],            // 95% of HTTP requests under 3s
    
    // Error rate thresholds
    'errors': ['rate<0.1'],                         // Error rate under 10%
    'http_req_failed': ['rate<0.05'],               // HTTP failure rate under 5%
    
    // Success rate thresholds
    'checks': ['rate>0.9'],                         // 90% of checks should pass
  },
};

// Test data - common chatbot scenarios
const TEST_SCENARIOS = [
  {
    category: 'greeting',
    messages: ['Hello', 'Hi there', 'Good morning', 'Hey'],
    weight: 30
  },
  {
    category: 'pricing_inquiry',
    messages: [
      'What are your pricing plans?',
      'How much does it cost?',
      'I want to know about pricing',
      'Can you tell me the price?'
    ],
    weight: 25
  },
  {
    category: 'product_info',
    messages: [
      'Tell me about your products',
      'What features do you offer?',
      'I need information about your services',
      'What can your platform do?'
    ],
    weight: 20
  },
  {
    category: 'support',
    messages: [
      'I need help',
      'I have a problem',
      'Can you assist me?',
      'I need support'
    ],
    weight: 15
  },
  {
    category: 'contact',
    messages: [
      'How can I contact sales?',
      'I want to speak to someone',
      'Can I talk to a human?',
      'Connect me with an agent'
    ],
    weight: 10
  }
];

// Function to get weighted random scenario
function getRandomScenario() {
  const totalWeight = TEST_SCENARIOS.reduce((sum, scenario) => sum + scenario.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const scenario of TEST_SCENARIOS) {
    random -= scenario.weight;
    if (random <= 0) {
      const messages = scenario.messages;
      return {
        category: scenario.category,
        message: messages[Math.floor(Math.random() * messages.length)]
      };
    }
  }
  
  // Fallback
  return {
    category: 'greeting',
    message: 'Hello'
  };
}

// Function to simulate chatbot API interaction
function simulateChatbotAPI(message, sessionId) {
  const payload = JSON.stringify({
    message: message,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    userAgent: 'k6-load-test',
    channel: 'web'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; k6-chatbot-test)',
      'Accept': 'application/json',
    },
    timeout: '15s', // 15 second timeout
  };

  // Note: Replace with actual HubSpot chatbot API endpoint
  // This is a placeholder - you'll need to discover the real endpoint
  const endpoint = __ENV.CHATBOT_API_URL || 'https://api.hubspot.com/conversations/v3/conversations/inbound';
  
  const startTime = Date.now();
  const response = http.post(endpoint, payload, params);
  const responseTime_ms = Date.now() - startTime;

  // Record custom metrics
  responseTime.add(responseTime_ms);
  
  // Check response
  const responseOK = check(response, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response has body': (r) => r.body && r.body.length > 0,
    'response time < 10s': (r) => r.timings.duration < 10000,
    'response time < 5s': (r) => r.timings.duration < 5000,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  if (!responseOK) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
    chatbotResponses.add(1);
  }

  if (response.timings.duration > 10000) {
    timeouts.add(1);
  }

  return response;
}

// Function to simulate realistic chatbot conversation
function simulateConversation(sessionId) {
  const conversationLength = Math.floor(Math.random() * 4) + 1; // 1-4 messages
  
  for (let i = 0; i < conversationLength; i++) {
    const scenario = getRandomScenario();
    
    console.log(`User ${__VU}, Iteration ${__ITER}: ${scenario.category} - "${scenario.message}"`);
    
    const response = simulateChatbotAPI(scenario.message, sessionId);
    
    // Realistic thinking time between messages
    const thinkTime = Math.random() * 3 + 1; // 1-4 seconds
    sleep(thinkTime);
    
    // If this is a pricing inquiry, might ask follow-up
    if (scenario.category === 'pricing_inquiry' && i === 0 && Math.random() > 0.7) {
      const followUp = [
        'Can you give me more details?',
        'What about discounts?',
        'Is there a free trial?'
      ];
      const followUpMessage = followUp[Math.floor(Math.random() * followUp.length)];
      
      sleep(1);
      simulateChatbotAPI(followUpMessage, sessionId);
    }
  }
}

// Main test function
export default function() {
  // Generate unique session ID for this user
  const sessionId = `session_${__VU}_${__ITER}_${Date.now()}`;
  
  // Add some randomness to user behavior
  const userBehavior = Math.random();
  
  if (userBehavior < 0.1) {
    // 10% of users just open and close without messaging
    sleep(Math.random() * 5 + 2); // Look around for 2-7 seconds
    return;
  }
  
  if (userBehavior < 0.3) {
    // 20% of users send just one message
    const scenario = getRandomScenario();
    simulateChatbotAPI(scenario.message, sessionId);
  } else {
    // 70% of users have a full conversation
    simulateConversation(sessionId);
  }
  
  // Random delay before next iteration (simulating user browsing)
  const browsePause = Math.random() * 10 + 5; // 5-15 seconds
  sleep(browsePause);
}

// Setup function - runs once before the test
export function setup() {
  console.log('🚀 Starting HubSpot Chatbot Load Test');
  console.log('📊 Test Configuration:');
  console.log(`   - Max Users: 100`);
  console.log(`   - Test Duration: ~32 minutes`);
  console.log(`   - API Endpoint: ${__ENV.CHATBOT_API_URL || 'Default endpoint'}`);
  console.log('');
  
  // Verify API endpoint is accessible
  const healthCheck = http.get(__ENV.CHATBOT_API_URL || 'https://www.hubspot.com');
  
  if (healthCheck.status !== 200) {
    console.warn(`⚠️ Warning: Health check failed (status: ${healthCheck.status})`);
  } else {
    console.log('✅ API endpoint is accessible');
  }
  
  return { startTime: Date.now() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  const testDuration = (Date.now() - data.startTime) / 1000 / 60; // minutes
  console.log('');
  console.log('📋 Load Test Complete!');
  console.log(`⏱️ Total Duration: ${testDuration.toFixed(1)} minutes`);
  console.log('');
  console.log('📈 Check the detailed results above for:');
  console.log('   - Response time percentiles');
  console.log('   - Error rates');
  console.log('   - Throughput metrics');
  console.log('   - Threshold violations');
}

// Additional test scenarios for specific load patterns
export function handleLoadSpike() {
  // Simulates sudden traffic spike (like from social media)
  const scenario = getRandomScenario();
  const sessionId = `spike_${__VU}_${Date.now()}`;
  
  // Rapid-fire messages to test system under pressure
  for (let i = 0; i < 3; i++) {
    simulateChatbotAPI(scenario.message, sessionId);
    sleep(0.5); // Very short delays during spike
  }
}

export function handleSustainedLoad() {
  // Simulates sustained business hours traffic
  const sessionId = `sustained_${__VU}_${Date.now()}`;
  
  // Longer, more realistic conversation
  simulateConversation(sessionId);
  
  // Longer pause between conversations
  sleep(Math.random() * 30 + 10); // 10-40 seconds
}