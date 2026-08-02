(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (cents) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(cents / 100);
    } catch (e) {
      return `₹${Math.round(cents / 100)}`;
    }
  };

  /* Announcement rotator */
  const ann = qs('[data-announcement]');
  if (ann && ann.dataset.rotate === 'true') {
    const items = qsa('[data-announcement-item]', ann);
    if (items.length > 1) {
      let i = 0;
      const interval = Number(ann.dataset.interval || 4000);
      setInterval(() => {
        items[i].hidden = true;
        items[i].classList.remove('is-active');
        i = (i + 1) % items.length;
        items[i].hidden = false;
        items[i].classList.add('is-active');
      }, interval);
    }
  }

  /* Header scroll state */
  const header = qs('[data-header]');
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* Mobile drawer */
  const drawer = qs('[data-mobile-drawer]');
  const overlay = qs('[data-overlay]');
  const openNav = () => {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closeNav = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay && !qs('[data-cart-drawer]')?.classList.contains('is-open')) {
      overlay.hidden = true;
      document.body.style.overflow = '';
    }
  };
  qsa('[data-nav-toggle]').forEach((btn) => btn.addEventListener('click', openNav));
  qsa('[data-nav-close]').forEach((btn) => btn.addEventListener('click', closeNav));

  /* Reveal */
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
      { threshold: 0.14, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Cart drawer */
  const cartDrawer = qs('[data-cart-drawer]');
  const openDrawer = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const cartBtn = qs('.icon-btn--cart');
    if (cartBtn) {
      cartBtn.classList.add('is-bump');
      setTimeout(() => cartBtn.classList.remove('is-bump'), 350);
    }
  };
  const closeDrawer = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    if (overlay && !drawer?.classList.contains('is-open')) {
      overlay.hidden = true;
      document.body.style.overflow = '';
    }
  };
  qsa('[data-cart-open]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    })
  );
  qsa('[data-cart-close]').forEach((btn) => btn.addEventListener('click', closeDrawer));
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeDrawer();
      closeNav();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeNav();
    }
  });

  const updateCartCount = (count) => {
    qsa('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
      el.hidden = count < 1;
    });
  };

  const updateProgress = (totalCents) => {
    const root = qs('[data-offer-progress]');
    if (!root || !window.themeSettings?.progress?.enabled) return;
    const tiers = window.themeSettings.progress.tiers || [];
    const max = tiers[tiers.length - 1]?.amount || 1;
    const pct = Math.max(0, Math.min(100, (totalCents / max) * 100));
    const fill = qs('[data-progress-fill]', root);
    const msg = qs('[data-progress-msg]', root);
    if (fill) fill.style.width = `${pct}%`;
    if (!msg) return;
    const next = tiers.find((t) => totalCents < t.amount);
    if (!next) {
      msg.textContent = `Unlocked: ${tiers.map((t) => t.label).join(' · ')}`;
    } else {
      msg.textContent = `Spend ${money(next.amount - totalCents)} more for ${next.label}`;
    }
  };

  const renderCartDrawer = async () => {
    if (!cartDrawer) return null;
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      updateCartCount(cart.item_count);
      updateProgress(cart.total_price);
      const body = qs('[data-cart-body]', cartDrawer);
      const subtotal = qs('[data-cart-subtotal]', cartDrawer);
      if (body) {
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
                <div class="muted" style="font-size:0.82rem;margin-bottom:0.35rem;">Qty ${item.quantity}</div>
                <div style="font-weight:600;">${money(item.final_line_price)}</div>
              </div>
            </div>`
            )
            .join('');
        }
      }
      if (subtotal) subtotal.textContent = money(cart.total_price);
      return cart;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  /* Gallery */
  const gallery = qs('[data-product-gallery]');
  if (gallery) {
    const mainImg = qs('[data-gallery-main]', gallery);
    qsa('[data-gallery-thumb]', gallery).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (mainImg && thumb.dataset.src) {
          mainImg.src = thumb.dataset.src;
          if (thumb.dataset.srcset) mainImg.srcset = thumb.dataset.srcset;
        }
        qsa('[data-gallery-thumb]', gallery).forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }

  /* Pack picker — honest qty packs */
  const packRoot = qs('[data-pack-picker]');
  if (packRoot) {
    const options = qsa('[data-pack-option]', packRoot);
    const priceEl = qs('[data-pack-price]');
    const compareEl = qs('[data-pack-compare]');
    const saveEl = qs('[data-pack-save]');
    const qtyInput = qs('[data-qty-input]');
    const stickyPrice = qs('[data-sticky-price]');

    const selectPack = (option) => {
      options.forEach((opt) => opt.classList.remove('is-selected'));
      option.classList.add('is-selected');
      const qty = Number(option.dataset.qty || 1);
      const total = Number(option.dataset.total || Number(option.dataset.price || 0) * qty);
      const compare = Number(option.dataset.compare || 0);
      if (qtyInput) qtyInput.value = String(qty);
      if (priceEl) priceEl.textContent = money(total);
      if (stickyPrice) stickyPrice.textContent = money(total);
      if (compareEl) {
        if (compare > total) {
          compareEl.hidden = false;
          compareEl.textContent = money(compare);
        } else {
          compareEl.hidden = true;
        }
      }
      if (saveEl) {
        if (compare > total) {
          saveEl.hidden = false;
          const pct = Math.round(((compare - total) / compare) * 100);
          saveEl.textContent = `Save ${pct}%`;
        } else {
          saveEl.hidden = true;
        }
      }
    };

    options.forEach((option) => option.addEventListener('click', () => selectPack(option)));
    const selected = qs('.pack-option.is-selected', packRoot) || options[0];
    if (selected) selectPack(selected);
  }

  /* Qty */
  qsa('[data-qty]').forEach((wrap) => {
    const input = qs('input', wrap);
    qsa('button', wrap).forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = Math.max(1, Number(input.value || 1) + Number(btn.dataset.delta || 0));
        input.value = String(next);
      });
    });
  });

  /* Ajax ATC */
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
      try {
        const res = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(productForm)
        });
        if (!res.ok) throw new Error('Add failed');
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

  /* FBT multi-add */
  qsa('[data-fbt-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const items = [];
      fd.forEach((value, key) => {
        const match = key.match(/^items\[(\d+)\]\[(id|quantity)\]$/);
        if (!match) return;
        const idx = Number(match[1]);
        items[idx] = items[idx] || {};
        items[idx][match[2]] = Number(value);
      });
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: items.filter(Boolean) })
        });
        if (!res.ok) throw new Error('FBT add failed');
        await renderCartDrawer();
        openDrawer();
      } catch (err) {
        console.error(err);
        form.submit();
      }
    });
  });

  /* Sticky ATC */
  const sticky = qs('[data-sticky-atc]');
  const trigger = qs('[data-atc-anchor]');
  if (sticky && trigger && 'IntersectionObserver' in window) {
    document.body.classList.add('has-sticky-atc');
    const io = new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(trigger);
    const stickyBtn = qs('[data-sticky-submit]', sticky);
    if (stickyBtn && productForm) {
      stickyBtn.addEventListener('click', () => productForm.requestSubmit());
    }
  }

  /* FAQ */
  qsa('[data-faq]').forEach((list) => {
    qsa('[data-faq-toggle]', list).forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const open = item.classList.contains('is-open');
        qsa('.faq-item', list).forEach((el) => {
          el.classList.remove('is-open');
          qs('[data-faq-toggle]', el)?.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  /* Ripple */
  qsa('[data-ripple]').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
      circle.classList.add('ripple');
      btn.querySelector('.ripple')?.remove();
      btn.appendChild(circle);
    });
  });

  /* Magnetic buttons (desktop only) */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    qsa('.btn--magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* Scroll progress */
  const progress = qs('[data-scroll-progress]');
  if (progress) {
    const updateProgressBar = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progress.style.width = `${pct}%`;
    };
    updateProgressBar();
    window.addEventListener('scroll', updateProgressBar, { passive: true });
  }

  /* GSAP subtle motion */
  const initMotion = () => {
    if (!window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.hero__content').forEach((el) => {
      gsap.from(el, { y: 22, opacity: 0, duration: 0.55, ease: 'power2.out' });
    });

    gsap.utils.toArray('.mask-reveal').forEach((el) => {
      gsap.to(el, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
      el.style.clipPath = 'inset(0 0 100% 0)';
    });

    gsap.utils.toArray('.product-gallery__main img, .float-media').forEach((el) => {
      gsap.to(el, {
        y: -8,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });

    gsap.utils.toArray('.pack-option, .ingredient, .ba-card, .timeline-step').forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        y: 18,
        opacity: 0,
        duration: 0.45,
        delay: Math.min(i * 0.03, 0.18),
        ease: 'power2.out'
      });
    });
  };
  if (window.gsap) initMotion();
  else window.addEventListener('load', () => setTimeout(initMotion, 40));

  /* Init cart */
  fetch('/cart.js')
    .then((r) => r.json())
    .then((cart) => {
      updateCartCount(cart.item_count);
      updateProgress(cart.total_price);
    })
    .catch(() => {});

  window.JustNatur = { openDrawer, closeDrawer, renderCartDrawer, money };
})();
