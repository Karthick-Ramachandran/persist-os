/* Progressive enhancements for the Persist OS landing page. No dependencies. */
/* global window, document, localStorage, navigator, HTMLElement */
(() => {
  'use strict';

  const root = document.documentElement;
  const toast = document.getElementById('toast');
  let toastTimer;

  /** Announce a UI result without moving focus or changing page layout. */
  function announce(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    const feedback = document.getElementById('dialog-feedback');
    if (feedback && document.querySelector('.command-dialog[open]')) feedback.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3500);
  }

  /** Return true only when the clipboard operation actually succeeds. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* File previews and browser permissions may need the fallback. */ }

    const previousFocus = document.activeElement;
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.readOnly = true;
    helper.setAttribute('aria-label', 'Command to copy');
    helper.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
    // A native modal makes elements outside it inert. Keep the helper in the modal.
    const modal = document.querySelector('dialog[open]');
    (modal || document.body).append(helper);
    helper.focus();
    helper.select();
    let success = false;
    try { success = document.execCommand('copy'); } catch { /* execCommand throws on failure; success stays false. */ }
    helper.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    return success;
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const command = button.dataset.copy;
    if (!command) return;
    const success = await copyText(command);
    if (!success) {
      announce('Could not copy automatically. Select the command and copy it manually.');
      return;
    }
    button.dataset.copied = 'true';
    announce(`Copied: ${command}`);
    window.setTimeout(() => delete button.dataset.copied, 2000);
  });

  // Theme: respect the initial system choice, then save an explicit user choice.
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = false;
  try { explicitTheme = ['light', 'dark'].includes(localStorage.getItem('persist-theme') || localStorage.getItem('theme')); } catch { /* Private-mode storage throws; fall back to the system theme. */ }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeButton) themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#141418' : '#fafafa');
  }
  applyTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    explicitTheme = true;
    applyTheme(next);
    try { localStorage.setItem('persist-theme', next); } catch { /* Private-mode storage throws; the choice simply does not persist. */ }
  });
  systemTheme.addEventListener('change', (event) => {
    if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light');
  });

  // Accessible tabs: roving tabindex, arrow keys, Home/End, and separate panels.
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const list = group.querySelector('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    const vertical = list.getAttribute('aria-orientation') === 'vertical';

    function selectTab(tab, focus = false) {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus({ preventScroll: true });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % tabs.length;
        else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (index - 1 + tabs.length) % tabs.length;
        else return;
        event.preventDefault();
        selectTab(tabs[next], true);
      });
    });
  });

  // Mobile navigation is a disclosure, not a modal. Escape restores toggle focus.
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  function closeMenu(restoreFocus = false) {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
    if (restoreFocus) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    if (!mobileNav) return;
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  });
  mobileNav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  window.matchMedia('(min-width: 621px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  // The command finder reads the same reference markup, avoiding two catalogs.
  const dialog = document.querySelector('.command-dialog');
  const search = document.getElementById('command-search');
  const results = document.getElementById('command-results');
  const resultCount = document.getElementById('command-result-count');
  const commands = Array.from(document.querySelectorAll('.command-item')).map((item) => ({
    command: item.dataset.command,
    example: item.dataset.example,
    group: item.dataset.group,
    description: item.querySelector('p')?.textContent || '',
  }));
  const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll('[data-shortcut]').forEach((node) => { node.textContent = apple ? '⌘ K' : 'Ctrl K'; });
  let commandOpener;

  function renderCommands(query = '') {
    if (!results) return;
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = commands.filter((item) => {
      const text = `${item.command} ${item.group} ${item.description}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
    results.replaceChildren();
    if (resultCount) resultCount.textContent = `${matches.length} command${matches.length === 1 ? '' : 's'}`;

    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'command-empty';
      empty.textContent = 'No commands match. Try “doctor”, “memory”, or “decision”.';
      results.append(empty);
      return;
    }
    matches.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'command-result';
      button.dataset.copy = item.example;
      button.setAttribute('aria-label', `Copy example for ${item.command}`);
      const content = document.createElement('span');
      const category = document.createElement('small');
      category.textContent = item.group;
      const heading = document.createElement('div');
      const code = document.createElement('code');
      code.textContent = item.command;
      heading.append(code);
      const description = document.createElement('p');
      description.textContent = item.description;
      content.append(category, heading, description);
      button.append(content);
      const sourceIcon = document.querySelector('.copy-icon');
      const successIcon = document.querySelector('.copied-icon');
      if (sourceIcon) button.append(sourceIcon.cloneNode(true));
      if (successIcon) button.append(successIcon.cloneNode(true));
      results.append(button);
    });
  }

  function openCommands(opener) {
    if (!dialog || typeof dialog.showModal !== 'function') {
      const reference = document.querySelector('.command-disclosure');
      if (reference) { reference.open = true; reference.scrollIntoView({ block: 'start' }); }
      return;
    }
    if (dialog.open) return;
    closeMenu();
    commandOpener = opener || document.activeElement;
    search.value = '';
    const feedback = document.getElementById('dialog-feedback');
    if (feedback) feedback.textContent = '';
    renderCommands();
    dialog.showModal();
    search.focus();
  }

  document.querySelectorAll('[data-open-commands]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openCommands(link);
    });
  });
  search?.addEventListener('input', () => renderCommands(search.value));
  search?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('button')?.focus(); }
  });
  results?.addEventListener('keydown', (event) => {
    const buttons = Array.from(results.querySelectorAll('button'));
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); buttons[(index + 1) % buttons.length]?.focus(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); if (index === 0) search.focus(); else buttons[index - 1].focus(); }
  });
  document.querySelector('[data-close-commands]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog?.addEventListener('close', () => {
    const openerVisible = commandOpener instanceof HTMLElement && commandOpener.getClientRects().length;
    if (openerVisible) commandOpener.focus({ preventScroll: true });
    else if (menuButton && menuButton.getClientRects().length) menuButton.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog?.open) dialog.close(); else openCommands(document.activeElement);
    }
    if (event.key === 'Escape' && dialog?.open) {
      event.preventDefault();
      dialog.close();
      return;
    }
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
})();
