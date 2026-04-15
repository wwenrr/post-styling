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

  function hasFaqKeyword(text) {
    var value = String(text || '').trim();
    if (!value) return false;

    var folded = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return /\bfaq\b/.test(folded) || /\bcau hoi thuong gap\b/.test(folded);
  }

  function cleanFaqQuestion(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/^faq\s*[:：-]\s*/i, '')
      .replace(/^\d+\s*[\)\].:-]\s*/, '')
      .trim();
  }

  function textFromHtml(html) {
    if (!html) return '';

    var holder = document.createElement('div');
    holder.innerHTML = html;
    return holder.textContent ? holder.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function parseFaqListItem(item) {
    var rawHtml = (item && item.innerHTML ? item.innerHTML : '').trim();
    if (!rawHtml) return null;

    var segments = rawHtml.split(/<br\s*\/?>/i);
    var questionHtml = segments.shift() || '';
    var questionText = cleanFaqQuestion(textFromHtml(questionHtml));
    if (!questionText) {
      questionText = cleanFaqQuestion(textFromHtml(rawHtml));
    }
    if (!questionText) return null;

    var answerHtml = segments.join('<br>').trim();
    return {
      questionText: questionText,
      answerHtml: answerHtml
    };
  }

  function buildFaqItem(questionText, answerHtml) {
    if (!questionText) return null;

    var item = document.createElement('li');
    item.className = 'cvv-list-item cvv-faq-item';

    var question = document.createElement('span');
    question.className = 'cvv-faq-question';
    question.textContent = questionText;
    item.appendChild(question);

    if (answerHtml) {
      var answer = document.createElement('div');
      answer.className = 'cvv-faq-answer';
      answer.innerHTML = answerHtml;
      item.appendChild(answer);
    }

    return item;
  }

  function buildFaqContainer() {
    var wrap = document.createElement('div');
    wrap.className = 'cvv-faq';

    var list = document.createElement('ol');
    list.className = 'cvv-list cvv-list-ol cvv-faq-list';
    wrap.appendChild(list);

    return { wrap: wrap, list: list };
  }

  function normalizeFaqFromLegacyHeadings(faqHeading) {
    var cursor = faqHeading.nextElementSibling;
    var qaPairs = [];

    while (cursor && cursor.tagName !== 'H2') {
      if (cursor.tagName === 'H3') {
        var questionNode = cursor;
        var answerNodes = [];

        cursor = cursor.nextElementSibling;
        while (cursor && cursor.tagName !== 'H2' && cursor.tagName !== 'H3') {
          var next = cursor.nextElementSibling;
          var hasRuntimeScript = cursor.querySelector && cursor.querySelector('script[src*="cvv-toc.js"]');
          if (!hasRuntimeScript) {
            answerNodes.push(cursor);
          }
          cursor = next;
        }

        qaPairs.push({ questionNode: questionNode, answerNodes: answerNodes });
        continue;
      }

      cursor = cursor.nextElementSibling;
    }

    if (!qaPairs.length) return null;

    var container = buildFaqContainer();
    qaPairs.forEach(function (pair) {
      var questionText = cleanFaqQuestion(pair.questionNode.textContent);
      if (!questionText) return;

      var answer = document.createElement('div');
      answer.className = 'cvv-faq-a';
      pair.answerNodes.forEach(function (node) {
        answer.appendChild(node);
      });

      var item = buildFaqItem(questionText, answer.innerHTML);
      if (!item) return;

      container.list.appendChild(item);
      pair.questionNode.remove();
    });

    return container.list.children.length ? container.wrap : null;
  }

  function normalizeFaqFromOrderedList(faqHeading) {
    var cursor = faqHeading.nextElementSibling;
    var targetList = null;

    while (cursor && cursor.tagName !== 'H2') {
      if (
        cursor.tagName === 'OL' &&
        cursor.classList &&
        cursor.classList.contains('cvv-list-ol') &&
        !cursor.classList.contains('cvv-faq-list')
      ) {
        targetList = cursor;
        break;
      }

      cursor = cursor.nextElementSibling;
    }

    if (!targetList) return null;

    var container = buildFaqContainer();
    Array.from(targetList.children).forEach(function (node) {
      if (!node || node.tagName !== 'LI') return;

      var parsed = parseFaqListItem(node);
      if (!parsed) return;

      var item = buildFaqItem(parsed.questionText, parsed.answerHtml);
      if (!item) return;
      container.list.appendChild(item);
    });

    if (!container.list.children.length) return null;

    targetList.replaceWith(container.wrap);
    return container.wrap;
  }

  function normalizeFaqFromStandaloneOrderedList(root) {
    var normalized = [];

    Array.from(root.querySelectorAll('ol.cvv-list-ol:not(.cvv-faq-list)')).forEach(function (list) {
      if (!list || list.closest('.cvv-faq')) return;

      var parsedItems = Array.from(list.children)
        .filter(function (node) { return node && node.tagName === 'LI'; })
        .map(function (node) { return parseFaqListItem(node); });

      if (!parsedItems.length) return;
      if (!parsedItems.every(function (item) { return !!item; })) return;

      var container = buildFaqContainer();
      parsedItems.forEach(function (parsed) {
        var item = buildFaqItem(parsed.questionText, parsed.answerHtml);
        if (item) container.list.appendChild(item);
      });

      if (!container.list.children.length) return;

      list.replaceWith(container.wrap);
      normalized.push(container.wrap);
    });

    return normalized;
  }

  function cleanTocLabel(text) {
    var source = String(text || '').replace(/\s+/g, ' ').trim();
    if (!source) return source;

    var normalized = source
      .replace(/^\d+(?:\.\d+)+(?:\s*[\)\].:-])?\s*/, '')
      .replace(/^\d+\s*[\)\].:-]\s*/, '')
      .trim();

    return normalized || source;
  }

  function normalizeLegacyFaq(root) {
    var normalized = [];

    Array.from(root.querySelectorAll('h2')).forEach(function (faqHeading) {
      if (!hasFaqKeyword(faqHeading.textContent)) return;
      if (faqHeading.dataset.cvvFaqNormalized === '1') return;

      var wrap = normalizeFaqFromLegacyHeadings(faqHeading);
      if (!wrap) {
        wrap = normalizeFaqFromOrderedList(faqHeading);
      }
      if (!wrap) return;

      if (!wrap.parentNode) {
        faqHeading.insertAdjacentElement('afterend', wrap);
      }

      faqHeading.dataset.cvvFaqNormalized = '1';
      normalized.push(wrap);
    });

    normalizeFaqFromStandaloneOrderedList(root).forEach(function (wrap) {
      normalized.push(wrap);
    });

    return normalized;
  }

  function setFaqItemState(item, btn, open) {
    var answer = item.querySelector('.cvv-faq-a');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!answer) return;

    answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '0px';
    answer.style.opacity = open ? '1' : '0';
  }

  function buildTOC(root) {
    var headings = root.querySelectorAll('h2, h3');
    if (!headings.length) return;

    var toc = root.querySelector('[data-cvv-toc]');
    var wrap = toc ? toc.closest('.cvv-toc-wrap') : null;
    if (!toc) {
      wrap = document.createElement('nav');
      wrap.className = 'cvv-toc-wrap';
      wrap.setAttribute('aria-label', 'Table of contents');

      var title = document.createElement('div');
      title.className = 'cvv-toc-title';
      title.textContent = 'Table of contents';

      toc = document.createElement('div');
      toc.setAttribute('data-cvv-toc', '');

      wrap.appendChild(title);
      wrap.appendChild(toc);
    }

    if (wrap) {
      var firstH2 = root.querySelector('h2');
      if (firstH2) {
        root.insertBefore(wrap, firstH2);
      } else if (wrap.parentNode !== root) {
        root.insertBefore(wrap, root.firstChild);
      }
    }

    var ul = document.createElement('ul');
    ul.className = 'cvv-toc';

    function setTocSectionExpanded(item, btn, expanded) {
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.textContent = '';
      btn.setAttribute('aria-label', expanded ? 'Thu gọn mục lục con' : 'Mở rộng mục lục con');
      item.classList.toggle('is-collapsed', !expanded);
    }

    var currentH2Item = null;
    var currentH3List = null;

    headings.forEach(function (heading, idx) {
      var text = heading.textContent.trim();
      if (!text) return;
      var label = cleanTocLabel(text);
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
        a.textContent = label;
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
      h3a.textContent = label;
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
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Mở rộng mục lục con');
      btn.textContent = '';
      btn.setAttribute('title', 'Mở rộng/thu gọn mục lục con');

      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        setTocSectionExpanded(item, btn, !expanded);
      });

      row.addEventListener('click', function (event) {
        if (event.target.closest('.cvv-toc-link')) return;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        setTocSectionExpanded(item, btn, !expanded);
      });

      row.insertBefore(btn, row.firstChild);
      setTocSectionExpanded(item, btn, false);
    });

    toc.innerHTML = '';
    toc.appendChild(ul);

    wrap = toc.closest('.cvv-toc-wrap');
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
      collapseAll.textContent = 'Mở rộng tất cả';
      collapseAll.setAttribute('data-state', 'collapsed');

      collapseAll.addEventListener('click', function () {
        var collapsing = collapseAll.getAttribute('data-state') === 'expanded';
        ul.querySelectorAll('.cvv-toc-toggle').forEach(function (btn) {
          var item = btn.closest('.cvv-toc-item-h2');
          if (!item) return;
          setTocSectionExpanded(item, btn, !collapsing);
        });
        collapseAll.setAttribute('data-state', collapsing ? 'collapsed' : 'expanded');
        collapseAll.textContent = collapsing ? 'Mở rộng tất cả' : 'Thu gọn tất cả';
      });

      wrap.appendChild(collapseAll);
    }
  }

  function enhanceFAQ(root) {
    var containers = [];
    var containerSet = new Set();
    function pushContainer(node) {
      if (!node || containerSet.has(node)) return;
      containerSet.add(node);
      containers.push(node);
    }

    normalizeLegacyFaq(root).forEach(function (node) {
      pushContainer(node);
    });

    root.querySelectorAll('.cvv-faq').forEach(function (node) { pushContainer(node); });
    root.querySelectorAll('.cvv-faq-list').forEach(function (list) {
      var holder = list.closest('.cvv-faq');
      pushContainer(holder || list);
    });

    if (!containers.length) return;

    containers.forEach(function (faq) {
      if (faq.classList && !faq.classList.contains('cvv-faq')) {
        faq.classList.add('cvv-faq');
      }

      var items = faq.querySelectorAll('.cvv-faq-item');
      if (!items.length) return;

      items.forEach(function (item, idx) {
        if (item.querySelector('.cvv-faq-trigger')) return;

        var q = item.querySelector('.cvv-faq-question') ||
          item.querySelector('.cvv-faq-q') ||
          item.querySelector('h3, h4, strong');
        var a = item.querySelector('.cvv-faq-a') ||
          item.querySelector('.cvv-faq-answer') ||
          item.querySelector('p, ul, ol, div, table');

        if (!q || !a) return;

        var questionText = q.textContent ? q.textContent.trim() : '';
        if (!questionText) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cvv-faq-trigger';
        btn.innerHTML = '<span class="cvv-faq-trigger-text">' + questionText + '</span><span class="cvv-faq-trigger-arrow" aria-hidden="true"></span>';

        var open = idx === 0;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);

        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          setFaqItemState(item, btn, !expanded);
        });

        if (q.parentNode) {
          q.replaceWith(btn);
        } else {
          item.insertBefore(btn, item.firstChild);
        }

        if (!a.classList.contains('cvv-faq-a')) {
          a.classList.remove('cvv-faq-answer');
          a.classList.add('cvv-faq-a');
        }

        setFaqItemState(item, btn, idx === 0);

        window.requestAnimationFrame(function () {
          if (item.classList.contains('is-open')) {
            a.style.maxHeight = a.scrollHeight + 'px';
          }
        });
      });
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
