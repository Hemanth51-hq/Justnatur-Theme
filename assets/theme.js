(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (cents, currency = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'INR') => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(cents / 100);
    } catch (e) {
      return `₹${(cents / 100).toFixed(0)}`;
    }
  };

  /* Reveal on scroll */
  const revealEls = qsa('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Mobile nav */
  const navToggle = qs('[data-nav-toggle]');
  const mobileNav = qs('[data-mobile-nav]');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Overlay + drawer helpers */
  const overlay = qs('[data-overlay]');
  const cartDrawer = qs('[data-cart-drawer]');

  const openDrawer = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
  };

  qsa('[data-cart-open]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openDrawer();
  }));

  qsa('[data-cart-close]').forEach((btn) => btn.addEventListener('click', closeDrawer));
  if (overlay) overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  const updateCartCount = (count) => {
    qsa('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
      el.hidden = count < 1;
    });
  };

  const renderCartDrawer = async () => {
    if (!cartDrawer) return;
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      updateCartCount(cart.item_count);
      const body = qs('[data-cart-body]', cartDrawer);
      const subtotal = qs('[data-cart-subtotal]', cartDrawer);
      if (!body) return;

      if (!cart.items.length) {
        body.innerHTML = `<div class="cart-empty"><p>${cartDrawer.dataset.emptyMessage || 'Your cart is empty'}</p></div>`;
      } else {
        body.innerHTML = cart.items
          .map(
            (item) => `
          <div class="cart-item">
            <img src="${item.image || ''}" alt="${item.product_title}" loading="lazy" width="72" height="72">
            <div>
              <div class="cart-item__title">${item.product_title}</div>
              <div class="muted" style="font-size:0.82rem;margin-bottom:0.35rem;">${item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title + ' · ' : ''}Qty ${item.quantity}</div>
              <div style="font-weight:600;">${money(item.final_line_price)}</div>
            </div>
          </div>`
          )
          .join('');
      }
      if (subtotal) subtotal.textContent = money(cart.total_price);
    } catch (err) {
      console.error(err);
    }
  };

  /* Product gallery */
  const gallery = qs('[data-product-gallery]');
  if (gallery) {
    const mainImg = qs('[data-gallery-main]', gallery);
    qsa('[data-gallery-thumb]', gallery).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.src;
        const srcset = thumb.dataset.srcset;
        if (mainImg && src) {
          mainImg.src = src;
          if (srcset) mainImg.srcset = srcset;
        }
        qsa('[data-gallery-thumb]', gallery).forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }

  /* Pack picker / combo */
  const packRoot = qs('[data-pack-picker]');
  if (packRoot) {
    const options = qsa('[data-pack-option]', packRoot);
    const priceEl = qs('[data-pack-price]');
    const compareEl = qs('[data-pack-compare]');
    const qtyInput = qs('[data-qty-input]');
    const stickyPrice = qs('[data-sticky-price]');

    const selectPack = (option) => {
      options.forEach((opt) => {
        opt.classList.remove('is-selected');
        const slots = qs('.combo-slots', opt);
        if (slots) slots.classList.remove('is-active');
      });
      option.classList.add('is-selected');
      const slots = qs('.combo-slots', option);
      if (slots && Number(option.dataset.qty || 1) > 1) slots.classList.add('is-active');

      const unit = Number(option.dataset.price || 0);
      const compare = Number(option.dataset.compare || 0);
      const qty = Number(option.dataset.qty || 1);
      if (qtyInput) qtyInput.value = String(qty);
      if (priceEl) priceEl.textContent = money(unit * qty);
      if (compareEl) {
        if (compare > unit) {
          compareEl.hidden = false;
          compareEl.textContent = money(compare * qty);
        } else {
          compareEl.hidden = true;
        }
      }
      if (stickyPrice) stickyPrice.textContent = money(unit * qty);
    };

    options.forEach((option) => {
      option.addEventListener('click', () => selectPack(option));
    });

    const selected = qs('.pack-option.is-selected', packRoot) || options[0];
    if (selected) selectPack(selected);
  }

  /* Quantity controls */
  qsa('[data-qty]').forEach((wrap) => {
    const input = qs('input', wrap);
    qsa('button', wrap).forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.delta || 0);
        const next = Math.max(1, Number(input.value || 1) + delta);
        input.value = String(next);
      });
    });
  });

  /* Ajax add to cart */
  const productForm = qs('[data-product-form]');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = qs('[type="submit"]', productForm);
      const original = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding…';
      }

      const formData = new FormData(productForm);
      try {
        const res = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData
        });
        if (!res.ok) throw new Error('Add to cart failed');
        await renderCartDrawer();
        openDrawer();
      } catch (err) {
        console.error(err);
        window.location.href = '/cart';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
      }
    });
  }

  /* Sticky ATC visibility */
  const sticky = qs('[data-sticky-atc]');
  const trigger = qs('[data-atc-anchor]');
  if (sticky && trigger && 'IntersectionObserver' in window) {
    document.body.classList.add('has-sticky-atc');
    const io = new IntersectionObserver(
      ([entry]) => {
        sticky.classList.toggle('is-visible', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(trigger);

    const stickyBtn = qs('[data-sticky-submit]', sticky);
    if (stickyBtn && productForm) {
      stickyBtn.addEventListener('click', () => {
        productForm.requestSubmit();
      });
    }
  }

  /* Init cart count */
  fetch('/cart.js')
    .then((r) => r.json())
    .then((cart) => updateCartCount(cart.item_count))
    .catch(() => {});

  window.JustNatur = { openDrawer, closeDrawer, renderCartDrawer, money };
})();
