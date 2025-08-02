/**
 * DOM selectors for HubSpot chatbot elements
 * These selectors are discovered through manual analysis and may need updates
 */

const HUBSPOT_SELECTORS = {
  // Main chatbot widget
  widget: {
    container: '[data-test-id="chat-widget"]',
    launcher: '[data-test-id="chat-launcher"]',
    iframe: 'iframe[title*="chat"]',
    minimized: '[data-test-id="chat-widget-minimized"]',
    expanded: '[data-test-id="chat-widget-expanded"]'
  },

  // Chat interface elements
  chat: {
    container: '[data-test-id="chat-container"]',
    header: '[data-test-id="chat-header"]',
    messagesArea: '[data-test-id="chat-messages"]',
    inputArea: '[data-test-id="chat-input-area"]',
    input: '[data-test-id="chat-input"]',
    sendButton: '[data-test-id="chat-send-button"]',
    closeButton: '[data-test-id="chat-close-button"]',
    minimizeButton: '[data-test-id="chat-minimize-button"]'
  },

  // Message elements
  messages: {
    message: '[data-test-id="chat-message"]',
    botMessage: '[data-test-id="bot-message"]',
    userMessage: '[data-test-id="user-message"]',
    timestamp: '[data-test-id="message-timestamp"]',
    avatar: '[data-test-id="message-avatar"]',
    content: '[data-test-id="message-content"]',
    typing: '[data-test-id="typing-indicator"]'
  },

  // Interactive elements
  interactive: {
    quickReplies: '[data-test-id="quick-replies"]',
    quickReply: '[data-test-id="quick-reply"]',
    buttons: '[data-test-id="chat-button"]',
    links: '[data-test-id="chat-link"]',
    forms: '[data-test-id="chat-form"]',
    formField: '[data-test-id="form-field"]',
    submitButton: '[data-test-id="form-submit"]'
  },

  // Status indicators
  status: {
    online: '[data-test-id="agent-online"]',
    offline: '[data-test-id="agent-offline"]',
    typing: '[data-test-id="agent-typing"]',
    connecting: '[data-test-id="chat-connecting"]',
    connected: '[data-test-id="chat-connected"]',
    error: '[data-test-id="chat-error"]'
  },

  // Fallback selectors (generic CSS selectors as backup)
  fallback: {
    widget: '#hubspot-messages-iframe-container, .widget-container, [class*="chat-widget"]',
    iframe: 'iframe[src*="hubspot"], iframe[title*="chat"], iframe[title*="Chat"]',
    input: 'input[placeholder*="message"], textarea[placeholder*="message"], [contenteditable="true"]',
    sendButton: 'button[type="submit"], button[aria-label*="send"], [data-testid*="send"]',
    messages: '[class*="message"], [class*="chat-message"], [role="log"]',
    botMessage: '[class*="bot"], [class*="agent"], [data-from="bot"]',
    userMessage: '[class*="user"], [class*="visitor"], [data-from="user"]'
  }
};

/**
 * Alternative selectors to try if primary selectors fail
 * Based on common chatbot implementation patterns
 */
const ALTERNATIVE_SELECTORS = {
  // Common chatbot frameworks
  intercom: {
    widget: '.intercom-lightweight-app',
    launcher: '.intercom-launcher',
    iframe: '#intercom-frame'
  },
  
  drift: {
    widget: '#drift-widget',
    launcher: '.drift-open-chat',
    iframe: '#drift-frame-chat'
  },
  
  zendesk: {
    widget: '#webWidget',
    launcher: '.zEWidget-launcher',
    iframe: 'iframe[title="Widget chat window"]'
  },

  // Generic patterns
  generic: {
    widget: '[id*="chat"], [class*="chat"], [data-widget="chat"]',
    iframe: 'iframe[src*="chat"], iframe[title*="support"]',
    launcher: '[aria-label*="chat"], [title*="chat"], .chat-launcher'
  }
};

/**
 * Selector validation and fallback logic
 */
class SelectorManager {
  constructor() {
    this.primarySelectors = HUBSPOT_SELECTORS;
    this.fallbackSelectors = ALTERNATIVE_SELECTORS;
    this.discoveredSelectors = new Map();
  }

  /**
   * Get selector with fallback logic
   * @param {Object} page - Playwright page object
   * @param {string} category - Selector category (widget, chat, messages, etc.)
   * @param {string} element - Specific element name
   * @returns {Promise<string>} Working selector
   */
  async getSelector(page, category, element) {
    const primarySelector = this.primarySelectors[category]?.[element];
    
    if (primarySelector && await this.isElementVisible(page, primarySelector)) {
      return primarySelector;
    }

    // Try fallback selectors
    const fallbackSelector = this.primarySelectors.fallback[element];
    if (fallbackSelector && await this.isElementVisible(page, fallbackSelector)) {
      this.discoveredSelectors.set(`${category}.${element}`, fallbackSelector);
      return fallbackSelector;
    }

    // Try alternative framework selectors
    for (const [framework, selectors] of Object.entries(this.fallbackSelectors)) {
      const altSelector = selectors[element];
      if (altSelector && await this.isElementVisible(page, altSelector)) {
        this.discoveredSelectors.set(`${category}.${element}`, altSelector);
        return altSelector;
      }
    }

    throw new Error(`No working selector found for ${category}.${element}`);
  }

  /**
   * Check if element is visible on page
   * @param {Object} page - Playwright page object
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>}
   */
  async isElementVisible(page, selector) {
    try {
      const element = await page.locator(selector).first();
      return await element.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Discover and update selectors based on actual page structure
   * @param {Object} page - Playwright page object
   */
  async discoverSelectors(page) {
    const discoveries = {};
    
    // Look for chat widgets using common patterns
    const chatWidgetPatterns = [
      '[id*="chat"]',
      '[class*="chat"]',
      '[data-widget*="chat"]',
      'iframe[src*="chat"]',
      'iframe[title*="chat"]'
    ];

    for (const pattern of chatWidgetPatterns) {
      try {
        const elements = await page.locator(pattern).all();
        if (elements.length > 0) {
          discoveries.widget = pattern;
          break;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }

    return discoveries;
  }

  /**
   * Export discovered selectors for future use
   */
  exportDiscoveredSelectors() {
    return Object.fromEntries(this.discoveredSelectors);
  }
}

module.exports = {
  HUBSPOT_SELECTORS,
  ALTERNATIVE_SELECTORS,
  SelectorManager
};