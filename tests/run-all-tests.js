/**
 * TEST RUNNER: Run all Blue Sneaker Landing Page tests
 *
 * Runs all test suites in sequence and generates comprehensive report
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TESTS_DIR = __dirname;
const REPORT_PATH = path.join(TESTS_DIR, 'test-report.html');
const JSON_REPORT_PATH = path.join(TESTS_DIR, 'test-report.json');

// Test files in order of execution
const TEST_SUITES = [
  {
    name: 'Backend API Test',
    file: 'test-backend.js',
    description: 'Tests backend API endpoints, pool status, and response times'
  },
  {
    name: 'Integration Test',
    file: 'test-integration.js',
    description: 'Tests complete integration from landing page to SimpleSwap'
  },
  {
    name: 'Visual Test',
    file: 'test-visual.js',
    description: 'Tests visual elements, responsive design, and UI functionality'
  },
  {
    name: 'User Flow Test',
    file: 'test-flow.js',
    description: 'Tests complete user journey from landing to purchase'
  }
];

/**
 * Run a single test file
 */
function runTest(testFile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log('═'.repeat(60));

    const testProcess = spawn('node', [path.join(TESTS_DIR, testFile)], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    testProcess.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;

      resolve({
        testFile,
        exitCode: code,
        passed: code === 0,
        duration,
        stdout,
        stderr
      });
    });

    testProcess.on('error', (error) => {
      const duration = Date.now() - startTime;

      resolve({
        testFile,
        exitCode: 1,
        passed: false,
        duration,
        stdout,
        stderr: stderr + '\n' + error.message
      });
    });
  });
}

/**
 * Parse test output for statistics
 */
function parseTestOutput(output) {
  const stats = {
    passed: 0,
    failed: 0,
    total: 0,
    successRate: 0
  };

  // Look for summary patterns
  const passedMatch = output.match(/✅ Passed:\s*(\d+)/);
  const failedMatch = output.match(/❌ Failed:\s*(\d+)/);
  const totalMatch = output.match(/📊 Total:\s*(\d+)/);
  const successMatch = output.match(/🎯 Success Rate:\s*(\d+)%/);

  if (passedMatch) stats.passed = parseInt(passedMatch[1]);
  if (failedMatch) stats.failed = parseInt(failedMatch[1]);
  if (totalMatch) stats.total = parseInt(totalMatch[1]);
  if (successMatch) stats.successRate = parseInt(successMatch[1]);

  return stats;
}

/**
 * Generate HTML report
 */
async function generateHTMLReport(results, totalDuration) {
  const timestamp = new Date().toISOString();
  const overallPassed = results.every(r => r.passed);

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  results.forEach(result => {
    const stats = parseTestOutput(result.stdout);
    totalTests += stats.total;
    totalPassed += stats.passed;
    totalFailed += stats.failed;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blue Sneaker Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .timestamp {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat-card.passed .value { color: #10b981; }
    .stat-card.failed .value { color: #ef4444; }
    .stat-card.duration .value { color: #3b82f6; }
    .test-suite {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-suite.passed {
      border-left: 4px solid #10b981;
    }
    .test-suite.failed {
      border-left: 4px solid #ef4444;
    }
    .test-suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .test-suite-title {
      font-size: 20px;
      font-weight: 600;
    }
    .test-suite-status {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .test-suite-status.passed {
      background: #d1fae5;
      color: #065f46;
    }
    .test-suite-status.failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .test-suite-description {
      color: #666;
      margin-bottom: 12px;
    }
    .test-suite-stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #666;
    }
    .test-output {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin-top: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    .toggle-output {
      background: #f3f4f6;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 12px;
    }
    .toggle-output:hover {
      background: #e5e7eb;
    }
    .footer {
      text-align: center;
      color: #666;
      margin-top: 40px;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Blue Sneaker Test Report</h1>
      <div class="timestamp">Generated: ${new Date(timestamp).toLocaleString()}</div>
    </div>

    <div class="summary">
      <div class="stat-card passed">
        <div class="label">Tests Passed</div>
        <div class="value">${totalPassed}</div>
      </div>
      <div class="stat-card failed">
        <div class="label">Tests Failed</div>
        <div class="value">${totalFailed}</div>
      </div>
      <div class="stat-card">
        <div class="label">Success Rate</div>
        <div class="value">${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%</div>
      </div>
      <div class="stat-card duration">
        <div class="label">Total Duration</div>
        <div class="value">${(totalDuration / 1000).toFixed(1)}s</div>
      </div>
    </div>

    ${results.map((result, index) => {
      const suite = TEST_SUITES[index];
      const stats = parseTestOutput(result.stdout);

      return `
        <div class="test-suite ${result.passed ? 'passed' : 'failed'}">
          <div class="test-suite-header">
            <div class="test-suite-title">${suite.name}</div>
            <div class="test-suite-status ${result.passed ? 'passed' : 'failed'}">
              ${result.passed ? '✅ PASSED' : '❌ FAILED'}
            </div>
          </div>
          <div class="test-suite-description">${suite.description}</div>
          <div class="test-suite-stats">
            <span>✅ ${stats.passed} passed</span>
            <span>❌ ${stats.failed} failed</span>
            <span>⏱️ ${(result.duration / 1000).toFixed(2)}s</span>
            <span>📊 ${stats.successRate}% success</span>
          </div>
          <button class="toggle-output" onclick="toggleOutput('output-${index}')">
            Toggle Output
          </button>
          <div id="output-${index}" class="test-output" style="display: none;">
            <pre>${escapeHtml(result.stdout)}</pre>
          </div>
        </div>
      `;
    }).join('')}

    <div class="footer">
      <p>Blue Sneaker Landing Page Test Suite v1.0</p>
      <p style="margin-top: 8px; font-size: 14px;">
        Site: ${process.env.SITE_URL || 'http://localhost:8080'} |
        Backend: ${process.env.BACKEND_API || 'https://simpleswap-automation-1.onrender.com'}
      </p>
    </div>
  </div>

  <script>
    function toggleOutput(id) {
      const element = document.getElementById(id);
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  </script>
</body>
</html>`;

  await fs.writeFile(REPORT_PATH, html, 'utf-8');
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate JSON report
 */
async function generateJSONReport(results, totalDuration) {
  const report = {
    timestamp: new Date().toISOString(),
    totalDuration,
    environment: {
      siteUrl: process.env.SITE_URL || 'http://localhost:8080',
      backendApi: process.env.BACKEND_API || 'https://simpleswap-automation-1.onrender.com'
    },
    summary: {
      totalSuites: results.length,
      passedSuites: results.filter(r => r.passed).length,
      failedSuites: results.filter(r => r.passed === false).length
    },
    suites: results.map((result, index) => ({
      name: TEST_SUITES[index].name,
      file: TEST_SUITES[index].file,
      passed: result.passed,
      duration: result.duration,
      exitCode: result.exitCode,
      stats: parseTestOutput(result.stdout)
    }))
  };

  await fs.writeFile(JSON_REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  BLUE SNEAKER LANDING PAGE - COMPREHENSIVE TEST SUITE   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Environment Configuration:');
  console.log(`  Site URL: ${process.env.SITE_URL || 'http://localhost:8080 (default)'}`);
  console.log(`  Backend API: ${process.env.BACKEND_API || 'https://simpleswap-automation-1.onrender.com (default)'}`);
  console.log(`\nRunning ${TEST_SUITES.length} test suites...\n`);

  const startTime = Date.now();
  const results = [];

  // Run each test suite
  for (const suite of TEST_SUITES) {
    const result = await runTest(suite.file);
    results.push(result);
  }

  const totalDuration = Date.now() - startTime;

  // Generate reports
  console.log('\n' + '═'.repeat(60));
  console.log('Generating reports...');
  console.log('═'.repeat(60) + '\n');

  try {
    await generateHTMLReport(results, totalDuration);
    console.log(`✅ HTML report generated: ${REPORT_PATH}`);
  } catch (error) {
    console.error('❌ Failed to generate HTML report:', error.message);
  }

  try {
    await generateJSONReport(results, totalDuration);
    console.log(`✅ JSON report generated: ${JSON_REPORT_PATH}`);
  } catch (error) {
    console.error('❌ Failed to generate JSON report:', error.message);
  }

  // Print final summary
  const passedSuites = results.filter(r => r.passed).length;
  const failedSuites = results.length - passedSuites;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Test Suites:  ${passedSuites} passed, ${failedSuites} failed, ${results.length} total`);
  console.log(`Duration:     ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Status:       ${failedSuites === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

  console.log('Reports:');
  console.log(`  📄 HTML: ${REPORT_PATH}`);
  console.log(`  📄 JSON: ${JSON_REPORT_PATH}\n`);

  // Individual suite results
  console.log('Individual Results:');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`  ${icon} ${TEST_SUITES[index].name} (${duration}s)`);
  });

  console.log('\n' + '═'.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(failedSuites === 0 ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
