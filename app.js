/* ==========================================================================
   Interactive Behavior — Первая мировая война 1914–1918 гг. (10 класс)
   ========================================================================== */

(function () {
  'use strict';

  // 1. Reading Progress Bar
  const progressBar = document.getElementById('readingProgressBar');
  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    progressBar.style.width = pct.toFixed(1) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // 2. Mobile Sidebar Drawer
  const sidebar = document.getElementById('sidebarNav');
  const mobileToggle = document.getElementById('mobileMenuBtn');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function () {
      const open = sidebar.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });
    sidebar.querySelectorAll('a.toc-link').forEach(function (link) {
      link.addEventListener('click', function () {
        sidebar.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Active TOC Highlighting via IntersectionObserver
  const tocLinks = Array.from(document.querySelectorAll('.toc-link[href^="#"]'));
  const observedSections = tocLinks
    .map(function (link) {
      const id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    })
    .filter(Boolean);

  function setActiveToc(id) {
    tocLinks.forEach(function (link) {
      const match = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', match);
    });
  }

  if ('IntersectionObserver' in window && observedSections.length > 0) {
    const observer = new IntersectionObserver(
      function (entries) {
        const visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        if (visible.length > 0) {
          setActiveToc(visible[0].target.id);
        }
      },
      { rootMargin: '-12% 0px -68% 0px', threshold: 0.01 }
    );
    observedSections.forEach(function (sec) { observer.observe(sec); });
  }

  // 4. Interactive Timeline Filtering
  const filterButtons = Array.from(document.querySelectorAll('.filter-pill[data-filter]'));
  const timelineItems = Array.from(document.querySelectorAll('.timeline-item[data-year]'));

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetYear = btn.getAttribute('data-filter');
      filterButtons.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      timelineItems.forEach(function (item) {
        const year = item.getAttribute('data-year');
        const show = targetYear === 'all' || year === targetYear;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  // 5. Documentary Reel Pause / Play (Canvas Frame Freeze)
  const reelFigures = Array.from(document.querySelectorAll('.reel-figure'));

  reelFigures.forEach(function (figure) {
    const pauseBtn = figure.querySelector('.reel-pause-btn');
    const img = figure.querySelector('.reel-stage img');
    const canvas = figure.querySelector('.reel-stage canvas.reel-freeze');
    if (!pauseBtn || !img || !canvas) return;

    pauseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isPaused = figure.classList.contains('is-paused');
      if (!isPaused) {
        const w = img.naturalWidth || img.clientWidth || 480;
        const h = img.naturalHeight || img.clientHeight || 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            ctx.drawImage(img, 0, 0, w, h);
          } catch (_err) {
            // Fallback if browser restricts canvas draw
          }
        }
        figure.classList.add('is-paused');
        pauseBtn.textContent = '▶ Пуск';
        pauseBtn.setAttribute('aria-pressed', 'true');
      } else {
        figure.classList.remove('is-paused');
        pauseBtn.textContent = '❚❚ Пауза';
        pauseBtn.setAttribute('aria-pressed', 'false');
      }
    });
  });

  // 6. Lightbox Modal for Documentary GIFs
  const lightbox = document.getElementById('reelLightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbTitle = document.getElementById('lightboxTitle');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbSource = document.getElementById('lightboxSource');
  const lbClose = document.getElementById('lightboxClose');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  const lbCounter = document.getElementById('lightboxCounter');

  let currentReelIndex = 0;

  const reelsData = reelFigures.map(function (fig) {
    const img = fig.querySelector('.reel-stage img');
    return {
      src: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : '',
      title: fig.getAttribute('data-title') || '',
      caption: fig.getAttribute('data-caption') || '',
      sourceFilm: fig.getAttribute('data-source-film') || '',
      sourceUrl: fig.getAttribute('data-source-url') || ''
    };
  });

  function renderLightbox(index) {
    if (!reelsData.length) return;
    currentReelIndex = (index + reelsData.length) % reelsData.length;
    const item = reelsData[currentReelIndex];
    if (lbImg) {
      lbImg.src = item.src;
      lbImg.alt = item.alt;
    }
    if (lbTitle) lbTitle.textContent = item.title;
    if (lbCaption) lbCaption.textContent = item.caption;
    if (lbSource) {
      lbSource.innerHTML = '';
      const prefix = document.createTextNode('Архивный источник: ' + item.sourceFilm + ' ');
      lbSource.appendChild(prefix);
      if (item.sourceUrl) {
        const link = document.createElement('a');
        link.href = item.sourceUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '(открыть архив)';
        lbSource.appendChild(link);
      }
    }
    if (lbCounter) {
      lbCounter.textContent = 'Кадр ' + (currentReelIndex + 1) + ' из ' + reelsData.length;
    }
  }

  function openLightbox(index) {
    if (!lightbox || !reelsData.length) return;
    renderLightbox(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  reelFigures.forEach(function (fig, idx) {
    const stage = fig.querySelector('.reel-stage');
    const expandBtn = fig.querySelector('.reel-expand-btn');
    if (stage) {
      stage.addEventListener('click', function () { openLightbox(idx); });
    }
    if (expandBtn) {
      expandBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openLightbox(idx);
      });
    }
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { renderLightbox(currentReelIndex - 1); });
  if (lbNext) lbNext.addEventListener('click', function () { renderLightbox(currentReelIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') renderLightbox(currentReelIndex - 1);
    if (e.key === 'ArrowRight') renderLightbox(currentReelIndex + 1);
  });

  // 7. Print Action
  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }
})();
