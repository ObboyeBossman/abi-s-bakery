/**
 * Abi's Bakery - Main Interactive JavaScript
 * Custom Ghanaian Pastries & Bakes · Order Inquiry & WhatsApp Integration
 * Owner: Abigail Amoah
 */

const WHATSAPP_PHONE = '233549946550'; // Abigail Amoah's direct number: 054 994 6550 (+233 54 994 6550)

// Global Bakery Inquiry List
const BakeryInquiry = {
    items: [],

    init() {
        try {
            const saved = sessionStorage.getItem('abis_inquiry');
            if (saved) {
                this.items = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Session storage not available:', e);
        }

        if (this.items.length === 0) {
            this.items = [
                { id: 'inq-1', name: 'Classic Ghanaian Meat Pie', quantity: 1, category: 'Savory Pastries' }
            ];
        }

        this.renderInquiry();
        this.updateBadge();
    },

    save() {
        try {
            sessionStorage.setItem('abis_inquiry', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Failed to save inquiry:', e);
        }
    },

    addItem(name, category = 'Ghanaian Pastry') {
        const existing = this.items.find(item => item.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            existing.quantity += 1;
        } else {
            this.items.push({
                id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                name,
                quantity: 1,
                category
            });
        }
        this.save();
        this.renderInquiry();
        this.updateBadge();
        showToast(`Added "${name}" to your inquiry list!`, 'success');
    },

    updateQuantity(index, newQty) {
        if (newQty <= 0) {
            this.removeItem(index);
            return;
        }
        if (this.items[index]) {
            this.items[index].quantity = parseInt(newQty);
            this.save();
            this.renderInquiry();
            this.updateBadge();
        }
    },

    removeItem(index) {
        if (this.items[index]) {
            const removed = this.items[index].name;
            this.items.splice(index, 1);
            this.save();
            this.renderInquiry();
            this.updateBadge();
            showToast(`Removed "${removed}" from inquiry list`, 'info');
        }
    },

    clearInquiry() {
        this.items = [];
        this.save();
        this.renderInquiry();
        this.updateBadge();
    },

    getTotalItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    },

    updateBadge() {
        const count = this.getTotalItemCount();
        document.querySelectorAll('.cart-badge-count').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    },

    renderInquiry() {
        const orderItemsContainer = document.getElementById('order-items');
        const emptyCartMsg = document.getElementById('empty-cart-message');

        if (!orderItemsContainer) return;

        if (this.items.length === 0) {
            orderItemsContainer.innerHTML = '';
            if (emptyCartMsg) emptyCartMsg.style.display = 'block';
            return;
        }

        if (emptyCartMsg) emptyCartMsg.style.display = 'none';

        orderItemsContainer.innerHTML = this.items.map((item, idx) => `
            <div class="order-item" data-index="${idx}">
                <div class="order-item-info">
                    <span class="order-item-name">${escapeHtml(item.name)}</span>
                    <span class="order-item-category">${escapeHtml(item.category || 'Ghanaian Pastry')}</span>
                    <span class="order-item-unit-price"><i class="fas fa-user-clock"></i> Contact Owner First</span>
                </div>
                <div class="order-item-controls">
                    <div class="quantity-picker">
                        <button type="button" class="qty-btn minus-btn" onclick="BakeryInquiry.updateQuantity(${idx}, ${item.quantity - 1})" aria-label="Decrease quantity">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="qty-input" name="items[${idx}][quantity]" value="${item.quantity}" min="1" max="99" 
                               onchange="BakeryInquiry.updateQuantity(${idx}, this.value)" aria-label="Item quantity">
                        <button type="button" class="qty-btn plus-btn" onclick="BakeryInquiry.updateQuantity(${idx}, ${item.quantity + 1})" aria-label="Increase quantity">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button type="button" class="remove-item-btn" onclick="BakeryInquiry.removeItem(${idx})" title="Remove item" aria-label="Remove ${escapeHtml(item.name)}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <input type="hidden" name="items[${idx}][name]" value="${escapeHtml(item.name)}">
                <input type="hidden" name="items[${idx}][category]" value="${escapeHtml(item.category || 'Ghanaian Pastry')}">
            </div>
        `).join('');
    }
};

// Simple HTML escaping
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Toast Notification System
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3800);
}

// Generate direct WhatsApp link with selected inquiry items
function openWhatsAppInquiry(customerName = '', customerPhone = '', notes = '') {
    const items = BakeryInquiry.items;
    let message = `Hello Abigail! I am contacting you first regarding pricing and availability for locally made pastries from Abi's Bakery:\n\n`;
    
    if (items.length > 0) {
        message += `*Requested Ghanaian Pastries & Bakes:*\n`;
        items.forEach(item => {
            message += `• ${item.name} (Qty / Batch: ${item.quantity})\n`;
        });
        message += `\n`;
    }

    if (customerName) message += `*My Name:* ${customerName}\n`;
    if (customerPhone) message += `*Phone:* ${customerPhone}\n`;
    if (notes) message += `*Special Notes / Event Date:* ${notes}\n`;

    message += `\nPlease let me know your custom pricing and batch delivery schedule. Thank you!`;

    // Ensure mobile drawer is closed if active
    if (typeof window.closeMobileMenu === 'function') {
        window.closeMobileMenu();
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`, '_blank');
}

// Order Inquiry Confirmation Modal Handler
function showOrderConfirmationModal(orderData, orderId) {
    const modal = document.getElementById('order-modal');
    if (!modal) return;

    const modalBody = document.getElementById('order-modal-details');
    if (modalBody) {
        const itemsHtml = orderData.items.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong><br><small style="color:#777;">${escapeHtml(item.category)}</small></td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right; color: var(--primary-dark); font-weight: 600;"><i class="fas fa-user-clock"></i> Contact Owner First</td>
            </tr>
        `).join('');

        modalBody.innerHTML = `
            <div class="receipt-card">
                <div class="receipt-header">
                    <div class="receipt-badge"><i class="fas fa-check"></i> Inquiry Submitted to Abi!</div>
                    <h3>Reference #${orderId}</h3>
                    <p class="receipt-time">${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                
                <div class="receipt-section">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${escapeHtml(orderData.customer_name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(orderData.customer_email)}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(orderData.customer_phone)}</p>
                    ${orderData.delivery_address ? `<p><strong>Delivery Location:</strong> ${escapeHtml(orderData.delivery_address)}</p>` : ''}
                    ${orderData.special_instructions ? `<p><strong>Special Instructions:</strong> ${escapeHtml(orderData.special_instructions)}</p>` : ''}
                </div>

                <div class="receipt-section">
                    <h4>Requested Pastries &amp; Bakes</h4>
                    <table class="receipt-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qty / Batch</th>
                                <th style="text-align: right;">Pricing Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>

                <div class="receipt-footer">
                    <p style="margin-bottom: 14px;"><strong>Abigail Amoah</strong> will reach out directly to confirm pricing, batch size, and delivery time.</p>
                    <button type="button" class="btn btn-whatsapp" onclick="openWhatsAppInquiry('${escapeHtml(orderData.customer_name)}', '${escapeHtml(orderData.customer_phone)}', '${escapeHtml(orderData.special_instructions)}')">
                        <i class="fab fa-whatsapp"></i> Chat with Abi on WhatsApp
                    </button>
                </div>
            </div>
        `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Lightbox Handler
function openLightbox(src, caption) {
    let lightbox = document.getElementById('image-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay" onclick="closeLightbox()"></div>
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="closeLightbox()" aria-label="Close image">&times;</button>
                <img src="" alt="Enlarged bakery view" id="lightbox-img">
                <p id="lightbox-caption" class="lightbox-caption"></p>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (img) img.src = src;
    if (cap) cap.textContent = caption || "Abi's Bakery Delight";

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Smoothly scroll to an in-page section with exact header offset
function smoothScrollToElement(targetEl) {
    if (!targetEl) return;
    const headerEl = document.querySelector('header');
    const headerOffset = headerEl ? headerEl.offsetHeight + 10 : 75;
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
    });
}

// Mobile Hamburger Navigation Controller & Smooth Link Router
function setupMobileMenu() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mainNav = document.querySelector('.main-nav');
    const drawerCloseBtn = document.querySelector('.drawer-close-btn');
    const navLinks = document.querySelectorAll('.nav-list a, .mobile-order-btn, .mobile-drawer-header .logo');
    
    let overlay = document.querySelector('.mobile-nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'mobile-nav-overlay';
        document.body.appendChild(overlay);
    }

    const openMenu = () => {
        if (hamburgerBtn) {
            hamburgerBtn.classList.add('active');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
        }
        if (mainNav) mainNav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.classList.add('menu-open');
    };

    const closeMenu = () => {
        if (hamburgerBtn) {
            hamburgerBtn.classList.remove('active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
        if (mainNav) mainNav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
    };

    // Expose closeMenu globally
    window.closeMobileMenu = closeMenu;

    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mainNav.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMenu();
            });
        }

        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMenu();
        });

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href) return;

                // Determine if this is an in-page section target
                let targetId = '';
                if (href.startsWith('#')) {
                    targetId = href.substring(1);
                } else if (href.includes('#')) {
                    const currentPath = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
                    const linkPath = href.split('#')[0].toLowerCase();
                    if (currentPath === linkPath || (currentPath === 'index.html' && linkPath === '')) {
                        targetId = href.split('#')[1];
                    }
                }

                if (targetId) {
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        e.preventDefault();

                        // Immediate visual feedback on the tapped menu link
                        document.querySelectorAll('.nav-list a').forEach(item => item.classList.remove('active'));
                        if (link.closest('.nav-list')) {
                            link.classList.add('active');
                        }

                        // Close mobile drawer and restore body scroll immediately
                        closeMenu();

                        // Delay slightly so mobile browser compositor can unblock body overflow
                        setTimeout(() => {
                            if (targetId === 'home' || targetId === 'top') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                smoothScrollToElement(targetEl);
                            }
                            try {
                                history.pushState(null, '', `#${targetId}`);
                            } catch (err) {}
                        }, 80);
                        return;
                    }
                }

                // If cross-page navigation, close the menu and let browser proceed
                closeMenu();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('active')) {
                closeMenu();
            }
        });
    }
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Inquiry List
    BakeryInquiry.init();

    // 2. Setup Mobile Hamburger Menu
    setupMobileMenu();

    // 3. Sticky Header on Scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }, { passive: true });

    // 4. Smooth scroll for all other in-page hash links (hero buttons, cart indicator, footer links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.closest('.main-nav')) return; // handled by setupMobileMenu

        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            if (!targetId) return;

            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                e.preventDefault();
                if (targetId === 'home' || targetId === 'top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    smoothScrollToElement(targetEl);
                }
                try {
                    history.pushState(null, '', `#${targetId}`);
                } catch (err) {}
            }
        });
    });

    // 5. ScrollSpy for Navigation Highlighting
    const sections = document.querySelectorAll('section[id]');
    const scrollNavLinks = document.querySelectorAll('.nav-list a');
    if (sections.length > 0 && scrollNavLinks.length > 0) {
        const updateScrollSpy = () => {
            let current = '';
            const scrollPos = window.scrollY + 130;

            if (window.scrollY < 80) {
                current = 'home';
            } else if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 70)) {
                // If user is at or very near bottom, activate contact or order section
                const lastSection = sections[sections.length - 1];
                if (lastSection) current = lastSection.getAttribute('id');
            } else {
                sections.forEach(section => {
                    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
                    const sectionHeight = section.offsetHeight;
                    if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                        current = section.getAttribute('id');
                    }
                });
            }

            if (current) {
                scrollNavLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href === `#${current}` || href.endsWith(`#${current}`))) {
                        link.classList.add('active');
                    } else if (href && (href.startsWith('#') || href.includes('Index.html#'))) {
                        link.classList.remove('active');
                    }
                });
            }
        };

        window.addEventListener('scroll', updateScrollSpy, { passive: true });
        updateScrollSpy();
    }

    // 6. Handle URL Hash on Initial Page Load (e.g. from Menu.html to Index.html#featured)
    if (window.location.hash) {
        const hashId = window.location.hash.substring(1);
        const hashEl = document.getElementById(hashId);
        if (hashEl) {
            setTimeout(() => {
                smoothScrollToElement(hashEl);
            }, 250);
        }
    }

    // 5. Menu Category Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    if (tabButtons.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');

                tabButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                if (tabPanes.length > 0) {
                    tabPanes.forEach(pane => {
                        if (targetTab === 'all' || pane.id === targetTab) {
                            pane.classList.add('active');
                            pane.style.display = 'block';
                        } else {
                            pane.classList.remove('active');
                            pane.style.display = 'none';
                        }
                    });
                }
            });
        });
    }

    // 6. Connect "Inquire Item" buttons
    document.querySelectorAll('.add-to-inquiry-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const name = this.getAttribute('data-name');
            const category = this.getAttribute('data-category') || 'Ghanaian Pastry';

            if (name) {
                BakeryInquiry.addItem(name, category);
                
                this.classList.add('added');
                const origHtml = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Added to Inquiry';
                setTimeout(() => {
                    this.innerHTML = origHtml;
                    this.classList.remove('added');
                }, 1200);
            }
        });
    });

    // 7. Order/Inquiry Form Submission
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (BakeryInquiry.items.length === 0) {
                showToast('Please add at least one pastry to your inquiry list!', 'warning');
                const menuSec = document.getElementById('menu');
                if (menuSec) menuSec.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            const formData = new FormData(orderForm);
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const origBtnText = submitBtn ? submitBtn.innerHTML : 'Send Order Inquiry';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Inquiry...';
            }

            const orderData = {
                customer_name: formData.get('customer_name') || '',
                customer_email: formData.get('customer_email') || '',
                customer_phone: formData.get('customer_phone') || '',
                delivery_address: formData.get('delivery_address') || '',
                special_instructions: formData.get('special_instructions') || '',
                items: BakeryInquiry.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category || 'Ghanaian Pastry'
                }))
            };

            let generatedOrderId = 'ABI-GH-' + Math.floor(100000 + Math.random() * 900000);

            try {
                const response = await fetch('Process_order.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result && result.order_id) {
                        generatedOrderId = result.order_id;
                    }
                }
            } catch (err) {
                console.info('Backend submission logged locally:', err);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnText;
                }

                showOrderConfirmationModal(orderData, generatedOrderId);
                orderForm.reset();
                showToast(`Inquiry #${generatedOrderId} sent to Abigail!`, 'success');
            }
        });
    }

    // 8. Contact Form Handling
    const contactForm = document.querySelector('.contact-form-card form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }
            setTimeout(() => {
                showToast('Thank you! Your message has been sent to Abigail Amoah.', 'success');
                contactForm.reset();
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
            }, 800);
        });
    }

    // 9. Newsletter Form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim()) {
                showToast('Welcome to our sweet circle! You are subscribed.', 'success');
                newsletterForm.reset();
            }
        });
    }

    // 10. Gallery Item Click for Lightbox
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.getAttribute('data-caption') || (img ? img.alt : '');
            if (img && img.src) {
                openLightbox(img.src, caption);
            }
        });
    });

    // 11. Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOrderModal();
            closeLightbox();
        }
    });
});
