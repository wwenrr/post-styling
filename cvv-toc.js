(function () {
  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function ensureCss(root) {
    var href = root && root.getAttribute('data-cvv-css');
    if (!href) return;

    var existing = document.querySelector('link[data-cvv-css="' + href + '"]') ||
      document.querySelector('link[href="' + href + '"]');
    if (existing) return;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-cvv-css', href);
    document.head.appendChild(link);
  }

  function buildTOC(root) {
    var toc = root.querySelector('[data-cvv-toc]');
    if (!toc) return;

    var headings = root.querySelectorAll('h2, h3');
    if (!headings.length) return;

    var ul = document.createElement('ul');
    ul.className = 'cvv-toc';

    var currentH2Item = null;
    var currentH3List = null;

    headings.forEach(function (heading, idx) {
      var text = heading.textContent.trim();
      if (!text) return;
      if (!heading.id) {
        heading.id = slugify(text) || ('section-' + (idx + 1));
      }

      var tag = heading.tagName.toLowerCase();

      if (tag === 'h2') {
        var li = document.createElement('li');
        li.className = 'cvv-toc-item cvv-toc-item-h2';

        var row = document.createElement('div');
        row.className = 'cvv-toc-row';

        var a = document.createElement('a');
        a.href = '#' + heading.id;
        a.textContent = text;
        a.className = 'cvv-toc-link cvv-toc-link-h2';

        var sub = document.createElement('ul');
        sub.className = 'cvv-toc-sublist';

        row.appendChild(a);
        li.appendChild(row);
        li.appendChild(sub);
        ul.appendChild(li);

        currentH2Item = li;
        currentH3List = sub;
        return;
      }

      var h3li = document.createElement('li');
      h3li.className = 'cvv-toc-item cvv-toc-item-h3';

      var h3row = document.createElement('div');
      h3row.className = 'cvv-toc-row';

      var h3a = document.createElement('a');
      h3a.href = '#' + heading.id;
      h3a.textContent = text;
      h3a.className = 'cvv-toc-link cvv-toc-link-h3';

      h3row.appendChild(h3a);
      h3li.appendChild(h3row);

      if (currentH3List) {
        currentH3List.appendChild(h3li);
      } else {
        ul.appendChild(h3li);
      }
    });

    ul.querySelectorAll('.cvv-toc-item-h2').forEach(function (item) {
      var sub = item.querySelector('.cvv-toc-sublist');
      var row = item.querySelector('.cvv-toc-row');
      if (!sub || !row) return;

      var hasChildren = sub.children.length > 0;
      if (!hasChildren) {
        sub.remove();
        return;
      }

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cvv-toc-toggle';
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Thu gọn mục lục con');
      btn.textContent = '';
      btn.setAttribute('title', 'Thu gọn/mở rộng mục lục con');

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        btn.textContent = '';
        btn.setAttribute('aria-label', expanded ? 'Mở rộng mục lục con' : 'Thu gọn mục lục con');
        item.classList.toggle('is-collapsed', expanded);
      });

      row.insertBefore(btn, row.firstChild);
    });

    toc.innerHTML = '';
    toc.appendChild(ul);

    var wrap = toc.closest('.cvv-toc-wrap');
    if (wrap && !wrap.querySelector('.cvv-toc-head')) {
      var titleEl = wrap.querySelector('.cvv-toc-title');
      var label = (titleEl && titleEl.textContent && titleEl.textContent.trim()) || 'Table of contents';

      var headBtn = document.createElement('button');
      headBtn.type = 'button';
      headBtn.className = 'cvv-toc-head';
      headBtn.setAttribute('aria-expanded', 'true');
      headBtn.innerHTML = '<span class="cvv-toc-head-label">' + label + '</span><span class="cvv-toc-head-arrow" aria-hidden="true"></span>';

      headBtn.addEventListener('click', function () {
        var expanded = headBtn.getAttribute('aria-expanded') === 'true';
        headBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        wrap.classList.toggle('is-toc-collapsed', expanded);
      });

      wrap.insertBefore(headBtn, toc);
      if (titleEl) {
        titleEl.remove();
      }
    }

    if (wrap && !wrap.querySelector('.cvv-toc-collapse-all')) {
      var collapseAll = document.createElement('button');
      collapseAll.type = 'button';
      collapseAll.className = 'cvv-toc-collapse-all';
      collapseAll.textContent = 'Thu gọn tất cả';
      collapseAll.setAttribute('data-state', 'expanded');

      collapseAll.addEventListener('click', function () {
        var collapsing = collapseAll.getAttribute('data-state') === 'expanded';
        ul.querySelectorAll('.cvv-toc-toggle').forEach(function (btn) {
          var item = btn.closest('.cvv-toc-item-h2');
          if (!item) return;
          btn.setAttribute('aria-expanded', collapsing ? 'false' : 'true');
          btn.textContent = '';
          btn.setAttribute('aria-label', collapsing ? 'Mở rộng mục lục con' : 'Thu gọn mục lục con');
          item.classList.toggle('is-collapsed', collapsing);
        });
        collapseAll.setAttribute('data-state', collapsing ? 'collapsed' : 'expanded');
        collapseAll.textContent = collapsing ? 'Mở rộng tất cả' : 'Thu gọn tất cả';
      });

      wrap.appendChild(collapseAll);
    }
  }

  function enhanceFAQ(root) {
    var faq = root.querySelector('.cvv-faq');
    if (!faq) return;

    var items = faq.querySelectorAll('.cvv-faq-item');
    if (!items.length) return;

    items.forEach(function (item, idx) {
      if (item.querySelector('.cvv-faq-trigger')) return;

      var q = item.querySelector('.cvv-faq-q') || item.querySelector('h3, h4, strong');
      var a = item.querySelector('.cvv-faq-a') || item.querySelector('p');
      if (!q || !a) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cvv-faq-trigger';
      btn.innerHTML = '<span class="cvv-faq-trigger-text">' + q.textContent.trim() + '</span><span class="cvv-faq-trigger-arrow" aria-hidden="true"></span>';

      var open = idx === 0;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-open', open);

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        item.classList.toggle('is-open', !expanded);
      });

      q.replaceWith(btn);
      if (!a.classList.contains('cvv-faq-a')) {
        a.classList.add('cvv-faq-a');
      }
    });
  }

  function boot() {
    var roots = document.querySelectorAll('.cvv-article');
    roots.forEach(function (root) {
      ensureCss(root);
      buildTOC(root);
      enhanceFAQ(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
