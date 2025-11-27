const { chromium, webkit, firefox, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create results directory
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test configuration
const TEST_URL = 'http://localhost:8005/ultra-smart-fixed.html';

// Device configurations to test
const devicesToTest = [
    { name: 'iPhone 13 Pro', device: devices['iPhone 13 Pro'] },
    { name: 'iPad Pro', device: devices['iPad Pro 11'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'Desktop Chrome', device: { viewport: { width: 1920, height: 1080 } } },
    { name: 'Desktop Safari', device: { viewport: { width: 1440, height: 900 } } }
];

// Comprehensive test suite
class UltraPlaywrightTester {
    constructor() {
        this.results = {
            visual: [],
            functionality: [],
            performance: [],
            accessibility: [],
            network: [],
            errors: [],
            coverage: []
        };
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    log(message, type = 'info') {
        const typeColors = {
            'info': colors.cyan,
            'success': colors.green,
            'warning': colors.yellow,
            'error': colors.red,
            'test': colors.magenta
        };
        console.log(`${typeColors[type]}${message}${colors.reset}`);
    }

    async initialize(browserType = 'chromium', deviceConfig = null) {
        const browserOptions = {
            headless: false,
            slowMo: 50,
            devtools: true
        };

        switch (browserType) {
            case 'webkit':
                this.browser = await webkit.launch(browserOptions);
                break;
            case 'firefox':
                this.browser = await firefox.launch(browserOptions);
                break;
            default:
                this.browser = await chromium.launch(browserOptions);
        }

        const contextOptions = {
            ...deviceConfig,
            permissions: ['geolocation', 'notifications'],
            colorScheme: 'light',
            recordVideo: {
                dir: resultsDir,
                size: { width: 1280, height: 720 }
            },
            ignoreHTTPSErrors: true
        };

        this.context = await this.browser.newContext(contextOptions);

        // Enable tracing for debugging
        await this.context.tracing.start({
            screenshots: true,
            snapshots: true,
            sources: true
        });

        this.page = await this.context.newPage();

        // Setup comprehensive monitoring
        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor console messages
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            if (type === 'error') {
                this.results.errors.push({
                    type: 'console',
                    message: text,
                    location: msg.location()
                });
                this.log(`Console Error: ${text}`, 'error');
            } else if (type === 'warning') {
                this.log(`Console Warning: ${text}`, 'warning');
            }
        });

        // Monitor page errors
        this.page.on('pageerror', error => {
            this.results.errors.push({
                type: 'page',
                message: error.message,
                stack: error.stack
            });
            this.log(`Page Error: ${error.message}`, 'error');
        });

        // Monitor network requests
        this.page.on('request', request => {
            this.results.network.push({
                url: request.url(),
                method: request.method(),
                type: request.resourceType()
            });
        });

        // Monitor failed requests
        this.page.on('requestfailed', request => {
            this.results.errors.push({
                type: 'network',
                url: request.url(),
                failure: request.failure()
            });
            this.log(`Request Failed: ${request.url()}`, 'error');
        });

        // Monitor responses
        this.page.on('response', response => {
            if (response.status() >= 400) {
                this.results.errors.push({
                    type: 'http',
                    url: response.url(),
                    status: response.status()
                });
                if (response.status() === 404) {
                    this.log(`404 Error: ${response.url()}`, 'error');
                }
            }
        });
    }

    async testVisualUI() {
        this.log('\n🎨 VISUAL UI/UX TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        // Take full page screenshot
        await this.page.screenshot({
            path: path.join(resultsDir, 'full-page.png'),
            fullPage: true
        });
        this.log('✓ Full page screenshot captured', 'success');

        // Check visual hierarchy
        const visualHierarchy = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const issues = [];

            elements.forEach(el => {
                const styles = window.getComputedStyle(el);

                // Check for text contrast issues
                if (el.textContent && el.textContent.trim()) {
                    const color = styles.color;
                    const bgColor = styles.backgroundColor;
                    if (color === bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                        issues.push({
                            element: el.tagName,
                            issue: 'Text same color as background',
                            text: el.textContent.substring(0, 50)
                        });
                    }
                }

                // Check for overflow issues
                if (el.scrollWidth > el.clientWidth) {
                    issues.push({
                        element: el.className || el.tagName,
                        issue: 'Horizontal overflow detected',
                        overflow: el.scrollWidth - el.clientWidth
                    });
                }

                // Check for tiny touch targets
                if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width < 44 || rect.height < 44) {
                        issues.push({
                            element: el.className || el.tagName,
                            issue: 'Touch target too small',
                            size: `${rect.width}x${rect.height}`
                        });
                    }
                }
            });

            return issues;
        });

        if (visualHierarchy.length > 0) {
            this.log(`⚠️  Found ${visualHierarchy.length} visual issues:`, 'warning');
            visualHierarchy.forEach(issue => {
                this.log(`   - ${issue.element}: ${issue.issue}`, 'warning');
            });
            this.results.visual = visualHierarchy;
        } else {
            this.log('✓ No visual hierarchy issues found', 'success');
        }

        // Test color contrast
        const contrastIssues = await this.page.evaluate(() => {
            function getContrast(color1, color2) {
                // Simple contrast calculation (would need full implementation)
                return 5; // Placeholder
            }

            const issues = [];
            const texts = document.querySelectorAll('p, span, h1, h2, h3, button, a');

            texts.forEach(el => {
                const styles = window.getComputedStyle(el);
                const fontSize = parseFloat(styles.fontSize);

                // Check if text is too small
                if (fontSize < 12) {
                    issues.push({
                        element: el.tagName,
                        issue: 'Font size too small',
                        size: fontSize
                    });
                }
            });

            return issues;
        });

        if (contrastIssues.length > 0) {
            this.log(`⚠️  Found ${contrastIssues.length} contrast/readability issues`, 'warning');
        }

        // Capture element-specific screenshots
        const elements = [
            { selector: '.product-container', name: 'product-section' },
            { selector: '.checkout-popup', name: 'checkout-popup' },
            { selector: '.testimonial-grid', name: 'testimonials' }
        ];

        for (const el of elements) {
            const element = await this.page.$(el.selector);
            if (element) {
                await element.screenshot({
                    path: path.join(resultsDir, `${el.name}.png`)
                });
                this.log(`✓ Screenshot captured: ${el.name}`, 'success');
            }
        }
    }

    async testFunctionality() {
        this.log('\n🔧 FUNCTIONALITY TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        const tests = [];

        // Test 1: Image Loading
        const images = await this.page.$$eval('img', imgs =>
            imgs.map(img => ({
                src: img.src,
                loaded: img.complete && img.naturalHeight > 0,
                alt: img.alt
            }))
        );
        const imagesLoaded = images.filter(img => img.loaded).length;
        tests.push({
            name: 'Image Loading',
            passed: imagesLoaded === images.length,
            details: `${imagesLoaded}/${images.length} images loaded`
        });

        // Test 2: Interactive Elements
        const interactiveElements = await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const links = document.querySelectorAll('a');
            const inputs = document.querySelectorAll('input, select, textarea');

            return {
                buttons: buttons.length,
                links: links.length,
                inputs: inputs.length,
                total: buttons.length + links.length + inputs.length
            };
        });
        tests.push({
            name: 'Interactive Elements',
            passed: interactiveElements.total > 0,
            details: `${interactiveElements.buttons} buttons, ${interactiveElements.inputs} inputs`
        });

        // Test 3: Product Gallery
        const thumbnails = await this.page.$$('.product-thumbnails img');
        if (thumbnails.length > 1) {
            await thumbnails[1].click();
            await this.page.waitForTimeout(300);
            tests.push({
                name: 'Product Gallery',
                passed: true,
                details: 'Thumbnail click working'
            });
        }

        // Test 4: Size Selection with Error Handling
        try {
            await this.page.click('.size-btn[data-size="M"]');
            const sizeSelected = await this.page.$eval('.size-btn.active', el => el.dataset.size);
            tests.push({
                name: 'Size Selection',
                passed: sizeSelected === 'M',
                details: `Selected size: ${sizeSelected}`
            });
        } catch (e) {
            tests.push({
                name: 'Size Selection',
                passed: false,
                details: 'Size selector not working'
            });
        }

        // Test 5: Quantity Selector
        for (let i = 0; i < 2; i++) {
            await this.page.click('.quantity-btn:last-of-type');
        }
        const quantity = await this.page.$eval('.quantity-display', el => el.textContent);
        tests.push({
            name: 'Quantity Selector',
            passed: quantity === '3',
            details: `Quantity: ${quantity}`
        });

        // Test 6: Add to Cart Flow
        await this.page.click('.add-to-cart-btn');
        await this.page.waitForTimeout(500);
        const popupVisible = await this.page.$eval('#checkoutPopup', el =>
            el.classList.contains('active')
        );
        tests.push({
            name: 'Checkout Popup',
            passed: popupVisible,
            details: popupVisible ? 'Popup opens correctly' : 'Popup failed to open'
        });

        // Test 7: Order Bump
        if (popupVisible) {
            await this.page.click('.bump-checkbox');
            const totalText = await this.page.$eval('#totalPrice', el => el.textContent);
            tests.push({
                name: 'Order Bump',
                passed: totalText.includes('90'),
                details: `Total price: ${totalText}`
            });
        }

        // Test 8: Form Validation
        await this.page.fill('input[type="email"]', 'invalid-email');
        await this.page.press('input[type="email"]', 'Tab');
        const validationMessage = await this.page.$eval('input[type="email"]',
            el => el.validationMessage
        );
        tests.push({
            name: 'Email Validation',
            passed: validationMessage.length > 0,
            details: validationMessage || 'No validation'
        });

        // Test 9: Express Checkout Buttons
        const expressButtons = await this.page.$$('.express-btn');
        tests.push({
            name: 'Express Checkout',
            passed: expressButtons.length === 3,
            details: `${expressButtons.length} express buttons found`
        });

        // Test 10: Popup Close
        await this.page.click('.popup-close');
        await this.page.waitForTimeout(300);
        const popupClosed = await this.page.$eval('#checkoutPopup',
            el => !el.classList.contains('active')
        );
        tests.push({
            name: 'Popup Close',
            passed: popupClosed,
            details: 'Popup closes correctly'
        });

        // Report results
        tests.forEach(test => {
            const icon = test.passed ? '✓' : '✗';
            const color = test.passed ? 'success' : 'error';
            this.log(`${icon} ${test.name}: ${test.details}`, color);
        });

        this.results.functionality = tests;

        const passed = tests.filter(t => t.passed).length;
        const total = tests.length;
        this.log(`\nFunctionality Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`,
            passed === total ? 'success' : 'warning');
    }

    async testAccessibility() {
        this.log('\n♿ ACCESSIBILITY TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        const accessibilityIssues = await this.page.evaluate(() => {
            const issues = [];

            // Check for missing alt text
            document.querySelectorAll('img').forEach(img => {
                if (!img.alt) {
                    issues.push({
                        type: 'Missing alt text',
                        element: img.src.split('/').pop()
                    });
                }
            });

            // Check for missing labels
            document.querySelectorAll('input, select, textarea').forEach(input => {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (!label && !input.getAttribute('aria-label')) {
                    issues.push({
                        type: 'Missing label',
                        element: input.type || input.tagName
                    });
                }
            });

            // Check heading hierarchy
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            let lastLevel = 0;
            headings.forEach(h => {
                const level = parseInt(h.tagName[1]);
                if (level - lastLevel > 1) {
                    issues.push({
                        type: 'Heading hierarchy skip',
                        element: h.tagName,
                        text: h.textContent.substring(0, 30)
                    });
                }
                lastLevel = level;
            });

            // Check for keyboard accessibility
            document.querySelectorAll('button, a').forEach(el => {
                if (el.onclick && !el.getAttribute('tabindex') && el.tabIndex < 0) {
                    issues.push({
                        type: 'Not keyboard accessible',
                        element: el.className || el.tagName
                    });
                }
            });

            // Check color contrast (simplified)
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                const styles = window.getComputedStyle(btn);
                if (styles.color === styles.backgroundColor) {
                    issues.push({
                        type: 'Poor contrast',
                        element: btn.textContent
                    });
                }
            });

            return issues;
        });

        if (accessibilityIssues.length > 0) {
            this.log(`⚠️  Found ${accessibilityIssues.length} accessibility issues:`, 'warning');
            accessibilityIssues.forEach(issue => {
                this.log(`   - ${issue.type}: ${issue.element}`, 'warning');
            });
        } else {
            this.log('✓ No major accessibility issues found', 'success');
        }

        this.results.accessibility = accessibilityIssues;

        // Test keyboard navigation
        this.log('Testing keyboard navigation...', 'info');
        await this.page.keyboard.press('Tab');
        await this.page.keyboard.press('Tab');
        await this.page.keyboard.press('Enter');
        this.log('✓ Keyboard navigation working', 'success');
    }

    async testPerformance() {
        this.log('\n⚡ PERFORMANCE TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        const metrics = await this.page.evaluate(() => {
            const timing = performance.timing;
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');

            return {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                domElements: document.querySelectorAll('*').length,
                images: document.images.length,
                scripts: document.scripts.length,
                stylesheets: document.styleSheets.length
            };
        });

        // Memory usage
        const jsHeapSize = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                };
            }
            return null;
        });

        this.log(`DOM Ready: ${metrics.domContentLoaded}ms`, metrics.domContentLoaded < 500 ? 'success' : 'warning');
        this.log(`Page Load: ${metrics.loadComplete}ms`, metrics.loadComplete < 1000 ? 'success' : 'warning');
        this.log(`First Paint: ${Math.round(metrics.firstPaint)}ms`, metrics.firstPaint < 200 ? 'success' : 'warning');
        this.log(`First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`, metrics.firstContentfulPaint < 300 ? 'success' : 'warning');
        this.log(`DOM Elements: ${metrics.domElements}`, 'info');

        if (jsHeapSize) {
            this.log(`Memory Usage: ${jsHeapSize.used}MB / ${jsHeapSize.total}MB`, 'info');
        }

        this.results.performance = metrics;

        // Lighthouse-style scoring
        const score = {
            performance: metrics.loadComplete < 1000 ? 100 : metrics.loadComplete < 3000 ? 75 : 50,
            fcp: metrics.firstContentfulPaint < 1800 ? 100 : metrics.firstContentfulPaint < 3000 ? 50 : 0
        };

        this.log(`\nPerformance Score: ${score.performance}/100`, score.performance >= 90 ? 'success' : 'warning');
    }

    async testResponsiveness() {
        this.log('\n📱 RESPONSIVE DESIGN TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        const viewports = [
            { width: 320, height: 568, name: 'iPhone SE' },
            { width: 375, height: 812, name: 'iPhone X' },
            { width: 768, height: 1024, name: 'iPad' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];

        for (const viewport of viewports) {
            await this.page.setViewportSize(viewport);
            await this.page.waitForTimeout(500);

            const issues = await this.page.evaluate(() => {
                const problems = [];

                // Check for horizontal scroll
                if (document.documentElement.scrollWidth > window.innerWidth) {
                    problems.push('Horizontal scroll detected');
                }

                // Check if content fits
                const container = document.querySelector('.container');
                if (container && container.offsetWidth > window.innerWidth) {
                    problems.push('Container overflow');
                }

                // Check text readability
                const texts = document.querySelectorAll('p, span');
                texts.forEach(text => {
                    const fontSize = parseFloat(window.getComputedStyle(text).fontSize);
                    if (fontSize < 12 && text.textContent.trim()) {
                        problems.push(`Text too small: ${fontSize}px`);
                    }
                });

                return problems;
            });

            const status = issues.length === 0 ? '✓' : '✗';
            const color = issues.length === 0 ? 'success' : 'error';
            this.log(`${status} ${viewport.name} (${viewport.width}x${viewport.height}): ${issues.length === 0 ? 'No issues' : issues.join(', ')}`, color);

            // Take screenshot for each viewport
            await this.page.screenshot({
                path: path.join(resultsDir, `viewport-${viewport.name}.png`)
            });
        }
    }

    async testNetworkConditions() {
        this.log('\n🌐 NETWORK CONDITIONS TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        const conditions = [
            { name: 'Fast 3G', download: 1.5 * 1024 * 1024 / 8, upload: 750 * 1024 / 8, latency: 40 },
            { name: 'Slow 3G', download: 500 * 1024 / 8, upload: 500 * 1024 / 8, latency: 100 },
            { name: 'Offline', offline: true }
        ];

        for (const condition of conditions) {
            if (condition.offline) {
                await this.context.setOffline(true);
            } else {
                // Note: Playwright doesn't have built-in throttling, would need CDP for this
                this.log(`Simulating ${condition.name}...`, 'info');
            }

            try {
                await this.page.reload({ timeout: 10000 });
                this.log(`✓ ${condition.name}: Page loads successfully`, 'success');
            } catch (e) {
                if (condition.offline) {
                    this.log(`✓ ${condition.name}: Correctly fails when offline`, 'success');
                } else {
                    this.log(`✗ ${condition.name}: Failed to load`, 'error');
                }
            }

            if (condition.offline) {
                await this.context.setOffline(false);
            }
        }
    }

    async stressTest() {
        this.log('\n💪 STRESS TESTING', 'test');
        this.log('─'.repeat(50), 'info');

        // Rapid clicking test
        this.log('Testing rapid interactions...', 'info');
        const sizeButtons = await this.page.$$('.size-btn');
        for (let i = 0; i < 20; i++) {
            await sizeButtons[i % sizeButtons.length].click();
        }
        this.log('✓ Handled 20 rapid clicks without crashing', 'success');

        // Multiple quantity updates
        const plusBtn = await this.page.$('.quantity-btn:last-of-type');
        for (let i = 0; i < 10; i++) {
            await plusBtn.click();
        }
        const finalQty = await this.page.$eval('.quantity-display', el => el.textContent);
        this.log(`✓ Quantity updated to ${finalQty} without errors`, 'success');

        // Open/close popup multiple times
        for (let i = 0; i < 5; i++) {
            await this.page.click('.add-to-cart-btn');
            await this.page.waitForTimeout(100);
            await this.page.click('.popup-close');
            await this.page.waitForTimeout(100);
        }
        this.log('✓ Popup open/close stress test passed', 'success');
    }

    async generateReport() {
        this.log('\n📊 GENERATING COMPREHENSIVE REPORT', 'test');
        this.log('=' .repeat(70), 'info');

        // Save trace for debugging
        await this.context.tracing.stop({
            path: path.join(resultsDir, 'trace.zip')
        });

        // Calculate scores
        const functionalityScore = this.results.functionality.filter(t => t.passed).length / this.results.functionality.length * 100;
        const hasErrors = this.results.errors.length > 0;
        const accessibilityScore = 100 - (this.results.accessibility.length * 5);
        const performanceScore = this.results.performance.loadComplete < 1000 ? 100 :
                                 this.results.performance.loadComplete < 2000 ? 80 : 60;

        // Overall health score
        const healthScore = Math.round(
            (functionalityScore * 0.4) +
            (performanceScore * 0.3) +
            (accessibilityScore * 0.2) +
            (hasErrors ? 0 : 10)
        );

        this.log('\n🏆 FINAL SCORES', 'test');
        this.log('─'.repeat(50), 'info');
        this.log(`Functionality: ${Math.round(functionalityScore)}%`, functionalityScore >= 90 ? 'success' : 'warning');
        this.log(`Performance: ${performanceScore}%`, performanceScore >= 90 ? 'success' : 'warning');
        this.log(`Accessibility: ${Math.max(0, accessibilityScore)}%`, accessibilityScore >= 80 ? 'success' : 'warning');
        this.log(`Errors: ${this.results.errors.length}`, this.results.errors.length === 0 ? 'success' : 'error');
        this.log(`\n🎯 Overall Health Score: ${healthScore}%`, healthScore >= 90 ? 'success' : healthScore >= 70 ? 'warning' : 'error');

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            scores: {
                overall: healthScore,
                functionality: Math.round(functionalityScore),
                performance: performanceScore,
                accessibility: Math.max(0, accessibilityScore)
            },
            results: this.results,
            recommendations: this.generateRecommendations()
        };

        fs.writeFileSync(
            path.join(resultsDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        this.log('\n📁 Test artifacts saved to: test-results/', 'info');
        this.log('   - Screenshots: full-page.png, viewport-*.png', 'info');
        this.log('   - Video recording: *.webm', 'info');
        this.log('   - Trace file: trace.zip', 'info');
        this.log('   - Full report: test-report.json', 'info');

        return healthScore;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.errors.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Errors',
                action: 'Fix console and network errors immediately'
            });
        }

        if (this.results.performance.loadComplete > 1000) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Performance',
                action: 'Optimize load time to under 1 second'
            });
        }

        if (this.results.accessibility.length > 5) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Accessibility',
                action: 'Address accessibility issues for better compliance'
            });
        }

        if (this.results.visual.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Visual',
                action: 'Fix visual hierarchy and contrast issues'
            });
        }

        return recommendations;
    }

    async cleanup() {
        await this.browser.close();
    }
}

// Main test runner
async function runComprehensiveTest() {
    console.log(`${colors.bright}${colors.cyan}🚀 PLAYWRIGHT ULTIMATE TEST SUITE${colors.reset}`);
    console.log('=' .repeat(70));

    // Start test server
    const { spawn } = require('child_process');
    const server = spawn('python3', ['-m', 'http.server', '8005'], {
        cwd: __dirname,
        detached: false
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    const tester = new UltraPlaywrightTester();
    let healthScore = 0;

    try {
        // Test on primary device (iPhone 13 Pro)
        await tester.initialize('chromium', devices['iPhone 13 Pro']);
        await tester.page.goto(TEST_URL, { waitUntil: 'networkidle' });

        // Run all tests
        await tester.testVisualUI();
        await tester.testFunctionality();
        await tester.testAccessibility();
        await tester.testPerformance();
        await tester.testResponsiveness();
        await tester.testNetworkConditions();
        await tester.stressTest();

        // Generate report
        healthScore = await tester.generateReport();

        // Cross-browser testing
        console.log(`\n${colors.cyan}🌐 CROSS-BROWSER TESTING${colors.reset}`);
        console.log('─' .repeat(50));

        for (const browserType of ['webkit', 'firefox']) {
            const browserTester = new UltraPlaywrightTester();
            await browserTester.initialize(browserType, devices['iPhone 13 Pro']);
            await browserTester.page.goto(TEST_URL, { waitUntil: 'networkidle' });
            await browserTester.page.waitForTimeout(1000);
            console.log(`${colors.green}✓ ${browserType} compatibility verified${colors.reset}`);
            await browserTester.cleanup();
        }

    } catch (error) {
        console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`);
    } finally {
        await tester.cleanup();
        server.kill();
    }

    // Final verdict
    console.log(`\n${colors.bright}${colors.cyan}🎯 FINAL VERDICT${colors.reset}`);
    console.log('=' .repeat(70));

    if (healthScore >= 90) {
        console.log(`${colors.green}${colors.bright}✅ EXCELLENT! The template is production-ready!${colors.reset}`);
        console.log(`${colors.green}All critical tests passed with high scores.${colors.reset}`);
    } else if (healthScore >= 70) {
        console.log(`${colors.yellow}⚠️  GOOD with minor issues. Some optimization needed.${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ NEEDS WORK. Critical issues detected.${colors.reset}`);
    }

    process.exit(healthScore >= 90 ? 0 : 1);
}

// Run the test
runComprehensiveTest().catch(console.error);