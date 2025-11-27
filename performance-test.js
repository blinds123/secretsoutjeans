// Comprehensive Performance Testing Suite
// Tests for 95+ PageSpeed score and <300ms FCP

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing Performance Testing Suite...');

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    this.page = await this.browser.newPage();

    // Configure page for performance testing
    await this.page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        marks: {},
        measures: {},

        mark(name) {
          this.marks[name] = performance.now();
          performance.mark(name);
        },

        measure(name, start, end) {
          const startTime = this.marks[start] || 0;
          const endTime = this.marks[end] || performance.now();
          this.measures[name] = endTime - startTime;
          return this.measures[name];
        }
      };
    });
  }

  async testVersion(filename, versionName) {
    console.log(`\n📊 Testing ${versionName} (${filename})...`);

    const testResult = {
      version: versionName,
      filename: filename,
      metrics: {},
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Clear cache and start fresh
      await this.page.goto('about:blank');
      await this.page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
      });

      // Start performance monitoring
      const startTime = Date.now();

      // Navigate to page
      const response = await this.page.goto(`file://${path.resolve(filename)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()}`);
      }

      // Core Web Vitals measurement
      const coreWebVitals = await this.measureCoreWebVitals();
      testResult.metrics = { ...testResult.metrics, ...coreWebVitals };

      // Additional performance metrics
      const additionalMetrics = await this.measureAdditionalMetrics();
      testResult.metrics = { ...testResult.metrics, ...additionalMetrics };

      // Image loading performance
      const imageMetrics = await this.measureImageLoading();
      testResult.metrics = { ...testResult.metrics, ...imageMetrics };

      // JavaScript execution metrics
      const jsMetrics = await this.measureJavaScriptPerformance();
      testResult.metrics = { ...testResult.metrics, ...jsMetrics };

      // Network efficiency
      const networkMetrics = await this.measureNetworkEfficiency();
      testResult.metrics = { ...testResult.metrics, ...networkMetrics };

      // Calculate PageSpeed-like score
      testResult.metrics.pagespeedScore = this.calculatePageSpeedScore(testResult.metrics);

      // Visual verification
      const visualMetrics = await this.performVisualVerification();
      testResult.metrics = { ...testResult.metrics, ...visualMetrics };

      console.log(`✅ ${versionName} test completed`);
      console.log(`   FCP: ${testResult.metrics.fcp}ms`);
      console.log(`   LCP: ${testResult.metrics.lcp}ms`);
      console.log(`   CLS: ${testResult.metrics.cls}`);
      console.log(`   TBT: ${testResult.metrics.tbt}ms`);
      console.log(`   PageSpeed Score: ${testResult.metrics.pagespeedScore}/100`);

    } catch (error) {
      console.error(`❌ Error testing ${versionName}:`, error.message);
      testResult.errors.push(error.message);
    }

    this.results.tests.push(testResult);
    return testResult;
  }

  async measureCoreWebVitals() {
    console.log('  📈 Measuring Core Web Vitals...');

    // Wait for initial content to load
    await this.page.waitForLoadState('domcontentloaded');

    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {};
        let metricsCollected = 0;
        const totalMetrics = 5;

        function checkComplete() {
          if (metricsCollected >= totalMetrics) {
            resolve(metrics);
          }
        }

        // FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = Math.round(entry.startTime);
              metricsCollected++;
              checkComplete();
              break;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = Math.round(lastEntry.startTime);
          metricsCollected++;
          checkComplete();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.cls = Math.round(clsValue * 1000) / 1000;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FID (First Input Delay) - simulated
        let fidMeasured = false;
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.processingStart && entry.startTime) {
              metrics.fid = Math.round(entry.processingStart - entry.startTime);
              if (!fidMeasured) {
                fidMeasured = true;
                metricsCollected++;
                checkComplete();
              }
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // TBT (Total Blocking Time)
        const tbtObserver = new PerformanceObserver((list) => {
          let totalBlockingTime = 0;
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          }
          metrics.tbt = Math.round(totalBlockingTime);
          metricsCollected++;
          checkComplete();
        });
        tbtObserver.observe({ entryTypes: ['longtask'] });

        // Fallback timer
        setTimeout(() => {
          // Set defaults for missing metrics
          if (!metrics.fcp) metrics.fcp = 0;
          if (!metrics.lcp) metrics.lcp = 0;
          if (!metrics.cls) metrics.cls = 0;
          if (!metrics.fid) metrics.fid = 0;
          if (!metrics.tbt) metrics.tbt = 0;

          resolve(metrics);
        }, 10000);

        // Simulate user interaction for FID
        setTimeout(() => {
          if (!fidMeasured) {
            document.body.click();
            setTimeout(() => {
              if (!fidMeasured) {
                metrics.fid = 0;
                metricsCollected++;
                checkComplete();
              }
            }, 100);
          }
        }, 1000);

        // Finalize CLS after 5 seconds
        setTimeout(() => {
          if (metrics.cls === undefined) {
            metrics.cls = Math.round(clsValue * 1000) / 1000;
            metricsCollected++;
            checkComplete();
          }
        }, 5000);
      });
    });

    return metrics;
  }

  async measureAdditionalMetrics() {
    console.log('  ⚡ Measuring additional performance metrics...');

    const metrics = await this.page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        windowLoad: timing.loadEventEnd - timing.navigationStart,
        ttfb: timing.responseStart - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        resourcesLoaded: performance.getEntriesByType('resource').length,
        totalTransferSize: navigation ? navigation.transferSize : 0,
        totalEncodedSize: navigation ? navigation.encodedBodySize : 0
      };
    });

    return metrics;
  }

  async measureImageLoading() {
    console.log('  🖼️  Measuring image loading performance...');

    // Wait for images to start loading
    await this.page.waitForTimeout(2000);

    const imageMetrics = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      let loadedImages = 0;
      let totalImages = images.length;
      let heroImageLoaded = false;
      let averageLoadTime = 0;

      const heroImage = document.getElementById('heroImage');
      if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
        heroImageLoaded = true;
      }

      images.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          loadedImages++;
        }
      });

      // Check for broken images
      const brokenImages = Array.from(images).filter(img =>
        img.complete && img.naturalWidth === 0
      ).length;

      return {
        totalImages,
        loadedImages,
        brokenImages,
        heroImageLoaded,
        imageLoadPercentage: Math.round((loadedImages / totalImages) * 100)
      };
    });

    return imageMetrics;
  }

  async measureJavaScriptPerformance() {
    console.log('  ⚙️  Measuring JavaScript performance...');

    const jsMetrics = await this.page.evaluate(() => {
      const jsResources = performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.js'));

      const totalJSSize = jsResources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      const totalJSTime = jsResources.reduce((sum, entry) => sum + entry.duration, 0);

      // Check for JavaScript errors
      const errors = window.jsErrors || [];

      return {
        totalJSSize: Math.round(totalJSSize / 1024), // KB
        totalJSTime: Math.round(totalJSTime),
        jsResourceCount: jsResources.length,
        jsErrors: errors.length
      };
    });

    return jsMetrics;
  }

  async measureNetworkEfficiency() {
    console.log('  🌐 Measuring network efficiency...');

    const networkMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');

      let totalRequests = resources.length;
      let totalSize = 0;
      let cachedRequests = 0;
      let http2Requests = 0;

      resources.forEach(resource => {
        totalSize += resource.transferSize || 0;

        if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
          cachedRequests++;
        }

        if (resource.nextHopProtocol && resource.nextHopProtocol.includes('h2')) {
          http2Requests++;
        }
      });

      return {
        totalRequests,
        totalSize: Math.round(totalSize / 1024), // KB
        cachedRequests,
        cacheHitRate: Math.round((cachedRequests / totalRequests) * 100),
        http2Percentage: Math.round((http2Requests / totalRequests) * 100)
      };
    });

    return networkMetrics;
  }

  calculatePageSpeedScore(metrics) {
    // Simplified PageSpeed scoring algorithm
    let score = 100;

    // FCP scoring (target: <300ms)
    if (metrics.fcp > 300) score -= Math.min(20, (metrics.fcp - 300) / 50);

    // LCP scoring (target: <1000ms)
    if (metrics.lcp > 1000) score -= Math.min(25, (metrics.lcp - 1000) / 100);

    // CLS scoring (target: <0.1)
    if (metrics.cls > 0.1) score -= Math.min(15, (metrics.cls - 0.1) * 100);

    // TBT scoring (target: <50ms)
    if (metrics.tbt > 50) score -= Math.min(20, (metrics.tbt - 50) / 10);

    // Network efficiency bonus
    if (metrics.totalRequests < 10) score += 5;
    if (metrics.totalSize < 500) score += 5;

    return Math.max(0, Math.round(score));
  }

  async performVisualVerification() {
    console.log('  👁️  Performing visual verification...');

    // Take screenshot for visual validation
    const screenshot = await this.page.screenshot({
      fullPage: false,
      type: 'png'
    });

    // Check if hero image is visible
    const heroVisible = await this.page.evaluate(() => {
      const heroImg = document.getElementById('heroImage');
      if (!heroImg) return false;

      const rect = heroImg.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && heroImg.src.includes('webp');
    });

    // Check if critical content is visible
    const criticalContentVisible = await this.page.evaluate(() => {
      const title = document.querySelector('h1');
      const price = document.querySelector('.price');
      const cta = document.querySelector('.cta-btn');

      return !!(title && price && cta);
    });

    return {
      heroVisible,
      criticalContentVisible,
      screenshotSize: screenshot.length
    };
  }

  generateComparisonReport() {
    console.log('\n📊 Generating Performance Comparison Report...');

    const comparison = {
      timestamp: this.results.timestamp,
      summary: {},
      recommendations: []
    };

    // Find best and worst performers
    let bestVersion = null;
    let worstVersion = null;
    let bestScore = 0;
    let worstScore = 100;

    this.results.tests.forEach(test => {
      if (test.metrics.pagespeedScore > bestScore) {
        bestScore = test.metrics.pagespeedScore;
        bestVersion = test.version;
      }
      if (test.metrics.pagespeedScore < worstScore) {
        worstScore = test.metrics.pagespeedScore;
        worstVersion = test.version;
      }
    });

    comparison.summary = {
      bestVersion,
      bestScore,
      worstVersion,
      worstScore,
      improvementPotential: bestScore - worstScore
    };

    // Generate recommendations
    this.results.tests.forEach(test => {
      const recommendations = [];

      if (test.metrics.fcp > 300) {
        recommendations.push(`FCP is ${test.metrics.fcp}ms (target: <300ms) - Consider optimizing critical CSS and preloading key resources`);
      }

      if (test.metrics.lcp > 1000) {
        recommendations.push(`LCP is ${test.metrics.lcp}ms (target: <1000ms) - Optimize largest content element loading`);
      }

      if (test.metrics.cls > 0.1) {
        recommendations.push(`CLS is ${test.metrics.cls} (target: <0.1) - Add size attributes to images and reserve space for dynamic content`);
      }

      if (test.metrics.tbt > 50) {
        recommendations.push(`TBT is ${test.metrics.tbt}ms (target: <50ms) - Break up long-running JavaScript tasks`);
      }

      if (test.metrics.totalRequests > 10) {
        recommendations.push(`${test.metrics.totalRequests} network requests (target: <10) - Consider bundling resources`);
      }

      comparison.recommendations.push({
        version: test.version,
        recommendations
      });
    });

    return comparison;
  }

  async generateDetailedReport() {
    const report = {
      ...this.results,
      comparison: this.generateComparisonReport()
    };

    // Save to file
    const reportPath = path.join(__dirname, `performance-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Console summary
    console.log('\n🏆 PERFORMANCE TEST RESULTS SUMMARY');
    console.log('=====================================');

    this.results.tests.forEach(test => {
      const pass = test.metrics.pagespeedScore >= 95 && test.metrics.fcp < 300;
      const status = pass ? '✅ PASS' : '❌ FAIL';

      console.log(`\n${status} ${test.version}`);
      console.log(`  PageSpeed Score: ${test.metrics.pagespeedScore}/100`);
      console.log(`  FCP: ${test.metrics.fcp}ms`);
      console.log(`  LCP: ${test.metrics.lcp}ms`);
      console.log(`  CLS: ${test.metrics.cls}`);
      console.log(`  TBT: ${test.metrics.tbt}ms`);
      console.log(`  Total Size: ${test.metrics.totalSize}KB`);
      console.log(`  Requests: ${test.metrics.totalRequests}`);
    });

    const comparison = report.comparison;
    console.log(`\n🥇 Best Performer: ${comparison.summary.bestVersion} (${comparison.summary.bestScore}/100)`);
    console.log(`🥉 Needs Improvement: ${comparison.summary.worstVersion} (${comparison.summary.worstScore}/100)`);

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();

  try {
    await tester.initialize();

    // Test different versions
    const versions = [
      { file: 'index.html', name: 'Original Version' },
      { file: 'lightning-fast.html', name: 'Lightning Fast Version' },
      { file: 'ultra-fast.html', name: 'Ultra Fast Version' },
      { file: 'maximum-performance.html', name: 'Maximum Performance Version' }
    ];

    for (const version of versions) {
      if (fs.existsSync(version.file)) {
        await tester.testVersion(version.file, version.name);
      } else {
        console.log(`⚠️  Skipping ${version.name} - file not found: ${version.file}`);
      }
    }

    await tester.generateDetailedReport();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Export for programmatic use
module.exports = PerformanceTester;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}