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
      btn.textContent = '▾';

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        btn.textContent = expanded ? '▸' : '▾';
        item.classList.toggle('is-collapsed', expanded);
      });

      row.insertBefore(btn, row.firstChild);
    });

    toc.innerHTML = '';
    toc.appendChild(ul);

    var wrap = toc.closest('.cvv-toc-wrap');
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
          btn.textContent = collapsing ? '▸' : '▾';
          item.classList.toggle('is-collapsed', collapsing);
        });
        collapseAll.setAttribute('data-state', collapsing ? 'collapsed' : 'expanded');
        collapseAll.textContent = collapsing ? 'Mở rộng tất cả' : 'Thu gọn tất cả';
      });

      wrap.appendChild(collapseAll);
    }
  }

  function boot() {
    var roots = document.querySelectorAll('.cvv-article');
    roots.forEach(function (root) {
      ensureCss(root);
      buildTOC(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
