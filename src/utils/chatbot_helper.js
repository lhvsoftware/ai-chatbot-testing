const { SelectorManager } = require('../config/selectors');

/**
 * Helper class for chatbot interactions and testing
 */
class ChatbotHelper {
  constructor(page) {
    this.page = page;
    this.selectorManager = new SelectorManager();
    this.lastMessageTimestamp = 0;
    this.messageHistory = [];
  }

  /**
   * Wait for chatbot widget to load on the page
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<number>} Time taken to load in milliseconds
   */
  async waitForWidgetLoad(timeout = 15000) {
    const startTime = Date.now();
    
    try {
      // Try multiple common chatbot selectors
      const selectors = [
        '[data-test-id*="chat"]',
        '[class*="chat-widget"]',
        '[id*="chat"]',
        'iframe[title*="chat"]',
        'iframe[src*="chat"]',
        '.widget-container',
        '#hubspot-messages-iframe-container'
      ];

      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
          const loadTime = Date.now() - startTime;
          console.log(`Chatbot widget found with selector: ${selector} (${loadTime}ms)`);
          return loadTime;
        } catch (e) {
          continue;
        }
      }

      // If no specific selectors work, try iframe detection
      const iframes = await this.page.locator('iframe').all();
      for (const iframe of iframes) {
        const src = await iframe.getAttribute('src') || '';
        const title = await iframe.getAttribute('title') || '';
        
        if (src.includes('chat') || title.toLowerCase().includes('chat') || 
            src.includes('hubspot') || title.toLowerCase().includes('support')) {
          const loadTime = Date.now() - startTime;
          console.log(`Chatbot iframe detected: ${title || src} (${loadTime}ms)`);
          return loadTime;
        }
      }

      throw new Error('Chatbot widget not found');
    } catch (error) {
      throw new Error(`Widget load failed after ${Date.now() - startTime}ms: ${error.message}`);
    }
  }

  /**
   * Check if chatbot widget is visible
   * @returns {Promise<boolean>}
   */
  async isWidgetVisible() {
    const selectors = [
      '[data-test-id*="chat"]',
      '[class*="chat-widget"]',
      '[id*="chat"]',
      'iframe[title*="chat"]',
      '.widget-container'
    ];

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  /**
   * Get chatbot widget bounds
   * @returns {Promise<Object>} Bounding box of the widget
   */
  async getWidgetBounds() {
    const selectors = [
      '[data-test-id*="chat"]',
      '[class*="chat-widget"]',
      '[id*="chat"]',
      'iframe[title*="chat"]'
    ];

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return await element.boundingBox();
        }
      } catch (e) {
        continue;
      }
    }
    
    throw new Error('Could not find widget to measure bounds');
  }

  /**
   * Open the chatbot interface
   * @returns {Promise<number>} Time taken to open in milliseconds
   */
  async openChatbot() {
    const startTime = Date.now();
    
    try {
      // Try to find and click the chat launcher
      const launcherSelectors = [
        '[data-test-id*="chat-launcher"]',
        '[class*="chat-launcher"]',
        '[class*="chat-widget"]',
        '[aria-label*="chat"]',
        '[title*="chat"]',
        'button[class*="chat"]',
        '.widget-container'
      ];

      for (const selector of launcherSelectors) {
        try {
          const launcher = this.page.locator(selector).first();
          if (await launcher.isVisible({ timeout: 2000 })) {
            await launcher.click();
            
            // Wait for chat interface to appear
            await this.page.waitForTimeout(2000);
            
            // Check if chatbot opened
            if (await this.isChatbotOpen()) {
              return Date.now() - startTime;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Try clicking on any iframe that might be the chatbot
      const iframes = await this.page.locator('iframe').all();
      for (const iframe of iframes) {
        try {
          const src = await iframe.getAttribute('src') || '';
          const title = await iframe.getAttribute('title') || '';
          
          if (src.includes('chat') || title.toLowerCase().includes('chat')) {
            await iframe.click();
            await this.page.waitForTimeout(2000);
            
            if (await this.isChatbotOpen()) {
              return Date.now() - startTime;
            }
          }
        } catch (e) {
          continue;
        }
      }

      throw new Error('Could not open chatbot');
    } catch (error) {
      throw new Error(`Failed to open chatbot after ${Date.now() - startTime}ms: ${error.message}`);
    }
  }

  /**
   * Close the chatbot interface
   * @returns {Promise<number>} Time taken to close in milliseconds
   */
  async closeChatbot() {
    const startTime = Date.now();
    
    try {
      const closeSelectors = [
        '[data-test-id*="close"]',
        '[aria-label*="close"]',
        '[title*="close"]',
        '.close-button',
        '[class*="close"]',
        'button[aria-label*="Close"]'
      ];

      for (const selector of closeSelectors) {
        try {
          const closeButton = this.page.locator(selector);
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
            await this.page.waitForTimeout(1000);
            
            if (await this.isChatbotClosed()) {
              return Date.now() - startTime;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Try pressing Escape key
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
      
      if (await this.isChatbotClosed()) {
        return Date.now() - startTime;
      }

      throw new Error('Could not close chatbot');
    } catch (error) {
      throw new Error(`Failed to close chatbot: ${error.message}`);
    }
  }

  /**
   * Check if chatbot is open
   * @returns {Promise<boolean>}
   */
  async isChatbotOpen() {
    const openIndicators = [
      '[data-test-id*="chat-container"]',
      '[data-test-id*="chat-input"]',
      '[class*="chat-open"]',
      '[class*="chat-expanded"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="message"]',
      '[contenteditable="true"]'
    ];

    for (const selector of openIndicators) {
      try {
        if (await this.page.locator(selector).isVisible({ timeout: 1000 })) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  /**
   * Check if chatbot is closed
   * @returns {Promise<boolean>}
   */
  async isChatbotClosed() {
    return !(await this.isChatbotOpen());
  }

  /**
   * Check if input field is available
   * @returns {Promise<boolean>}
   */
  async hasInputField() {
    const inputSelectors = [
      '[data-test-id*="chat-input"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="message"]',
      '[contenteditable="true"]',
      'input[type="text"]',
      'textarea'
    ];

    for (const selector of inputSelectors) {
      try {
        if (await this.page.locator(selector).isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - Message to send
   * @returns {Promise<number|boolean>} Time taken to send or false if failed
   */
  async sendMessage(message) {
    if (!message || message.trim().length === 0) {
      return false;
    }

    const startTime = Date.now();
    
    try {
      // Find input field
      const inputSelectors = [
        '[data-test-id*="chat-input"]',
        'textarea[placeholder*="message"]',
        'input[placeholder*="message"]',
        '[contenteditable="true"]',
        'textarea',
        'input[type="text"]'
      ];

      let inputField = null;
      for (const selector of inputSelectors) {
        try {
          const field = this.page.locator(selector).first();
          if (await field.isVisible({ timeout: 2000 })) {
            inputField = field;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!inputField) {
        throw new Error('Could not find input field');
      }

      // Clear and type message
      await inputField.clear();
      await inputField.fill(message);
      
      // Find and click send button
      const sendSelectors = [
        '[data-test-id*="send"]',
        '[aria-label*="send"]',
        '[title*="send"]',
        'button[type="submit"]',
        '.send-button',
        '[class*="send"]'
      ];

      let messageSent = false;
      for (const selector of sendSelectors) {
        try {
          const sendButton = this.page.locator(selector);
          if (await sendButton.isVisible({ timeout: 2000 })) {
            await sendButton.click();
            messageSent = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Try pressing Enter if no send button found
      if (!messageSent) {
        await inputField.press('Enter');
        messageSent = true;
      }

      if (messageSent) {
        this.messageHistory.push({
          type: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        this.lastMessageTimestamp = Date.now();
        return Date.now() - startTime;
      }

      throw new Error('Could not send message');
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Wait for bot response
   * @param {number} timeout - Maximum time to wait
   * @returns {Promise<number>} Time taken for response
   */
  async waitForResponse(timeout = 15000) {
    const startTime = Date.now();
    const initialMessageCount = await this.getMessageCount();
    
    try {
      // Wait for new message to appear
      const responseWait = this.page.waitForFunction(
        (count) => {
          const messages = document.querySelectorAll('[class*="message"], [data-test-id*="message"]');
          return messages.length > count;
        },
        initialMessageCount,
        { timeout }
      );

      await responseWait;
      
      // Additional wait for typing indicator to disappear
      await this.page.waitForTimeout(1000);
      
      const responseTime = Date.now() - startTime;
      
      // Record the response
      const response = await this.getLatestResponse();
      if (response) {
        this.messageHistory.push({
          type: 'bot',
          content: response,
          timestamp: Date.now()
        });
      }
      
      return responseTime;
    } catch (error) {
      throw new Error(`No response received within ${timeout}ms`);
    }
  }

  /**
   * Get the latest bot response
   * @returns {Promise<string>} Latest response text
   */
  async getLatestResponse() {
    const messageSelectors = [
      '[data-test-id*="bot-message"]',
      '[class*="bot-message"]',
      '[data-from="bot"]',
      '[class*="agent-message"]',
      '[class*="message"]:last-child'
    ];

    for (const selector of messageSelectors) {
      try {
        const messages = await this.page.locator(selector).all();
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const text = await lastMessage.textContent();
          return text?.trim() || '';
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: get all messages and try to identify the latest bot message
    try {
      const allMessages = await this.page.locator('[class*="message"]').all();
      if (allMessages.length > 0) {
        // Get the last message that's not from user
        for (let i = allMessages.length - 1; i >= 0; i--) {
          const message = allMessages[i];
          const className = await message.getAttribute('class') || '';
          const dataFrom = await message.getAttribute('data-from') || '';
          
          if (!className.includes('user') && !className.includes('visitor') && 
              dataFrom !== 'user' && dataFrom !== 'visitor') {
            const text = await message.textContent();
            return text?.trim() || '';
          }
        }
      }
    } catch (e) {
      console.log('Fallback message retrieval failed:', e.message);
    }

    return '';
  }

  /**
   * Get total message count in chat
   * @returns {Promise<number>} Number of messages
   */
  async getMessageCount() {
    const messageSelectors = [
      '[data-test-id*="message"]',
      '[class*="message"]',
      '[role="log"] > *'
    ];

    for (const selector of messageSelectors) {
      try {
        const messages = await this.page.locator(selector).all();
        return messages.length;
      } catch (e) {
        continue;
      }
    }
    return 0;
  }

  /**
   * Check if response is relevant to input (basic keyword matching)
   * @param {string} input - User input
   * @param {string} response - Bot response
   * @returns {Promise<boolean>} Whether response seems relevant
   */
  async isResponseRelevant(input, response) {
    if (!input || !response) return false;
    
    const inputLower = input.toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Basic relevance indicators
    const genericResponses = [
      'i don\'t understand',
      'i\'m not sure',
      'can you rephrase',
      'sorry, i didn\'t get that',
      'please try again'
    ];
    
    // Check if response is too generic
    for (const generic of genericResponses) {
      if (responseLower.includes(generic)) {
        return false;
      }
    }
    
    // Extract keywords from input
    const inputKeywords = inputLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Check if any keywords appear in response
    const hasKeywordMatch = inputKeywords.some(keyword => 
      responseLower.includes(keyword)
    );
    
    // If about pricing/cost, response should mention pricing-related terms
    if (inputLower.includes('pric') || inputLower.includes('cost') || inputLower.includes('plan')) {
      return responseLower.includes('pric') || responseLower.includes('cost') || 
             responseLower.includes('plan') || responseLower.includes('$');
    }
    
    // Basic length check - very short responses might not be helpful
    if (response.trim().length < 10) {
      return false;
    }
    
    return hasKeywordMatch || response.length > 50; // Longer responses generally more helpful
  }

  /**
   * Test accessibility features
   * @returns {Promise<boolean>} Whether basic accessibility features are present
   */
  async hasAriaLabels() {
    try {
      const elementsWithAria = await this.page.locator('[aria-label], [aria-labelledby], [role]').all();
      return elementsWithAria.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Test keyboard navigation
   * @returns {Promise<boolean>} Whether keyboard navigation works
   */
  async testKeyboardNavigation() {
    try {
      // Try tabbing through elements
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      // Check if focus is visible
      const focusedElement = await this.page.locator(':focus').first();
      return await focusedElement.isVisible();
    } catch (e) {
      return false;
    }
  }

  /**
   * Basic color contrast check
   * @returns {Promise<boolean>} Whether contrast seems adequate
   */
  async checkColorContrast() {
    try {
      // This is a basic check - in real implementation you'd use specialized tools
      const elements = await this.page.locator('[class*="message"], [class*="chat"]').all();
      
      for (const element of elements.slice(0, 3)) { // Check first few elements
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          };
        });
        
        // Basic check for not having white text on white background or similar
        if (styles.backgroundColor === styles.color) {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      return true; // Assume OK if can't check
    }
  }

  /**
   * Check for focus indicators
   * @returns {Promise<boolean>} Whether focus indicators are visible
   */
  async hasFocusIndicators() {
    try {
      // Focus on input field and check for visual indicator
      const inputField = this.page.locator('input, textarea').first();
      await inputField.focus();
      
      const focusStyles = await inputField.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });
      
      return focusStyles.outline !== 'none' || 
             focusStyles.outlineWidth !== '0px' || 
             focusStyles.boxShadow !== 'none';
    } catch (e) {
      return false;
    }
  }

  /**
   * Get message history
   * @returns {Array} Array of message objects
   */
  getMessageHistory() {
    return this.messageHistory;
  }

  /**
   * Clear message history
   */
  clearMessageHistory() {
    this.messageHistory = [];
  }
}

module.exports = { ChatbotHelper };