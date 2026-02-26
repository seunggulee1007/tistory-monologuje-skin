(function() {
  'use strict';

  // ============================================================
  // Monolog - Tistory Blog Skin
  // Main JavaScript
  // ============================================================

  // --------------------------------------------------
  // Module 1: Dark Mode Toggle
  // --------------------------------------------------
  function initDarkMode() {
    var toggle = document.querySelector('.dark-toggle');
    var themeLink = document.getElementById('hljs-theme');
    var STORAGE_KEY = 'monolog-theme';
    var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/';

    // Resolve hljs theme URLs based on code_theme skin variable
    var codeTheme = document.body.getAttribute('data-code-theme') || 'github';
    var themeNames = {
      'github':   { light: 'github',         dark: 'github-dark' },
      'atom-one': { light: 'atom-one-light',  dark: 'atom-one-dark' },
      'monokai':  { light: 'monokai',         dark: 'monokai' }
    };
    var resolved = themeNames[codeTheme] || themeNames['github'];
    var LIGHT_THEME = CDN + resolved.light + '.min.css';
    var DARK_THEME = CDN + resolved.dark + '.min.css';

    function applyTheme(mode) {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeLink) themeLink.href = DARK_THEME;
      } else {
        document.documentElement.classList.remove('dark');
        if (themeLink) themeLink.href = LIGHT_THEME;
      }
    }

    function getCurrentTheme() {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    // Apply saved preference or OS preference on load
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    }

    // Toggle button click
    if (toggle) {
      toggle.addEventListener('click', function() {
        var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      });
    }

    // Listen for OS color scheme changes (only if user has no manual preference)
    try {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var handler = function(e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', handler);
      } else if (mql.addListener) {
        mql.addListener(handler);
      }
    } catch (_) { /* matchMedia not supported */ }
  }

  // --------------------------------------------------
  // Module 2: Mobile Navigation
  // --------------------------------------------------
  function initMobileNav() {
    var hamburger = document.querySelector('.hamburger');
    var menu = document.querySelector('.mobile-menu');
    if (!hamburger || !menu) return;

    function openMenu() {
      menu.classList.add('active');
      hamburger.classList.add('active');
      document.body.classList.add('no-scroll');
    }

    function closeMenu() {
      menu.classList.remove('active');
      hamburger.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }

    function isOpen() {
      return menu.classList.contains('active');
    }

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (isOpen() && !menu.contains(e.target) && e.target !== hamburger) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen()) {
        closeMenu();
      }
    });
  }

  // --------------------------------------------------
  // Module 3: Code Blocks (highlight.js + copy)
  // --------------------------------------------------
  function initCodeBlocks() {
    // Detect language from filename comment (e.g. "// LoginService.java")
    function detectLangFromComment(text) {
      var firstLine = text.trim().split('\n')[0] || '';
      var extMatch = firstLine.match(/\/\/\s*\S+\.(\w+)\s*$/);
      if (extMatch) {
        var extMap = {
          'java': 'java', 'py': 'python', 'js': 'javascript', 'ts': 'typescript',
          'kt': 'kotlin', 'go': 'go', 'rs': 'rust', 'rb': 'ruby', 'php': 'php',
          'cs': 'csharp', 'cpp': 'cpp', 'c': 'c', 'swift': 'swift', 'scala': 'scala',
          'groovy': 'groovy', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
          'json': 'json', 'sql': 'sql', 'sh': 'bash', 'bash': 'bash',
          'html': 'html', 'css': 'css', 'scss': 'scss', 'less': 'less'
        };
        return extMap[extMatch[1].toLowerCase()] || '';
      }
      return '';
    }

    // Correct common hljs auto-detection misidentifications
    function correctLanguage(codeEl) {
      // Get the currently detected language from class list
      var detectedLang = '';
      var classes = codeEl.className.split(/\s+/);
      for (var ci = 0; ci < classes.length; ci++) {
        var lm = classes[ci].match(/^language-(.+)$/);
        if (lm) { detectedLang = lm[1]; break; }
      }
      // Nothing detected yet - nothing to correct
      if (!detectedLang) return;

      var text = codeEl.textContent;
      var correctedLang = '';

      // --- Java correction ---
      // Fires when detected as typescript, javascript, csharp, or similar but code looks like Java
      if (detectedLang !== 'java') {
        var javaAnnotations = [
          '@Override', '@Entity', '@Converter', '@Component', '@Service',
          '@Repository', '@Autowired', '@Bean', '@Configuration',
          '@RestController', '@Controller', '@RequestMapping',
          '@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping',
          '@PathVariable', '@RequestBody', '@Transactional',
          '@Table', '@Column', '@Id', '@GeneratedValue'
        ];
        var javaClassImportPatterns = [
          /public\s+class\b/, /private\s+class\b/, /\bimplements\b/,
          /\bextends\b/, /System\.out\b/, /public\s+static\s+void\s+main\b/,
          /import\s+java\./, /import\s+javax\./, /import\s+org\.springframework\./
        ];
        var annotationCount = 0;
        for (var ai = 0; ai < javaAnnotations.length; ai++) {
          if (text.indexOf(javaAnnotations[ai]) !== -1) annotationCount++;
        }
        var hasClassOrImport = false;
        for (var pi = 0; pi < javaClassImportPatterns.length; pi++) {
          if (javaClassImportPatterns[pi].test(text)) { hasClassOrImport = true; break; }
        }
        if (annotationCount >= 2 || (annotationCount >= 1 && hasClassOrImport)) {
          correctedLang = 'java';
        }
      }

      // --- Kotlin correction ---
      // Fires when detected as java (or other) but code has Kotlin-specific keywords
      if (!correctedLang && detectedLang === 'java') {
        var kotlinSignals = [
          /\bfun\s+\w+/, /\bval\s+\w+/, /\bvar\s+\w+\s*:/,
          /\bdata\s+class\b/, /\bsealed\s+class\b/, /\bobject\s+\w+/,
          /\bcompanion\s+object\b/, /\bsuspend\s+fun\b/, /\?\.\w+/, /\?:\s*/,
          /\bit\.\w+/
        ];
        var kotlinCount = 0;
        for (var ki = 0; ki < kotlinSignals.length; ki++) {
          if (kotlinSignals[ki].test(text)) kotlinCount++;
        }
        if (kotlinCount >= 2) {
          correctedLang = 'kotlin';
        }
      }

      // --- Python correction ---
      // Fires when detected as something else but code has strong Python signals
      if (!correctedLang && detectedLang !== 'python') {
        var pythonSignals = [
          /\bdef\s+\w+\s*\(/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import\b/,
          /\bself\.\w+/, /\b__init__\b/, /\bprint\s*\(/, /if\s+__name__\s*==\s*['"]__main__['"]/
        ];
        var hasNoBraces = !/\{/.test(text);
        var pythonCount = 0;
        for (var pypi = 0; pypi < pythonSignals.length; pypi++) {
          if (pythonSignals[pypi].test(text)) pythonCount++;
        }
        if (pythonCount >= 3 && hasNoBraces) {
          correctedLang = 'python';
        }
      }

      // Apply correction if needed
      if (correctedLang && correctedLang !== detectedLang) {
        // Remove old language class and hljs class, then re-highlight
        var oldClasses = codeEl.className.split(/\s+/);
        for (var oci = 0; oci < oldClasses.length; oci++) {
          if (/^language-/.test(oldClasses[oci]) || oldClasses[oci] === 'hljs') {
            codeEl.classList.remove(oldClasses[oci]);
          }
        }
        codeEl.classList.add('language-' + correctedLang);
        if (typeof hljs !== 'undefined') {
          hljs.highlightElement(codeEl);
        }
      }
    }

    function run() {
      // Pre-process: set language hints from filename comments before hljs auto-detect
      try {
        if (typeof hljs !== 'undefined') {
          var allBlocks = document.querySelectorAll('pre > code');
          for (var b = 0; b < allBlocks.length; b++) {
            var codeEl = allBlocks[b];
            var hasLang = false;
            var classes = codeEl.className.split(/\s+/);
            for (var c = 0; c < classes.length; c++) {
              if (/^language-/.test(classes[c])) { hasLang = true; break; }
            }
            // If no language class, try to detect from filename comment
            if (!hasLang) {
              var detected = detectLangFromComment(codeEl.textContent);
              if (detected) {
                codeEl.classList.add('language-' + detected);
              }
            }
          }
          hljs.highlightAll();

          // Post-detection: correct common misidentifications
          var allCodeBlocks = document.querySelectorAll('pre > code');
          for (var k = 0; k < allCodeBlocks.length; k++) {
            correctLanguage(allCodeBlocks[k]);
          }
        }
      } catch (_) { /* hljs not available */ }

      // Enhance each code block
      var blocks = document.querySelectorAll('pre > code');
      for (var i = 0; i < blocks.length; i++) {
        enhanceCodeBlock(blocks[i]);
      }
    }

    function enhanceCodeBlock(codeEl) {
      var pre = codeEl.parentElement;
      if (!pre || pre.querySelector('.code-header')) return;

      // Skip PlantUML blocks (handled by initPlantUML)
      if (isPlantUMLBlock(codeEl) || plantumlBlocks.indexOf(codeEl) !== -1) return;

      // Extract language from class
      var lang = '';
      var classes = codeEl.className.split(/\s+/);
      for (var j = 0; j < classes.length; j++) {
        var match = classes[j].match(/^language-(.+)$/);
        if (match) {
          lang = match[1];
          break;
        }
      }

      // Build header
      var header = document.createElement('div');
      header.className = 'code-header';

      var label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = lang ? lang.toUpperCase() : 'CODE';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'btn-copy';
      copyBtn.setAttribute('type', 'button');
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> <span>Copy</span>';

      copyBtn.addEventListener('click', createCopyHandler(codeEl, copyBtn));

      header.appendChild(label);
      header.appendChild(copyBtn);
      pre.insertBefore(header, codeEl);
    }

    function createCopyHandler(codeEl, btn) {
      return function() {
        var text = codeEl.textContent;
        var spanEl = btn.querySelector('span');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            showCopied(spanEl);
          }).catch(function() {
            fallbackCopy(text, spanEl);
          });
        } else {
          fallbackCopy(text, spanEl);
        }
      };
    }

    function fallbackCopy(text, spanEl) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopied(spanEl);
      } catch (_) { /* copy not supported */ }
    }

    function showCopied(spanEl) {
      if (!spanEl) return;
      var original = spanEl.textContent;
      spanEl.textContent = 'Copied!';
      setTimeout(function() {
        spanEl.textContent = original;
      }, 2000);
    }

    // Wait for hljs if not yet loaded
    if (typeof hljs !== 'undefined') {
      run();
    } else {
      var hljsScript = document.querySelector('script[src*="highlight"]');
      if (hljsScript) {
        hljsScript.addEventListener('load', run);
      } else {
        run();
      }
    }
  }

  // --------------------------------------------------
  // Module 4: TOC (Table of Contents)
  // --------------------------------------------------
  function initTOC() {
    var postContent = document.querySelector('.post-content');
    var tocContainer = document.getElementById('toc');
    if (!postContent || !tocContainer) return;

    var headings = postContent.querySelectorAll('h2, h3');
    if (!headings.length) {
      tocContainer.style.display = 'none';
      return;
    }

    // Slugify helper
    function slugify(text) {
      return text.toLowerCase()
        .replace(/[^\w\s\uAC00-\uD7AF\u3130-\u318F-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Build TOC structure
    var nav = document.createElement('nav');
    nav.className = 'toc-nav';
    var rootUl = document.createElement('ul');
    rootUl.className = 'toc-list';

    var currentH2Item = null;
    var currentSubUl = null;

    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      if (!h.id) {
        h.id = slugify(h.textContent) || 'heading-' + i;
      }

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'toc-link';
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.setAttribute('data-target', h.id);
      li.appendChild(a);

      if (h.tagName === 'H2') {
        rootUl.appendChild(li);
        currentH2Item = li;
        currentSubUl = null;
      } else {
        // H3 - nest under current H2
        if (!currentSubUl) {
          currentSubUl = document.createElement('ul');
          currentSubUl.className = 'toc-sublist';
          if (currentH2Item) {
            currentH2Item.appendChild(currentSubUl);
          } else {
            rootUl.appendChild(li);
            continue;
          }
        }
        currentSubUl.appendChild(li);
      }
    }

    nav.appendChild(rootUl);
    tocContainer.appendChild(nav);

    // Scroll spy with IntersectionObserver
    var tocLinks = tocContainer.querySelectorAll('a[data-target]');
    if (!tocLinks.length) return;

    try {
      var observer = new IntersectionObserver(function(entries) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].isIntersecting) {
            setActive(entries[j].target.id);
            break;
          }
        }
      }, {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      });

      for (var k = 0; k < headings.length; k++) {
        observer.observe(headings[k]);
      }
    } catch (_) {
      // IntersectionObserver not supported, fall back to scroll listener
      window.addEventListener('scroll', function() {
        var current = '';
        for (var m = 0; m < headings.length; m++) {
          var rect = headings[m].getBoundingClientRect();
          if (rect.top <= 150) {
            current = headings[m].id;
          }
        }
        if (current) setActive(current);
      });
    }

    function setActive(id) {
      for (var n = 0; n < tocLinks.length; n++) {
        if (tocLinks[n].getAttribute('data-target') === id) {
          tocLinks[n].classList.add('active');
        } else {
          tocLinks[n].classList.remove('active');
        }
      }
    }
  }

  // --------------------------------------------------
  // Module 5: Search Overlay
  // --------------------------------------------------
  function initSearch() {
    var searchBtn = document.querySelector('.search-toggle');
    var overlay = document.querySelector('.search-overlay');
    var input = overlay ? overlay.querySelector('[data-search-input]') : null;
    var closeBtn = overlay ? overlay.querySelector('.search-close') : null;
    if (!searchBtn || !overlay) return;

    function openSearch() {
      overlay.classList.add('active');
      if (input) {
        input.value = '';
        input.focus();
      }
    }

    function closeSearch() {
      overlay.classList.remove('active');
    }

    searchBtn.addEventListener('click', openSearch);

    if (closeBtn) {
      closeBtn.addEventListener('click', closeSearch);
    }

    // Close on overlay background click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeSearch();
      }
    });

    // Close on Escape, navigate on Enter
    document.addEventListener('keydown', function(e) {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeSearch();
      }
    });

    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var query = input.value.trim();
          if (query) {
            window.location.href = '/search/' + encodeURIComponent(query);
          }
        }
      });
    }
  }

  // --------------------------------------------------
  // Module 6: Back to Top
  // --------------------------------------------------
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    var THRESHOLD = 300;
    var ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          if (window.pageYOffset > THRESHOLD) {
            btn.classList.add('visible');
          } else {
            btn.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --------------------------------------------------
  // Module 7: PlantUML Rendering
  // --------------------------------------------------
  // Track which code blocks are PlantUML (to skip in initCodeBlocks)
  var plantumlBlocks = [];

  function isPlantUMLBlock(codeEl) {
    return codeEl.classList.contains('language-plantuml') ||
           codeEl.textContent.trimStart().indexOf('@startuml') === 0;
  }

  function initPlantUML() {
    var enableAttr = document.body.getAttribute('data-plantuml-enabled');
    // Enable by default unless explicitly set to 'false'
    if (enableAttr === 'false') return;

    var blocks = document.querySelectorAll('pre > code');
    var targets = [];

    for (var i = 0; i < blocks.length; i++) {
      if (isPlantUMLBlock(blocks[i])) {
        targets.push(blocks[i]);
        plantumlBlocks.push(blocks[i]);
      }
    }

    if (!targets.length) return;

    // Try rendering with pako (local or CDN)
    if (typeof pako !== 'undefined') {
      renderAllPlantUML(targets);
    } else {
      // Fallback: load pako from CDN
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
      script.onload = function() {
        renderAllPlantUML(targets);
      };
      document.head.appendChild(script);
    }
  }

  function renderAllPlantUML(targets) {
    if (typeof pako === 'undefined') return;
    for (var j = 0; j < targets.length; j++) {
      renderPlantUML(targets[j]);
    }
  }

  function renderPlantUML(codeEl) {
    var pre = codeEl.parentElement;
    if (!pre) return;

    var source = codeEl.textContent;
    var encoded = encodePlantUML(source);
    var url = 'https://www.plantuml.com/plantuml/svg/' + encoded;

    // Build replacement
    var wrapper = document.createElement('div');
    wrapper.className = 'plantuml-diagram';

    var img = document.createElement('img');
    img.src = url;
    img.alt = 'PlantUML Diagram';
    img.loading = 'lazy';

    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'plantuml-toggle';
    toggleBtn.setAttribute('type', 'button');
    toggleBtn.setAttribute('data-state', 'hidden');
    toggleBtn.textContent = '\uC18C\uC2A4 \uBCF4\uAE30';

    var sourcePre = document.createElement('pre');
    sourcePre.className = 'plantuml-source';
    sourcePre.style.display = 'none';
    var sourceCode = document.createElement('code');
    sourceCode.textContent = source;
    sourcePre.appendChild(sourceCode);

    toggleBtn.addEventListener('click', function() {
      var state = this.getAttribute('data-state');
      if (state === 'hidden') {
        sourcePre.style.display = '';
        this.setAttribute('data-state', 'visible');
        this.textContent = '\uC18C\uC2A4 \uC228\uAE30\uAE30';
      } else {
        sourcePre.style.display = 'none';
        this.setAttribute('data-state', 'hidden');
        this.textContent = '\uC18C\uC2A4 \uBCF4\uAE30';
      }
    });

    wrapper.appendChild(img);
    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(sourcePre);

    pre.parentNode.replaceChild(wrapper, pre);
  }

  // PlantUML encoding utilities
  function encodePlantUML(text) {
    try {
      var data = new TextEncoder().encode(text);
      var deflated = pako.deflateRaw(data, { level: 9 });
      return encode64(deflated);
    } catch (_) {
      return '';
    }
  }

  function encode64(data) {
    var r = '';
    for (var i = 0; i < data.length; i += 3) {
      if (i + 2 === data.length) {
        r += append3bytes(data[i], data[i + 1], 0);
      } else if (i + 1 === data.length) {
        r += append3bytes(data[i], 0, 0);
      } else {
        r += append3bytes(data[i], data[i + 1], data[i + 2]);
      }
    }
    return r;
  }

  function append3bytes(b1, b2, b3) {
    var c1 = b1 >> 2;
    var c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    var c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    var c4 = b3 & 0x3F;
    return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) +
           encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
  }

  function encode6bit(b) {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return '-';
    if (b === 1) return '_';
    return '?';
  }

  // --------------------------------------------------
  // Module 8: Image Lazy Loading
  // --------------------------------------------------
  function initLazyImages() {
    var content = document.querySelector('.post-content');
    if (!content) return;

    var images = content.querySelectorAll('img:not([loading])');
    for (var i = 0; i < images.length; i++) {
      images[i].setAttribute('loading', 'lazy');
      images[i].classList.add('lazy-image');
      images[i].addEventListener('load', handleImageLoad);
    }
  }

  function handleImageLoad() {
    this.classList.add('loaded');
  }

  // --------------------------------------------------
  // Module 9: Footer
  // --------------------------------------------------
  function initFooter() {
    var yearEl = document.querySelector('[data-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // --------------------------------------------------
  // Module 10: Skin Variables (data attributes → CSS classes)
  // --------------------------------------------------
  function initSkinVariables() {
    var body = document.body;

    // Layout style: list or grid
    var layout = body.getAttribute('data-layout');
    if (layout === 'grid') {
      var postList = document.querySelector('.post-list');
      if (postList) postList.classList.add('grid-view');
    }

    // Sidebar visibility
    var sidebar = body.getAttribute('data-sidebar');
    if (sidebar === 'false') {
      var layoutEl = document.querySelector('.layout');
      if (layoutEl) layoutEl.classList.add('no-sidebar');
    }

    // TOC visibility
    var toc = body.getAttribute('data-toc');
    if (toc === 'false') {
      var tocEl = document.getElementById('toc');
      if (tocEl) tocEl.style.display = 'none';
    }

    // Code theme: swap hljs stylesheet based on theme name
    var codeTheme = body.getAttribute('data-code-theme');
    if (codeTheme && codeTheme !== 'github') {
      var themeMap = {
        'atom-one': { light: 'atom-one-light', dark: 'atom-one-dark' },
        'monokai': { light: 'monokai', dark: 'monokai' }
      };
      var mapped = themeMap[codeTheme];
      if (mapped) {
        var themeLink = document.getElementById('hljs-theme');
        if (themeLink) {
          var isDark = document.documentElement.classList.contains('dark');
          var themeName = isDark ? mapped.dark : mapped.light;
          themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/' + themeName + '.min.css';
        }
      }
    }

    // Cover image
    var coverImage = body.getAttribute('data-cover-image');
    if (coverImage) {
      var header = document.querySelector('.header');
      if (header) {
        header.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(' + coverImage + ')';
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
        header.classList.add('header-with-cover');
      }
    }
  }

  // --------------------------------------------------
  // Module 11: Reading Progress Bar
  // --------------------------------------------------
  function initReadingProgress() {
    var bar = document.querySelector('.reading-progress-bar');
    var postContent = document.querySelector('.post-content');
    if (!bar || !postContent) return;

    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var rect = postContent.getBoundingClientRect();
          var contentTop = rect.top + window.pageYOffset;
          var contentHeight = postContent.offsetHeight;
          var scrolled = window.pageYOffset - contentTop;
          var viewportHeight = window.innerHeight;
          var total = contentHeight - viewportHeight;
          var percent = Math.min(Math.max(scrolled / total * 100, 0), 100);
          bar.style.width = percent + '%';
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // --------------------------------------------------
  // Module 12: Reading Time Estimate
  // --------------------------------------------------
  function initReadingTime() {
    var postContent = document.querySelector('.post-content');
    var badge = document.querySelector('[data-reading-time]');
    if (!postContent || !badge) return;

    var text = postContent.textContent || '';
    // Korean: ~500 chars/min, English: ~200 words/min
    var koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
    var plainText = text.replace(/[\uAC00-\uD7AF]/g, '');
    var words = plainText.split(/\s+/).filter(function(w) { return w.length > 0; }).length;

    var minutes = Math.ceil(koreanChars / 500 + words / 200);
    if (minutes < 1) minutes = 1;

    badge.textContent = '약 ' + minutes + '분';
  }

  // --------------------------------------------------
  // Module 13: Heading Anchor Links
  // --------------------------------------------------
  function initHeadingAnchors() {
    var postContent = document.querySelector('.post-content');
    if (!postContent) return;

    var headings = postContent.querySelectorAll('h2[id], h3[id], h4[id]');
    if (!headings.length) return;

    // Create toast element
    var toast = document.createElement('div');
    toast.className = 'heading-anchor-toast';
    toast.textContent = '링크가 복사되었습니다';
    document.body.appendChild(toast);

    var toastTimer;

    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = '#' + h.id;
      anchor.setAttribute('aria-label', '섹션 링크 복사');
      anchor.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>';

      anchor.addEventListener('click', createAnchorClickHandler(h.id, toast));
      h.appendChild(anchor);
    }

    function createAnchorClickHandler(id, toastEl) {
      return function(e) {
        e.preventDefault();
        var url = window.location.origin + window.location.pathname + '#' + id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function() { showToast(toastEl); });
        } else {
          // fallback
          var ta = document.createElement('textarea');
          ta.value = url;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast(toastEl);
        }
        // Also update URL hash
        history.replaceState(null, '', '#' + id);
      };
    }

    function showToast(el) {
      clearTimeout(toastTimer);
      el.classList.add('visible');
      toastTimer = setTimeout(function() {
        el.classList.remove('visible');
      }, 2000);
    }
  }

  // --------------------------------------------------
  // Module 14: Image Lightbox
  // --------------------------------------------------
  function initLightbox() {
    var postContent = document.querySelector('.post-content');
    if (!postContent) return;

    var lightbox = document.querySelector('[data-lightbox]');
    if (!lightbox) return;

    var lbImg = lightbox.querySelector('.lightbox-img');
    var lbClose = lightbox.querySelector('.lightbox-close');

    // Attach click to all post images
    var images = postContent.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      images[i].addEventListener('click', createImageClickHandler(images[i]));
    }

    function createImageClickHandler(img) {
      return function() {
        if (!img.src) return;
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lightbox.classList.add('active');
        document.body.classList.add('no-scroll');
      };
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.classList.remove('no-scroll');
      setTimeout(function() { lbImg.src = ''; }, 300);
    }

    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox || e.target === lbClose || lbClose.contains(e.target)) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // --------------------------------------------------
  // Module 15: Keyboard Shortcuts
  // --------------------------------------------------
  function initKeyboardShortcuts() {
    var kbdOverlay = document.querySelector('[data-kbd-overlay]');
    var kbdClose = kbdOverlay ? kbdOverlay.querySelector('.kbd-close') : null;

    function openKbd() {
      if (kbdOverlay) {
        kbdOverlay.classList.add('active');
      }
    }

    function closeKbd() {
      if (kbdOverlay) {
        kbdOverlay.classList.remove('active');
      }
    }

    if (kbdClose) {
      kbdClose.addEventListener('click', closeKbd);
    }
    if (kbdOverlay) {
      kbdOverlay.addEventListener('click', function(e) {
        if (e.target === kbdOverlay) closeKbd();
      });
    }

    document.addEventListener('keydown', function(e) {
      // Ignore if user is typing in input/textarea
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;

      // Ignore if modifier keys are held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          var searchBtn = document.querySelector('.search-toggle');
          if (searchBtn) searchBtn.click();
          break;

        case 'd':
          var darkToggle = document.querySelector('.dark-toggle');
          if (darkToggle) darkToggle.click();
          break;

        case 't':
          var toc = document.getElementById('toc');
          if (toc) {
            toc.style.display = toc.style.display === 'none' ? '' : 'none';
          }
          break;

        case 'j':
          var nextLink = document.querySelector('.post-nav-item.next');
          if (nextLink) nextLink.click();
          break;

        case 'k':
          var prevLink = document.querySelector('.post-nav-item:not(.next)');
          if (prevLink) prevLink.click();
          break;

        case 'h':
          window.location.href = '/';
          break;

        case '?':
          e.preventDefault();
          if (kbdOverlay && kbdOverlay.classList.contains('active')) {
            closeKbd();
          } else {
            openKbd();
          }
          break;

        case 'Escape':
          closeKbd();
          break;
      }
    });
  }

  // --------------------------------------------------
  // Module 16: Reading Position Memory
  // --------------------------------------------------
  function initReadingPosition() {
    var postContent = document.querySelector('.post-content');
    if (!postContent) return;

    var path = window.location.pathname;
    var STORAGE_KEY = 'monolog-reading-pos';
    var banner = document.querySelector('[data-resume-reading]');
    var goBtn = banner ? banner.querySelector('[data-resume-go]') : null;
    var dismissBtn = banner ? banner.querySelector('[data-resume-dismiss]') : null;

    // Load saved positions
    var positions;
    try {
      positions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      positions = {};
    }

    var saved = positions[path];
    // Show resume banner if saved position exists and is meaningful (>300px)
    if (saved && saved > 300 && banner) {
      setTimeout(function() {
        banner.classList.add('visible');
      }, 1000);

      if (goBtn) {
        goBtn.addEventListener('click', function() {
          window.scrollTo({ top: saved, behavior: 'smooth' });
          banner.classList.remove('visible');
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener('click', function() {
          banner.classList.remove('visible');
          delete positions[path];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
        });
      }
    }

    // Save scroll position periodically
    var saveTimer;
    window.addEventListener('scroll', function() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function() {
        positions[path] = window.pageYOffset;
        // Keep only last 50 entries
        var keys = Object.keys(positions);
        if (keys.length > 50) {
          delete positions[keys[0]];
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
        } catch (_) { /* storage full */ }
      }, 500);
    });
  }

  // --------------------------------------------------
  // Module 17: Init
  // --------------------------------------------------
  function init() {
    initSkinVariables();
    initDarkMode();
    initMobileNav();
    initPlantUML();      // PlantUML MUST run before CodeBlocks
    initCodeBlocks();
    initTOC();
    initSearch();
    initBackToTop();
    initLazyImages();
    initFooter();
    initReadingProgress();
    initReadingTime();
    initHeadingAnchors();
    initLightbox();
    initKeyboardShortcuts();
    initReadingPosition();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
