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

  function buildTOC(root) {
    var toc = root.querySelector('[data-cvv-toc]');
    if (!toc) return;

    var headings = root.querySelectorAll('h2, h3');
    if (!headings.length) return;

    var ul = document.createElement('ul');
    ul.className = 'cvv-toc';

    headings.forEach(function (heading, idx) {
      var text = heading.textContent.trim();
      if (!text) return;
      if (!heading.id) {
        heading.id = slugify(text) || ('section-' + (idx + 1));
      }

      var li = document.createElement('li');
      if (heading.tagName.toLowerCase() === 'h3') {
        li.style.marginLeft = '0.9rem';
      }

      var a = document.createElement('a');
      a.href = '#' + heading.id;
      a.textContent = text;

      li.appendChild(a);
      ul.appendChild(li);
    });

    toc.innerHTML = '';
    toc.appendChild(ul);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var roots = document.querySelectorAll('.cvv-article');
    roots.forEach(buildTOC);
  });
})();
