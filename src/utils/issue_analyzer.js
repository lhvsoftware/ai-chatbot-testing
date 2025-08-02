/**
 * Issue Analyzer for categorizing and managing chatbot testing issues
 */
class IssueAnalyzer {
  constructor() {
    this.issues = [];
    this.categories = {
      'ui_rendering': {
        description: 'Visual and rendering issues with chatbot interface',
        businessImpact: 'High - Users cannot see or interact with chatbot',
        severity: 'critical'
      },
      'core_functionality': {
        description: 'Basic chatbot operations not working',
        businessImpact: 'Critical - Chatbot completely non-functional',
        severity: 'critical'
      },
      'performance_consistency': {
        description: 'Inconsistent response times or performance',
        businessImpact: 'Medium - Poor user experience, potential abandonment',
        severity: 'moderate'
      },
      'response_quality': {
        description: 'Bot responses are irrelevant or unhelpful',
        businessImpact: 'High - Users get poor support, may not convert',
        severity: 'moderate'
      },
      'conversation_flow': {
        description: 'Issues with multi-turn conversations',
        businessImpact: 'Medium - Users cannot have complex interactions',
        severity: 'moderate'
      },
      'input_validation': {
        description: 'Problems handling various input types',
        businessImpact: 'Low to Medium - Edge cases may cause issues',
        severity: 'minor'
      },
      'accessibility': {
        description: 'Accessibility compliance issues',
        businessImpact: 'Medium - Excludes users with disabilities',
        severity: 'moderate'
      },
      'security': {
        description: 'Potential security vulnerabilities',
        businessImpact: 'Critical - Risk of data breach or exploitation',
        severity: 'critical'
      },
      'error_handling': {
        description: 'Poor error handling and recovery',
        businessImpact: 'Medium - Users may lose functionality during issues',
        severity: 'moderate'
      },
      'integration': {
        description: 'Issues with backend systems or third-party integrations',
        businessImpact: 'High - May affect lead capture or data flow',
        severity: 'high'
      },
      'mobile_compatibility': {
        description: 'Issues specific to mobile devices',
        businessImpact: 'High - Large portion of users on mobile',
        severity: 'high'
      },
      'browser_compatibility': {
        description: 'Issues specific to certain browsers',
        businessImpact: 'Medium - Affects subset of users',
        severity: 'moderate'
      }
    };
  }

  /**
   * Add a new issue to the analyzer
   * @param {Object} issue - Issue object
   * @param {string} issue.category - Issue category
   * @param {string} issue.severity - Issue severity (critical, high, moderate, minor)
   * @param {string} issue.description - Description of the issue
   * @param {string} issue.evidence - Evidence or details about the issue
   * @param {string} issue.impact - Business impact description
   * @param {string} issue.recommendation - Recommended fix or action
   */
  addIssue(issue) {
    const timestamp = new Date().toISOString();
    const issueId = this.generateIssueId();
    
    const enrichedIssue = {
      id: issueId,
      timestamp,
      category: issue.category,
      severity: issue.severity || this.categories[issue.category]?.severity || 'moderate',
      title: this.generateIssueTitle(issue),
      description: issue.description,
      evidence: issue.evidence,
      impact: issue.impact,
      recommendation: issue.recommendation,
      businessPriority: this.calculateBusinessPriority(issue),
      estimatedFixTime: this.estimateFixTime(issue),
      affectedUserPercentage: this.estimateAffectedUsers(issue)
    };

    this.issues.push(enrichedIssue);
    
    // Log critical issues immediately
    if (enrichedIssue.severity === 'critical') {
      console.error(`🚨 CRITICAL ISSUE: ${enrichedIssue.title}`);
    }

    return issueId;
  }

  /**
   * Generate a unique issue ID
   * @returns {string} Unique issue identifier
   */
  generateIssueId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ISSUE-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate a descriptive title for the issue
   * @param {Object} issue - Issue object
   * @returns {string} Generated title
   */
  generateIssueTitle(issue) {
    const categoryName = issue.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const severityPrefix = issue.severity === 'critical' ? '🚨' : 
                          issue.severity === 'high' ? '⚠️' : 
                          issue.severity === 'moderate' ? '⚡' : 'ℹ️';
    
    return `${severityPrefix} ${categoryName}: ${issue.description.substring(0, 60)}${issue.description.length > 60 ? '...' : ''}`;
  }

  /**
   * Calculate business priority based on severity and impact
   * @param {Object} issue - Issue object
   * @returns {number} Priority score (1-10, higher = more urgent)
   */
  calculateBusinessPriority(issue) {
    const severityScores = {
      'critical': 10,
      'high': 7,
      'moderate': 4,
      'minor': 2
    };

    const categoryMultipliers = {
      'core_functionality': 1.0,
      'security': 1.0,
      'ui_rendering': 0.9,
      'integration': 0.8,
      'mobile_compatibility': 0.8,
      'response_quality': 0.7,
      'performance_consistency': 0.6,
      'accessibility': 0.5,
      'input_validation': 0.4,
      'browser_compatibility': 0.4,
      'conversation_flow': 0.3,
      'error_handling': 0.3
    };

    const baseScore = severityScores[issue.severity] || 4;
    const multiplier = categoryMultipliers[issue.category] || 0.5;
    
    return Math.round(baseScore * multiplier);
  }

  /**
   * Estimate time required to fix the issue
   * @param {Object} issue - Issue object
   * @returns {string} Estimated fix time
   */
  estimateFixTime(issue) {
    const timeEstimates = {
      'ui_rendering': '2-4 hours',
      'core_functionality': '1-3 days',
      'performance_consistency': '4-8 hours',
      'response_quality': '1-2 days',
      'conversation_flow': '1-2 days',
      'input_validation': '2-6 hours',
      'accessibility': '4-12 hours',
      'security': '1-5 days',
      'error_handling': '4-8 hours',
      'integration': '1-3 days',
      'mobile_compatibility': '4-8 hours',
      'browser_compatibility': '2-6 hours'
    };

    return timeEstimates[issue.category] || '4-8 hours';
  }

  /**
   * Estimate percentage of users affected by this issue
   * @param {Object} issue - Issue object
   * @returns {string} Estimated affected user percentage
   */
  estimateAffectedUsers(issue) {
    const affectedPercentages = {
      'core_functionality': '100%',
      'ui_rendering': '100%',
      'security': '100%',
      'mobile_compatibility': '60-70%',
      'response_quality': '80-90%',
      'performance_consistency': '50-80%',
      'integration': '70-90%',
      'accessibility': '5-15%',
      'browser_compatibility': '10-30%',
      'conversation_flow': '30-50%',
      'input_validation': '5-20%',
      'error_handling': '20-40%'
    };

    return affectedPercentages[issue.category] || '10-30%';
  }

  /**
   * Get all issues
   * @returns {Array} Array of all issues
   */
  getIssues() {
    return this.issues;
  }

  /**
   * Get issues by severity
   * @param {string} severity - Severity level
   * @returns {Array} Filtered issues
   */
  getIssuesBySeverity(severity) {
    return this.issues.filter(issue => issue.severity === severity);
  }

  /**
   * Get issues by category
   * @param {string} category - Issue category
   * @returns {Array} Filtered issues
   */
  getIssuesByCategory(category) {
    return this.issues.filter(issue => issue.category === category);
  }

  /**
   * Get critical issues that need immediate attention
   * @returns {Array} Critical issues
   */
  getCriticalIssues() {
    return this.getIssuesBySeverity('critical');
  }

  /**
   * Get high-priority issues sorted by business priority
   * @returns {Array} High-priority issues
   */
  getHighPriorityIssues() {
    return this.issues
      .filter(issue => issue.businessPriority >= 7)
      .sort((a, b) => b.businessPriority - a.businessPriority);
  }

  /**
   * Generate issue summary statistics
   * @returns {Object} Summary statistics
   */
  generateSummary() {
    const total = this.issues.length;
    const bySeverity = {
      critical: this.getIssuesBySeverity('critical').length,
      high: this.getIssuesBySeverity('high').length,
      moderate: this.getIssuesBySeverity('moderate').length,
      minor: this.getIssuesBySeverity('minor').length
    };

    const byCategory = {};
    Object.keys(this.categories).forEach(category => {
      byCategory[category] = this.getIssuesByCategory(category).length;
    });

    const averagePriority = this.issues.length > 0 
      ? this.issues.reduce((sum, issue) => sum + issue.businessPriority, 0) / this.issues.length
      : 0;

    return {
      totalIssues: total,
      severityBreakdown: bySeverity,
      categoryBreakdown: byCategory,
      averageBusinessPriority: Math.round(averagePriority * 10) / 10,
      criticalIssueCount: bySeverity.critical,
      needsImmediateAttention: bySeverity.critical + bySeverity.high,
      overallRiskLevel: this.calculateOverallRiskLevel()
    };
  }

  /**
   * Calculate overall risk level based on issues found
   * @returns {string} Risk level (LOW, MEDIUM, HIGH, CRITICAL)
   */
  calculateOverallRiskLevel() {
    const summary = this.generateSummary();
    
    if (summary.severityBreakdown.critical > 0) {
      return 'CRITICAL';
    }
    
    if (summary.severityBreakdown.high > 2 || summary.totalIssues > 10) {
      return 'HIGH';
    }
    
    if (summary.severityBreakdown.high > 0 || summary.totalIssues > 5) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Generate actionable recommendations based on issues
   * @returns {Array} Array of prioritized recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const criticalIssues = this.getCriticalIssues();
    const highPriorityIssues = this.getHighPriorityIssues();

    // Immediate actions for critical issues
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Address Critical Issues',
        description: `${criticalIssues.length} critical issues require immediate attention`,
        issues: criticalIssues.map(issue => issue.id),
        estimatedTime: '1-3 days',
        businessImpact: 'Prevents major functionality failures and potential security risks'
      });
    }

    // High-priority recommendations
    if (highPriorityIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Resolve High-Priority Issues',
        description: `${highPriorityIssues.length} high-priority issues affecting user experience`,
        issues: highPriorityIssues.map(issue => issue.id),
        estimatedTime: '1-2 weeks',
        businessImpact: 'Improves user satisfaction and conversion rates'
      });
    }

    // Category-specific recommendations
    const categoryIssues = this.getIssuesByCategory('response_quality');
    if (categoryIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Improve Response Quality',
        description: 'Enhance chatbot training and response accuracy',
        issues: categoryIssues.map(issue => issue.id),
        estimatedTime: '2-4 weeks',
        businessImpact: 'Better user engagement and lead qualification'
      });
    }

    const accessibilityIssues = this.getIssuesByCategory('accessibility');
    if (accessibilityIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Enhance Accessibility',
        description: 'Implement WCAG compliance improvements',
        issues: accessibilityIssues.map(issue => issue.id),
        estimatedTime: '1-2 weeks',
        businessImpact: 'Ensures compliance and expands user accessibility'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'IMMEDIATE': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Export issues to various formats
   * @param {string} format - Export format (json, csv, summary)
   * @returns {string} Formatted export data
   */
  exportIssues(format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV();
      case 'summary':
        return this.exportSummary();
      case 'json':
      default:
        return JSON.stringify({
          summary: this.generateSummary(),
          issues: this.issues,
          recommendations: this.generateRecommendations(),
          categories: this.categories,
          exportTimestamp: new Date().toISOString()
        }, null, 2);
    }
  }

  /**
   * Export issues to CSV format
   * @returns {string} CSV formatted data
   */
  exportToCSV() {
    const headers = ['ID', 'Timestamp', 'Category', 'Severity', 'Title', 'Description', 'Evidence', 'Impact', 'Recommendation', 'Business Priority', 'Estimated Fix Time', 'Affected Users'];
    
    const rows = this.issues.map(issue => [
      issue.id,
      issue.timestamp,
      issue.category,
      issue.severity,
      issue.title.replace(/[",]/g, ''), // Remove emojis and commas for CSV
      issue.description.replace(/[",]/g, ''),
      issue.evidence.replace(/[",]/g, ''),
      issue.impact.replace(/[",]/g, ''),
      issue.recommendation.replace(/[",]/g, ''),
      issue.businessPriority,
      issue.estimatedFixTime,
      issue.affectedUserPercentage
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Export executive summary
   * @returns {string} Executive summary text
   */
  exportSummary() {
    const summary = this.generateSummary();
    const recommendations = this.generateRecommendations();
    
    return `
CHATBOT TESTING EXECUTIVE SUMMARY
Generated: ${new Date().toISOString()}

OVERALL ASSESSMENT: ${summary.overallRiskLevel} RISK

ISSUE SUMMARY:
- Total Issues Found: ${summary.totalIssues}
- Critical Issues: ${summary.severityBreakdown.critical}
- High Priority Issues: ${summary.severityBreakdown.high}
- Moderate Issues: ${summary.severityBreakdown.moderate}
- Minor Issues: ${summary.severityBreakdown.minor}

IMMEDIATE ACTIONS REQUIRED: ${summary.needsImmediateAttention}

TOP RECOMMENDATIONS:
${recommendations.slice(0, 3).map(rec => `- ${rec.action}: ${rec.description}`).join('\n')}

BUSINESS IMPACT:
${summary.criticalIssueCount > 0 ? '🚨 Critical functionality issues may prevent users from using the chatbot' : ''}
${summary.severityBreakdown.high > 0 ? '⚠️ High-priority issues may significantly impact user experience' : ''}
${summary.totalIssues === 0 ? '✅ No significant issues found - chatbot appears to be functioning well' : ''}
`.trim();
  }

  /**
   * Clear all issues
   */
  clearIssues() {
    this.issues = [];
  }

  /**
   * Remove specific issue by ID
   * @param {string} issueId - Issue ID to remove
   * @returns {boolean} Whether issue was removed
   */
  removeIssue(issueId) {
    const initialLength = this.issues.length;
    this.issues = this.issues.filter(issue => issue.id !== issueId);
    return this.issues.length < initialLength;
  }

  /**
   * Update issue status or details
   * @param {string} issueId - Issue ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Whether issue was updated
   */
  updateIssue(issueId, updates) {
    const issueIndex = this.issues.findIndex(issue => issue.id === issueId);
    if (issueIndex !== -1) {
      this.issues[issueIndex] = { ...this.issues[issueIndex], ...updates };
      return true;
    }
    return false;
  }
}

module.exports = { IssueAnalyzer };