(function () {
    const pv = (new URLSearchParams(location.search).get('variant') || 'A').toUpperCase();
    if (pv === 'B') {
        const h = document.getElementById('headline');
        if (h) h.textContent = "Индивидуальный проект с прозрачным трекером сроков";
    }
})();


// ---- Helpers ----
const QS = (s, root = document) => root.querySelector(s);
const QSA = (s, root = document) => Array.from(root.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const storageKey = (brand) => `leads_${brand}`;
const fmtDate = d => {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
};

// Theme toggle via ?theme=light
if ((params.get('theme') || '').toLowerCase() === 'light') document.body.classList.add('light');

// Fill hidden UTM
['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = params.get(k) || '';
});

// Smooth scroll for anchor links
QSA('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
        e.preventDefault();
        document.querySelector(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}));

// FAQ accordion
QSA('.faq-q').forEach(q => q.addEventListener('click', () => {
    const a = q.nextElementSibling;
    a.style.display = (a.style.display === 'block') ? 'none' : 'block';
}));

// Phone mask
const phone = document.getElementById('phone');
if (phone) {
    phone.addEventListener('input', () => {
        let v = phone.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (!v.startsWith('7') && v.length > 0) v = '7' + v;
        const p = ['+', '7', ' ', '(', v.slice(1, 4), ')', ' ', v.slice(4, 7), '-', v.slice(7, 9), '-', v.slice(9, 11)].join('');
        phone.value = p.replace(/undefined/g, '');
    });
}

// Offer selection via buttons
const offerInput = document.getElementById('offer');
QSA('.offer').forEach(card => {
    const btn = card.querySelector('.cta');
    btn?.addEventListener('click', () => {
        const title = card.querySelector('h3')?.textContent?.trim() || '';
        if (offerInput) offerInput.value = title;
        QSA('.offer').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const stickyText = document.getElementById('sticky-offer');
        if (stickyText) stickyText.textContent = title ? `Выбрано: ${title}` : 'Готовы обсудить проект?';
    });
});

// Admin panel toggle (?admin=1 or Ctrl+L)
const admin = document.getElementById('admin');
function setAdminVisible(v) { if (admin) admin.style.display = v ? 'block' : 'none'; }
setAdminVisible(params.get('admin') === '1');
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) setAdminVisible(admin.style.display !== 'block');
});

function toCSV(rows) {
    if (!rows.length) return 'date,name,phone,address,scope,comment,brand,offer,utm_source,utm_medium,utm_campaign,utm_content,utm_term';
    const keys = Object.keys(rows[0]);
    const header = keys.join(',');
    const lines = rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
    return [header].concat(lines).join('\n');
}

function download(name, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Form submit -> store locally
const form = document.getElementById('form');
form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!data.name || !data.phone || data.phone.replace(/\D/g, '').length < 11) {
        alert('Проверьте имя и телефон'); return;
    }
    const brand = data.brand || 'AliGroup';
    const arr = JSON.parse(localStorage.getItem(storageKey(brand)) || '[]');
    data.date = (new Date()).toISOString();
    arr.push(data);
    localStorage.setItem(storageKey(brand), JSON.stringify(arr));
    const modal = document.getElementById('thanks');
    if (modal) modal.style.display = 'flex';
    form.reset();
    QSA('.offer').forEach(c => c.classList.remove('selected'));
    const stickyText = document.getElementById('sticky-offer');
    if (stickyText) stickyText.textContent = 'Готовы обсудить проект?';
});

document.getElementById('btn-export')?.addEventListener('click', () => {
    const brand = document.getElementById('brand')?.value || 'AliGroup';
    const arr = JSON.parse(localStorage.getItem(storageKey(brand)) || '[]');
    if (!arr.length) { alert('Нет заявок для экспорта'); return; }
    download(`${brand}_leads.csv`, toCSV(arr));
});
document.getElementById('btn-clear')?.addEventListener('click', () => {
    const brand = document.getElementById('brand')?.value || 'AliGroup';
    if (confirm('Очистить локальные заявки?')) localStorage.removeItem(storageKey(brand));
});

const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.arrow.right');
const prevBtn = document.querySelector('.arrow.left');
let index = 0;
let isAnimating = false;

// 🔄 Slaydni o‘zgartiruvchi funksiya
function showSlide(newIndex, direction) {
    if (isAnimating || newIndex === index) return;
    isAnimating = true;

    const current = slides[index];
    const next = slides[newIndex];

    next.classList.add('active');
    next.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
    next.style.opacity = '0';

    requestAnimationFrame(() => {
        next.style.transition = 'all 1s ease-in-out';
        next.style.transform = 'translateX(0)';
        next.style.opacity = '1';
        current.style.transition = 'all 1s ease-in-out';
        current.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
        current.style.opacity = '0';
    });

    setTimeout(() => {
        current.classList.remove('active');
        current.style.transition = '';
        current.style.transform = '';
        current.style.opacity = '';
        next.style.transition = '';
        isAnimating = false;
        index = newIndex;
    }, 1000);
}

if (nextBtn && prevBtn && slides.length > 0) {
    // ▶️ O‘ng strelka (keyingi)
    nextBtn.addEventListener('click', () => {
        const newIndex = (index + 1) % slides.length;
        showSlide(newIndex, 'next');
        resetAutoSlide();
    });

    // ◀️ Chap strelka (oldingi)
    prevBtn.addEventListener('click', () => {
        const newIndex = (index - 1 + slides.length) % slides.length;
        showSlide(newIndex, 'prev');
        resetAutoSlide();
    });

    // ⏱ Avtomatik o‘tish
    let autoSlide = setInterval(() => {
        const newIndex = (index + 1) % slides.length;
        showSlide(newIndex, 'next');
    }, 5000); // 5 soniyada bir marta

    // 🔁 Tugma bosilganda taymerni yangilash
    function resetAutoSlide() {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
            const newIndex = (index + 1) % slides.length;
            showSlide(newIndex, 'next');
        }, 5000);
    }
}

function changeCartQt(id, amt, btn) {
    let cartItems = JSON.parse(localStorage.getItem('cart_products') || '[]');
    id = String(id);
    let item = cartItems.find(i => i.id === id);
    if (item) {
        item.qt += amt;
        if (item.qt < 1) item.qt = 1;
        btn.parentElement.querySelector('.qt-val').innerText = item.qt + ' шт';
        localStorage.setItem('cart_products', JSON.stringify(cartItems));
    }
}

function changeOrderQt(id, amt, btn) {
    let orderItems = JSON.parse(localStorage.getItem('my_orders') || '[]');
    id = String(id);
    let item = orderItems.find(i => i.id === id);
    if (item) {
        item.qt += amt;
        if (item.qt < 1) item.qt = 1;
        btn.parentElement.querySelector('.qt-val').innerText = item.qt + ' шт';
        localStorage.setItem('my_orders', JSON.stringify(orderItems));
    }
}

function cancelOrder(id, name, qt, btn) {
    let orderItems = JSON.parse(localStorage.getItem('my_orders') || '[]');
    orderItems = orderItems.filter(i => String(i.id) !== String(id));
    localStorage.setItem('my_orders', JSON.stringify(orderItems));
    
    let msg = `Здравствуйте! Я хочу отменить свой заказ:\n\n❌ ${name} - ${qt} шт\n\nПожалуйста, отмените его.`;
    let url = `https://wa.me/77752826666?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

function checkoutSingleOrder(id, name, btn) {
    let orderItems = JSON.parse(localStorage.getItem('my_orders') || '[]');
    let item = orderItems.find(i => String(i.id) === String(id));
    if (item) {
        let msg = `Здравствуйте! Хочу оформить этот заказ повторно:\n1. ${name} - ${item.qt} шт\n\nЖду ответа!`;
        let url = `https://wa.me/77752826666?text=${encodeURIComponent(msg)}`;
        window.location.href = url;
    }
}

function orderNow(id) {
    let cartItems = JSON.parse(localStorage.getItem('cart_products') || '[]');
    id = String(id);
    if (!cartItems.some(i => i.id === id)) {
        cartItems.push({ id: id, qt: 1 });
        localStorage.setItem('cart_products', JSON.stringify(cartItems));
    }
    window.location.href = 'checkout.html';
}

function toggleCart(id, btn) {
    let cartItems = JSON.parse(localStorage.getItem('cart_products') || '[]');
    id = String(id);
    if (cartItems.some(i => i.id === id)) {
        cartItems = cartItems.filter(i => i.id !== id);
        if (btn) btn.classList.remove('active');
    } else {
        cartItems.push({ id: id, qt: 1 });
        if (btn) btn.classList.add('active');
        localStorage.setItem('cart_products', JSON.stringify(cartItems));
        window.location.href = 'cart.html';
        return;
    }
    localStorage.setItem('cart_products', JSON.stringify(cartItems));
}

function toggleLike(id, btn) {
    let likedItems = JSON.parse(localStorage.getItem('liked_products') || '[]');
    id = String(id);
    if (likedItems.includes(id)) {
        likedItems = likedItems.filter(i => i !== id);
        btn.classList.remove('liked');
    } else {
        likedItems.push(id);
        btn.classList.add('liked');
    }
    localStorage.setItem('liked_products', JSON.stringify(likedItems));
}

window.allProductsData = [];
let allProductsData = [];

function renderProducts(products) {
    const productsContainer = document.querySelector('.papuler-products');
    if (!productsContainer) return;

    const isFavoritesPage = window.location.pathname.includes('hert.html');
    const isCartPage = window.location.pathname.includes('cart.html');
    const isOrdersPage = window.location.pathname.includes('orders.html');
    
    const likedItems = JSON.parse(localStorage.getItem('liked_products') || '[]');
    const cartItems = JSON.parse(localStorage.getItem('cart_products') || '[]');

    let displayProducts = products;

    if (isFavoritesPage) {
        displayProducts = products.filter(p => likedItems.includes(String(p.id)));
        if (displayProducts.length === 0 && products.length > 0) {
            productsContainer.innerHTML = '<h3 style="color: white; width: 100%; text-align: center; margin-top: 50px;">У вас пока нет избранных товаров ❤️</h3>';
            return;
        }
    }

    if (isOrdersPage) {
        const orderItems = JSON.parse(localStorage.getItem('my_orders') || '[]');
        displayProducts = products.filter(p => orderItems.some(c => String(c.id) === String(p.id)));
        productsContainer.className = 'cart-container show';
        if (displayProducts.length === 0 && products.length > 0) {
            productsContainer.innerHTML = '<h3 style="color: white; width: 100%; text-align: center; margin-top: 50px;">У вас пока нет заказов 📦</h3>';
            return;
        }
    }

    if (isCartPage) {
        displayProducts = products.filter(p => cartItems.some(c => String(c.id) === String(p.id)));
        productsContainer.className = 'cart-container animation-item show';
        if (displayProducts.length === 0 && products.length > 0) {
            productsContainer.innerHTML = '<h3 style="color: white; width: 100%; text-align: center; margin-top: 50px;">Ваша корзина пуста 🛒</h3>';
            const chkBtn = document.getElementById('checkout-block');
            if (chkBtn) chkBtn.style.display = 'none';
            return;
        } else if (products.length > 0) {
            const chkBtn = document.getElementById('checkout-block');
            if (chkBtn) chkBtn.style.display = 'block';
        }
    }

    productsContainer.innerHTML = '';
    if (displayProducts.length === 0) {
        productsContainer.innerHTML = '<h3 style="color: white; width: 100%; text-align: center; margin-top: 50px;">Товары не найдены 🔍</h3>';
        return;
    }

    displayProducts.forEach(p => {
        const inCart = cartItems.some(c => String(c.id) === String(p.id)) ? 'active' : '';

        if (isCartPage) {
            const cartItem = cartItems.find(c => String(c.id) === String(p.id));
            const qt = cartItem ? cartItem.qt : 1;
            productsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${p.img}" alt="img" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;" onerror="this.src='https://via.placeholder.com/300'">
                <div class="cart-item-info">
                    <div class="cart-item-name" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">${p.name}</div>
                    <div class="cart-item-desc">${p.desc}</div>
                    <div class="cart-item-price">${p.price}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="qt-controls">
                        <button onclick="changeCartQt('${p.id}', -1, this)">-</button>
                        <span class="qt-val">${qt} шт</span>
                        <button onclick="changeCartQt('${p.id}', 1, this)">+</button>
                    </div>
                    <button class="btn-remove-cart" onclick="toggleCart('${p.id}', null); setTimeout(() => window.location.reload(), 100);">Удалить</button>
                </div>
            </div>
            `;
        } else if (isOrdersPage) {
            const orderItems = JSON.parse(localStorage.getItem('my_orders') || '[]');
            const orderItem = orderItems.find(c => String(c.id) === String(p.id));
            const qt = orderItem ? orderItem.qt : 1;
            productsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${p.img}" alt="img" onerror="this.src='https://via.placeholder.com/300'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${p.name}</div>
                    <div class="cart-item-desc">${p.desc}</div>
                    <div class="cart-item-price">${p.price}</div>
                </div>
                <div class="cart-item-actions" style="flex-wrap: wrap; justify-content: flex-end; align-items: center;">
                    <span style="color: #ddd; font-size: 16px; margin-right: 15px;">Кол-во: ${qt} шт</span>
                    <div style="display:flex; gap:10px; margin-top: 10px; width: 100%; justify-content: flex-end;">
                        <button class="btn-remove-cart" style="background:#444;" onclick="cancelOrder('${p.id}', decodeURIComponent('${encodeURIComponent(p.name)}'), ${qt}, this); setTimeout(() => window.location.reload(), 100);">Отменить заказ</button>
                    </div>
                </div>
            </div>
            `;
        } else {
            productsContainer.innerHTML += `
            <div class="product-card">
                <div class="product-clickable" onclick="window.location.href='product.html?id=${p.id}'">
                    <img src="${p.img}" alt="img" onerror="this.src='https://via.placeholder.com/300'">
                    <h3>${p.name}</h3>
                    <p>${p.desc}</p>
                    <span>${p.price}</span>
                </div>
                <i class='bx bxs-star'>/5.0</i>
                <div class="action-buttons">
                    <button class="btn-contact" onclick="orderNow('${p.id}')">Заказать сейчас</button>
                    <button class="btn-icon btn-cart ${inCart}" onclick="event.stopPropagation(); toggleCart('${p.id}', this)"><i class='bx bxs-cart'></i></button>
                    <button class="btn-icon btn-heart ${likedItems.includes(String(p.id)) ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike('${p.id}', this)"><i class='bx bxs-heart'></i></button>
                </div>
            </div>
            `;
        }
    });
}

function initSearch() {
    const searchInput = document.getElementById('main-search-input');
    if (!searchInput) return;

    let searchDropdown = document.createElement('div');
    searchDropdown.className = 'search-dropdown';
    searchInput.parentElement.appendChild(searchDropdown);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = allProductsData.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.desc && p.desc.toLowerCase().includes(query))
        );

        const gridContainer = document.querySelector('.papuler-products');
        let isGridOnPage = !!gridContainer;
        let isGridVisible = false;
        
        if (isGridOnPage) {
            const rect = gridContainer.getBoundingClientRect();
            // Check if grid is visible in viewport
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                isGridVisible = true;
            }
        }

        // If on home/all_products but grid is just out of view or too far
        if (isGridVisible) {
            searchDropdown.classList.remove('active');
            renderProducts(filtered);
        } else {
            if (query.length === 0) {
                searchDropdown.classList.remove('active');
                if (isGridOnPage) renderProducts(allProductsData);
                return;
            }
            
            searchDropdown.innerHTML = '';
            if (filtered.length === 0) {
                searchDropdown.innerHTML = '<div style="padding: 15px 20px; color: #888; font-size:13px;">Ничего не найдено</div>';
            } else {
                const topResults = filtered.slice(0, 6);
                topResults.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'search-dropdown-item';
                    item.innerHTML = `
                        <img src="${p.img}" class="search-dropdown-img" onerror="this.src='https://via.placeholder.com/45'">
                        <div class="search-dropdown-info">
                            <h4 class="search-dropdown-title">${p.name}</h4>
                            <p class="search-dropdown-price">${p.price}</p>
                        </div>
                    `;
                    item.onclick = () => {
                        searchDropdown.classList.remove('active');
                        searchInput.value = p.name;
                        if (isGridOnPage) {
                            gridContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            renderProducts([p]);
                        } else {
                            window.location.href = `all_product.html?search=${encodeURIComponent(p.name)}`;
                        }
                    };
                    searchDropdown.appendChild(item);
                });

                if (filtered.length > 6) {
                    const more = document.createElement('div');
                    more.className = 'search-dropdown-item';
                    more.style.justifyContent = 'center';
                    more.innerHTML = `<span style="color: #fc5558; font-size: 12px; font-weight: 600;">Показать все результаты (${filtered.length})</span>`;
                    more.onclick = () => {
                        searchDropdown.classList.remove('active');
                        if (isGridOnPage) {
                            gridContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            renderProducts(filtered);
                        } else {
                            window.location.href = `all_product.html?search=${encodeURIComponent(query)}`;
                        }
                    };
                    searchDropdown.appendChild(more);
                }
            }
            searchDropdown.classList.add('active');
        }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    // Handle search query from URL on page load (for all_product.html)
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('search');
    if (urlQuery && document.querySelector('.papuler-products')) {
        setTimeout(() => {
            const filtered = allProductsData.filter(p => 
                p.name.toLowerCase().includes(urlQuery.toLowerCase())
            );
            if (filtered.length > 0) {
                renderProducts(filtered);
                searchInput.value = urlQuery;
                document.querySelector('.papuler-products').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }
}

function loadDynamicProducts() {
    fetch('/api/products')
        .then(res => res.json())
        .then(products => {
            allProductsData = products;
            window.allProductsData = products;
            
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('type');
            
            if (category) {
                const filtered = products.filter(p => p.category === category);
                renderProducts(filtered);
                
                // Update page title if needed
                const titleNode = document.querySelector('.header-container h1');
                if (titleNode && window.location.pathname.includes('category.html')) {
                    titleNode.innerText = category;
                }
                
                const productsTitle = document.querySelector('.papuler-product-container h2');
                if (productsTitle) {
                    productsTitle.innerText = `Товары: ${category}`;
                }
            } else {
                renderProducts(products);
            }
        })
        .catch(err => console.error("Could not fetch products", err));
}

document.addEventListener('DOMContentLoaded', () => {
    loadDynamicProducts();
    initSearch();
});


