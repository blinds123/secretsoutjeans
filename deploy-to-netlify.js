#!/usr/bin/env node

/**
 * Automated Netlify Deployment Script
 * Creates a new Netlify site and deploys the Blue Sneaker landing page
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting automated Netlify deployment...\n');

// Get Netlify auth token
let authToken;
try {
  const netlifyConfig = path.join(process.env.HOME, '.netlify', 'config.json');
  if (fs.existsSync(netlifyConfig)) {
    const config = JSON.parse(fs.readFileSync(netlifyConfig, 'utf8'));
    authToken = config.users?.[0]?.auth?.token || config.userId;
    console.log('✅ Found Netlify authentication token\n');
  }
} catch (error) {
  console.error('❌ Could not read Netlify config:', error.message);
  process.exit(1);
}

if (!authToken) {
  console.error('❌ No Netlify auth token found. Please run: netlify login');
  process.exit(1);
}

// Site configuration
const siteName = 'blue-sneaker-lander';
const siteDir = process.cwd();

console.log(`📦 Site name: ${siteName}`);
console.log(`📁 Deploy directory: ${siteDir}\n`);

try {
  // Step 1: Create site using API
  console.log('🔨 Creating new Netlify site...');

  const createSiteCmd = `curl -X POST "https://api.netlify.com/api/v1/sites" \
    -H "Authorization: Bearer ${authToken}" \
    -H "Content-Type: application/json" \
    -d '{"name": "${siteName}", "repo": {"repo": "blinds123/blue-sneaker-lander", "provider": "github"}}'`;

  const siteResponse = execSync(createSiteCmd, { encoding: 'utf8' });
  const siteData = JSON.parse(siteResponse);

  if (siteData.id) {
    console.log(`✅ Site created successfully!`);
    console.log(`   Site ID: ${siteData.id}`);
    console.log(`   URL: ${siteData.url}\n`);

    // Step 2: Save site ID to .netlify/state.json
    console.log('💾 Linking site to directory...');
    const netlifyDir = path.join(siteDir, '.netlify');
    if (!fs.existsSync(netlifyDir)) {
      fs.mkdirSync(netlifyDir, { recursive: true });
    }

    const stateFile = path.join(netlifyDir, 'state.json');
    fs.writeFileSync(stateFile, JSON.stringify({ siteId: siteData.id }, null, 2));
    console.log('✅ Site linked to directory\n');

    // Step 3: Deploy to production
    console.log('🚢 Deploying to production...');
    const deployCmd = `netlify deploy --prod --dir=. --message="Initial deployment of Blue Sneaker landing page with SimpleSwap pool integration"`;

    console.log('   This may take 30-60 seconds...\n');
    const deployOutput = execSync(deployCmd, {
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: siteDir
    });

    console.log('\n✅ Deployment successful!');
    console.log(`\n🎉 Your site is live at: ${siteData.url}`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. Visit ${siteData.url}`);
    console.log(`   2. Test the "COMPLETE PURCHASE" button`);
    console.log(`   3. Verify redirect to SimpleSwap`);
    console.log(`   4. Check pool status: curl https://simpleswap-automation-1.onrender.com/stats`);

  } else if (siteData.code === 422 && siteData.message.includes('already exists')) {
    console.log('⚠️  Site name already exists, trying to link existing site...\n');

    // Get existing site
    const getSiteCmd = `curl "https://api.netlify.com/api/v1/sites?name=${siteName}" \
      -H "Authorization: Bearer ${authToken}"`;

    const sitesResponse = execSync(getSiteCmd, { encoding: 'utf8' });
    const sites = JSON.parse(sitesResponse);

    if (sites && sites.length > 0) {
      const existingSite = sites[0];
      console.log(`✅ Found existing site: ${existingSite.url}`);
      console.log(`   Site ID: ${existingSite.id}\n`);

      // Link directory to existing site
      const netlifyDir = path.join(siteDir, '.netlify');
      if (!fs.existsSync(netlifyDir)) {
        fs.mkdirSync(netlifyDir, { recursive: true });
      }

      const stateFile = path.join(netlifyDir, 'state.json');
      fs.writeFileSync(stateFile, JSON.stringify({ siteId: existingSite.id }, null, 2));
      console.log('✅ Site linked to directory\n');

      // Deploy to production
      console.log('🚢 Deploying to production...');
      const deployCmd = `netlify deploy --prod --dir=. --message="Deployment of Blue Sneaker landing page with SimpleSwap pool integration"`;

      execSync(deployCmd, {
        encoding: 'utf8',
        stdio: 'inherit',
        cwd: siteDir
      });

      console.log('\n✅ Deployment successful!');
      console.log(`\n🎉 Your site is live at: ${existingSite.url}`);
    }
  } else {
    console.error('❌ Failed to create site:', siteData);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Deployment failed:', error.message);

  if (error.stdout) {
    console.log('\nOutput:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('\nError:', error.stderr.toString());
  }

  process.exit(1);
}
