// Persist OS site. Three small jobs: the theme toggle, the copy buttons, and injecting a copy
// button into docs code blocks. No network, no analytics, no dependencies.
/* global window, document, localStorage, navigator, setTimeout, clearTimeout */
(function () {
  "use strict";

  var root = document.documentElement;

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function currentTheme() {
    return root.getAttribute("data-theme") || systemTheme();
  }

  function labelFor(theme) {
    return theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.setAttribute("aria-label", labelFor(currentTheme()));
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      toggle.setAttribute("aria-label", labelFor(next));
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Storage can be unavailable (private mode, blocked). The toggle still works for the page.
      }
    });
  }

  var copyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="9" y="9" width="13" height="13" rx="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
    '<span class="sr-only">Copy code</span>';

  // Code blocks get a copy button. A recorded transcript copies only its command lines (the
  // spans marked .c), so what lands in the clipboard pastes straight into a shell; a block with
  // no commands copies as-is, minus any prompt markers.
  var blocks = document.querySelectorAll(".prose pre, pre.transcript");
  Array.prototype.forEach.call(blocks, function (pre) {
    if (pre.querySelector(".copy")) {
      return;
    }
    var commands = pre.querySelectorAll(".c");
    var text = commands.length
      ? Array.prototype.map
          .call(commands, function (c) {
            return c.textContent;
          })
          .join("\n")
      : pre.textContent.replace(/^\$ /gm, "");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.innerHTML = copyIcon;
    button.setAttribute("data-copy", text.replace(/\s+$/, ""));
    pre.appendChild(button);
  });

  var copies = document.querySelectorAll("button.copy[data-copy]");
  Array.prototype.forEach.call(copies, function (button) {
    var reset;
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy") || "";
      var live = button.querySelector(".sr-only");
      var done = function () {
        button.setAttribute("data-copied", "true");
        if (live) {
          live.textContent = "Copied";
        }
        clearTimeout(reset);
        reset = setTimeout(function () {
          button.removeAttribute("data-copied");
          if (live) {
            live.textContent = "Copy";
          }
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          selectFallback(button);
        });
      } else {
        selectFallback(button);
      }
    });
  });

  // Without clipboard access, select the text so the reader can copy it manually.
  function selectFallback(button) {
    var target =
      (button.parentNode && button.parentNode.querySelector(".cmd-text")) || button.parentNode;
    if (!target || !window.getSelection) {
      return;
    }
    var range = document.createRange();
    range.selectNodeContents(target);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
})();
