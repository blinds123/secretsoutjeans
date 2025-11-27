const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create sunglasses placeholder image
function createSunglassesImage() {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 400);

    // Draw sunglasses shape
    ctx.fillStyle = '#000000';
    // Left lens
    ctx.beginPath();
    ctx.ellipse(120, 180, 60, 50, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Right lens
    ctx.beginPath();
    ctx.ellipse(280, 180, 60, 50, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(180, 180);
    ctx.quadraticCurveTo(200, 160, 220, 180);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(60, 180);
    ctx.lineTo(20, 170);
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(340, 180);
    ctx.lineTo(380, 170);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SUNGLASSES', 200, 280);
    ctx.font = '18px Arial';
    ctx.fillText('Designer UV Protection', 200, 310);

    return canvas.toBuffer('image/jpeg');
}

// Create wallet placeholder image
function createWalletImage() {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 400);

    // Draw wallet
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(100, 120, 200, 140);

    // Wallet detail - stitching
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(110, 130, 180, 120);
    ctx.setLineDash([]);

    // Card slots
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(120, 145, 60, 35);
    ctx.fillRect(190, 145, 60, 35);
    ctx.fillRect(260, 145, 30, 35);

    // Money symbol
    ctx.fillStyle = '#228B22';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$', 200, 215);

    // Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WALLET', 200, 290);
    ctx.font = '18px Arial';
    ctx.fillText('Premium Leather', 200, 320);

    return canvas.toBuffer('image/jpeg');
}

// Check if canvas is available
try {
    const sunglassesBuffer = createSunglassesImage();
    const walletBuffer = createWalletImage();

    // Save images
    fs.writeFileSync(path.join(__dirname, 'images/order-bump/sunglasses.jpeg'), sunglassesBuffer);
    fs.writeFileSync(path.join(__dirname, 'images/order-bump/wallet.jpeg'), walletBuffer);

    console.log('✅ Created placeholder images:');
    console.log('   - images/order-bump/sunglasses.jpeg');
    console.log('   - images/order-bump/wallet.jpeg');
} catch (error) {
    console.log('Canvas module not available. Creating simple placeholder images...');

    // Alternative: Create data URI images
    const sunglassesDataUri = 'data:image/svg+xml;base64,' + Buffer.from(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f0f0f0"/>
            <g fill="none" stroke="black" stroke-width="8">
                <ellipse cx="120" cy="180" rx="60" ry="50" fill="black"/>
                <ellipse cx="280" cy="180" rx="60" ry="50" fill="black"/>
                <path d="M180 180 Q200 160 220 180" stroke="black"/>
                <line x1="60" y1="180" x2="20" y2="170"/>
                <line x1="340" y1="180" x2="380" y2="170"/>
            </g>
            <text x="200" y="280" text-anchor="middle" font-size="24" font-weight="bold">SUNGLASSES</text>
            <text x="200" y="310" text-anchor="middle" font-size="18">Designer UV Protection</text>
        </svg>
    `).toString('base64');

    const walletDataUri = 'data:image/svg+xml;base64,' + Buffer.from(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f0f0f0"/>
            <rect x="100" y="120" width="200" height="140" fill="#8B4513"/>
            <rect x="110" y="130" width="180" height="120" fill="none" stroke="#654321" stroke-width="2" stroke-dasharray="5,5"/>
            <rect x="120" y="145" width="60" height="35" fill="#A0522D"/>
            <rect x="190" y="145" width="60" height="35" fill="#A0522D"/>
            <rect x="260" y="145" width="30" height="35" fill="#A0522D"/>
            <text x="200" y="215" text-anchor="middle" font-size="36" font-weight="bold" fill="#228B22">$</text>
            <text x="200" y="290" text-anchor="middle" font-size="24" font-weight="bold">WALLET</text>
            <text x="200" y="320" text-anchor="middle" font-size="18">Premium Leather</text>
        </svg>
    `).toString('base64');

    console.log('Alternative approach needed - canvas not available');
}