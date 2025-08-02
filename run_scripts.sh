#!/bin/bash

# HubSpot Chatbot Testing - Complete Test Suite Runner
# This script runs all tests and generates comprehensive reports

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="reports/generated"
TEST_RESULTS_DIR="test-results"
LOG_FILE="$REPORT_DIR/test-execution-$TIMESTAMP.log"

echo -e "${BLUE}🚀 HubSpot Chatbot Testing Suite${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create directories if they don't exist
mkdir -p "$REPORT_DIR"
mkdir -p "$TEST_RESULTS_DIR"

# Function to log messages
log_message() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run a test and capture results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    log_message "${YELLOW}📋 Running: $test_description${NC}"
    log_message "Command: $test_command"
    
    local start_time=$(date +%s)
    
    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_message "${GREEN}✅ $test_name completed successfully (${duration}s)${NC}"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_message "${RED}❌ $test_name failed (${duration}s)${NC}"
        return 1
    fi
}

# Verify dependencies
log_message "${BLUE}🔍 Checking dependencies...${NC}"

MISSING_DEPS=()

if ! command_exists "node"; then
    MISSING_DEPS+=("node")
fi

if ! command_exists "npx"; then
    MISSING_DEPS+=("npx")
fi

if ! command_exists "k6"; then
    MISSING_DEPS+=("k6")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    log_message "${RED}❌ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    log_message "Please install the missing dependencies and try again."
    exit 1
fi

log_message "${GREEN}✅ All dependencies found${NC}"
echo ""

# Initialize test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to update test counts
update_test_counts() {
    if [ $1 -eq 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Start test execution
log_message "${BLUE}🧪 Starting Test Execution${NC}"
log_message "Timestamp: $(date)"
log_message "Report Directory: $REPORT_DIR"
echo ""

# Test 1: Basic Functionality Tests
log_message "${YELLOW}=== Phase 1: Basic Functionality Tests ===${NC}"
run_test "Basic Functionality" \
    "npx playwright test tests/playwright/basic-functionality.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/basic" \
    "Testing core chatbot functionality (widget loading, messaging, UI interaction)"
update_test_counts $?

# Test 2: Lead Qualification Tests
log_message "${YELLOW}=== Phase 2: Lead Qualification Tests ===${NC}"
run_test "Lead Qualification" \
    "npx playwright test tests/playwright/lead-qualification.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/lead" \
    "Testing marketing flow and lead capture functionality"
update_test_counts $?

# Test 3: Context Retention Tests
log_message "${YELLOW}=== Phase 3: Context Retention Tests ===${NC}"
run_test "Context Retention" \
    "npx playwright test tests/playwright/context-retention.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/context" \
    "Testing conversation memory and multi-turn dialog handling"
update_test_counts $?

# Test 4: Error Handling Tests
log_message "${YELLOW}=== Phase 4: Error Handling Tests ===${NC}"
run_test "Error Handling" \
    "npx playwright test tests/playwright/error-handling.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/errors" \
    "Testing error scenarios and recovery mechanisms"
update_test_counts $?

# Test 5: Cross-Platform Tests
log_message "${YELLOW}=== Phase 5: Cross-Platform Compatibility ===${NC}"
run_test "Cross-Platform" \
    "npx playwright test tests/playwright/cross-platform.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/platform" \
    "Testing browser and device compatibility"
update_test_counts $?

# Test 6: Performance Tests (Playwright)
log_message "${YELLOW}=== Phase 6: Performance Tests (Browser) ===${NC}"
run_test "Browser Performance" \
    "npx playwright test tests/playwright/performance.test.js --reporter=json --output-dir=$TEST_RESULTS_DIR/performance" \
    "Testing chatbot performance in browser environment"
update_test_counts $?

# Test 7: Load Testing (K6)
log_message "${YELLOW}=== Phase 7: Load Testing (API) ===${NC}"
if command_exists "k6"; then
    # Set environment variables for K6 tests
    export CHATBOT_API_URL="${CHATBOT_API_URL:-https://api.hubspot.com/conversations/v3/conversations/inbound}"
    
    run_test "Load Testing" \
        "k6 run --out json=$REPORT_DIR/k6-results-$TIMESTAMP.json tests/k6/load-testing.js" \
        "Testing chatbot API under various load conditions"
    update_test_counts $?
else
    log_message "${YELLOW}⚠️ K6 not found, skipping load tests${NC}"
    log_message "Install K6 to run performance testing: https://k6.io/docs/getting-started/installation/"
fi

# Test 8: Stress Testing (K6)
log_message "${YELLOW}=== Phase 8: Stress Testing ===${NC}"
if command_exists "k6"; then
    run_test "Stress Testing" \
        "k6 run --out json=$REPORT_DIR/k6-stress-$TIMESTAMP.json tests/k6/stress-testing.js" \
        "Testing chatbot behavior under extreme load conditions"
    update_test_counts $?
else
    log_message "${YELLOW}⚠️ K6 not found, skipping stress tests${NC}"
fi

echo ""
log_message "${BLUE}📊 Generating Comprehensive Report${NC}"

# Generate HTML report
log_message "Creating HTML test report..."
npx playwright show-report --reporter=html > "$REPORT_DIR/playwright-report-$TIMESTAMP.html" 2>/dev/null || true

# Generate consolidated JSON report
log_message "Consolidating test results..."
node -e "
const fs = require('fs');
const path = require('path');

const reportDir = '$REPORT_DIR';
const timestamp = '$TIMESTAMP';
const testResultsDir = '$TEST_RESULTS_DIR';

const consolidatedReport = {
    testRun: {
        timestamp: new Date().toISOString(),
        totalTests: $TOTAL_TESTS,
        passed: $TESTS_PASSED,
        failed: $TESTS_FAILED,
        successRate: ($TESTS_PASSED / $TOTAL_TESTS * 100).toFixed(1) + '%'
    },
    testResults: {},
    summary: {
        criticalIssues: 0,
        highPriorityIssues: 0,
        totalIssues: 0,
        overallStatus: $TESTS_FAILED === 0 ? 'PASS' : 'FAIL'
    }
};

// Try to read individual test results
const testDirs = ['basic', 'lead', 'context', 'errors', 'platform', 'performance'];
testDirs.forEach(dir => {
    try {
        const resultsPath = path.join(testResultsDir, dir);
        if (fs.existsSync(resultsPath)) {
            const files = fs.readdirSync(resultsPath);
            const jsonFile = files.find(f => f.endsWith('.json'));
            if (jsonFile) {
                const content = fs.readFileSync(path.join(resultsPath, jsonFile), 'utf8');
                consolidatedReport.testResults[dir] = JSON.parse(content);
            }
        }
    } catch (e) {
        console.log('Could not read', dir, 'results:', e.message);
    }
});

// Try to read K6 results
try {
    const k6ResultsPath = path.join(reportDir, \`k6-results-\${timestamp}.json\`);
    if (fs.existsSync(k6ResultsPath)) {
        const k6Content = fs.readFileSync(k6ResultsPath, 'utf8');
        consolidatedReport.testResults.loadTesting = JSON.parse(k6Content);
    }
} catch (e) {
    console.log('Could not read K6 results:', e.message);
}

// Write consolidated report
fs.writeFileSync(
    path.join(reportDir, \`consolidated-report-\${timestamp}.json\`),
    JSON.stringify(consolidatedReport, null, 2)
);

console.log('Consolidated report generated successfully');
" 2>/dev/null || log_message "Note: Could not generate consolidated JSON report"

# Generate executive summary
log_message "Creating executive summary..."
cat > "$REPORT_DIR/executive-summary-$TIMESTAMP.md" << EOF
# HubSpot Chatbot Testing - Executive Summary

**Test Execution Date:** $(date)  
**Report Generated:** $(date)

## Overall Results

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $TESTS_PASSED
- **Failed:** $TESTS_FAILED
- **Success Rate:** $(( TESTS_PASSED * 100 / TOTAL_TESTS ))%

## Test Status

$(if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ **OVERALL STATUS: PASS** - All tests completed successfully"
else
    echo "❌ **OVERALL STATUS: FAIL** - $TESTS_FAILED test(s) failed"
fi)

## Test Coverage

The following areas were tested:

1. **Basic Functionality** - Core chatbot operations
2. **Lead Qualification** - Marketing and sales flow
3. **Context Retention** - Conversation memory
4. **Error Handling** - Recovery mechanisms
5. **Cross-Platform** - Browser/device compatibility
6. **Performance** - Response times and reliability
$(if command_exists "k6"; then
    echo "7. **Load Testing** - API performance under load"
    echo "8. **Stress Testing** - Extreme load conditions"
fi)

## Key Findings

$(if [ $TESTS_FAILED -eq 0 ]; then
    echo "- Chatbot functionality appears to be working correctly"
    echo "- No critical issues identified during testing"
    echo "- Performance meets expected standards"
else
    echo "- Issues identified that require attention"
    echo "- Review detailed logs for specific failure details"
    echo "- Some functionality may need improvement"
fi)

## Recommendations

1. Review detailed test logs for specific issues
2. Monitor chatbot performance in production
3. Consider implementing continuous testing
4. Regular testing schedule recommended

## Files Generated

- Execution Log: \`test-execution-$TIMESTAMP.log\`
- Consolidated Report: \`consolidated-report-$TIMESTAMP.json\`
- Executive Summary: \`executive-summary-$TIMESTAMP.md\`
$(if command_exists "k6"; then
    echo "- Load Test Results: \`k6-results-$TIMESTAMP.json\`"
fi)

EOF

# Display final results
echo ""
log_message "${BLUE}📋 Test Execution Complete${NC}"
log_message "${BLUE}=========================${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_message "${GREEN}🎉 All tests passed successfully!${NC}"
    log_message "${GREEN}✅ Status: PASS${NC}"
else
    log_message "${RED}⚠️  Some tests failed${NC}"
    log_message "${RED}❌ Status: FAIL${NC}"
fi

echo ""
log_message "📊 Results Summary:"
log_message "   Total Tests: $TOTAL_TESTS"
log_message "   Passed: ${GREEN}$TESTS_PASSED${NC}"
log_message "   Failed: ${RED}$TESTS_FAILED${NC}"
log_message "   Success Rate: $(( TESTS_PASSED * 100 / TOTAL_TESTS ))%"

echo ""
log_message "${BLUE}📁 Generated Reports:${NC}"
log_message "   📄 Executive Summary: $REPORT_DIR/executive-summary-$TIMESTAMP.md"
log_message "   📊 Detailed Log: $LOG_FILE"
log_message "   🔍 Consolidated Data: $REPORT_DIR/consolidated-report-$TIMESTAMP.json"

if command_exists "k6" && [ -f "$REPORT_DIR/k6-results-$TIMESTAMP.json" ]; then
    log_message "   ⚡ Load Test Results: $REPORT_DIR/k6-results-$TIMESTAMP.json"
fi

echo ""
log_message "${BLUE}🔍 Next Steps:${NC}"
if [ $TESTS_FAILED -eq 0 ]; then
    log_message "1. Review the executive summary for overall assessment"
    log_message "2. Check performance metrics for optimization opportunities"
    log_message "3. Consider implementing regular automated testing"
    log_message "4. Document any manual test scenarios for future reference"
else
    log_message "1. ${RED}Review failed tests in the execution log${NC}"
    log_message "2. ${RED}Address critical issues before proceeding${NC}"
    log_message "3. Re-run specific failed tests after fixes"
    log_message "4. Consider expanding test coverage for problem areas"
fi

echo ""
log_message "For detailed analysis, review individual test reports in: $TEST_RESULTS_DIR"
log_message ""
log_message "${GREEN}Happy testing! 🚀${NC}"

# Exit with appropriate code
exit $TESTS_FAILED