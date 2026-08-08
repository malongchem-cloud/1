(function () {
  "use strict";

  function normalizeCas(value) {
    return String(value || "").replace(/[^0-9]/g, "");
  }

  function formatCas(value) {
    var digits = normalizeCas(value);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, digits.length - 2) + "-" + digits.slice(-2);
    return digits.slice(0, digits.length - 5) + "-" + digits.slice(-5, -2) + "-" + digits.slice(-2);
  }

  function wireSearchForms() {
    document.querySelectorAll("form.cas-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="cas"]');
        var value = input ? input.value.trim() : "";
        var normalized = normalizeCas(value);
        var query = normalized ? "?cas=" + encodeURIComponent(normalized) : "";
        var searchUrl = form.getAttribute("data-search-url");
        if (!searchUrl) {
          var base = form.getAttribute("data-search-base") || "/";
          searchUrl = base + "search/";
        }
        window.location.href = searchUrl + query;
      });
    });
  }

  function wireMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function wireLanguageSwitcher() {
    var marker = document.querySelector(".lang-switch[data-lang-marker]");
    if (!marker) return;
    var prefixes;
    try {
      prefixes = JSON.parse(marker.getAttribute("data-lang-marker"));
    } catch (e) {
      return;
    }
    var currentPath = window.location.pathname;
    var links = marker.querySelectorAll(".lang-link");
    links.forEach(function (link) {
      var locale = link.getAttribute("hreflang");
      var prefix = prefixes[locale] || "";
      var path = currentPath;
      Object.keys(prefixes).forEach(function (other) {
        var otherPrefix = prefixes[other];
        if (otherPrefix && path.indexOf(otherPrefix + "/") === 0) {
          path = path.slice(otherPrefix.length);
        }
      });
      var url = prefix + path;
      if (path === "/") {
        url = prefix + "/";
      }
      link.setAttribute("href", url);
    });
  }

  function buildInquiryText(form) {
    var fields = {};
    form.querySelectorAll("input, textarea").forEach(function (field) {
      if (field.name) fields[field.name] = field.value.trim();
    });
    var product = fields.product || "General inquiry";
    var cas = fields.cas ? "CAS: " + fields.cas : "";
    var lines = [
      "New inquiry - " + product,
      cas,
      "Name: " + (fields.name || ""),
      "Company: " + (fields.company || ""),
      "Email: " + (fields.email || ""),
      "Country: " + (fields.country || ""),
      "Quantity: " + (fields.quantity || ""),
      "Message: " + (fields.message || ""),
    ];
    return lines.filter(function (line) {
      return line && line.indexOf(": ") !== line.length - 2;
    }).join("\n");
  }

  function wireInquiryForms() {
    var whatsappNumber = "8613218875239";
    var email = "info@malongchemicals.com";
    document.querySelectorAll("form.inquiry-form").forEach(function (form) {
      var whatsappButton = form.querySelector(".btn-whatsapp");
      var emailButton = form.querySelector(".btn-email");
      if (whatsappButton) {
        whatsappButton.addEventListener("click", function () {
          var text = buildInquiryText(form);
          var url = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(text);
          window.open(url, "_blank", "noopener");
        });
      }
      if (emailButton) {
        emailButton.addEventListener("click", function () {
          var text = buildInquiryText(form);
          var subject = "Product inquiry - " + (form.getAttribute("data-product") || "Malong Chemicals");
          var url = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
          window.location.href = url;
        });
      }
    });
  }

  function renderSearchResults() {
    var box = document.getElementById("cas-results");
    if (!box) return;
    var params = new URLSearchParams(window.location.search);
    var query = normalizeCas(params.get("cas") || "");
    var prefix = box.getAttribute("data-prefix") || "";
    var relRoot = box.getAttribute("data-rel-root") || "";
    function localUrl(value) {
      if (!relRoot) {
        return String(value || "");
      }
      var path = String(value || "").replace(/^\//, "");
      if (path && path.charAt(path.length - 1) === "/") {
        path += "index.html";
      }
      return relRoot + "/" + path;
    }
    if (!query) {
      box.innerHTML = '<p class="empty">Enter an exact CAS number to search.</p>';
      return;
    }
    function showResults(products) {
      var matches = products.filter(function (product) {
        return normalizeCas(product.cas) === query;
      });
      if (!matches.length) {
        var close = products.filter(function (product) {
          return normalizeCas(product.cas).indexOf(query) === 0;
        }).slice(0, 5);
        var html = '<p class="empty">No exact CAS match for ' + formatCas(query) + ".</p>";
        if (close.length) {
          html += '<h3 style="margin-top:1.2rem">Similar CAS numbers</h3>';
          close.forEach(function (product) {
            html += '<a class="result-item" href="' + localUrl(product.url) + '">' +
              '<span><span class="cas-badge">' + product.cas + "</span><h3>" + product.name + "</h3><p>" +
              product.category + "</p></span><span>&#8594;</span></a>";
          });
        }
        box.innerHTML = html;
        return;
      }
      var product = matches[0];
      box.innerHTML = '<h2>CAS ' + product.cas + "</h2>" +
        '<a class="result-item" href="' + localUrl(product.url) + '">' +
        "<span><span class=\"cas-badge\">" + product.cas + "</span><h3>" + product.name + "</h3><p>" +
        product.category + "</p></span><span>&#8594;</span></a>";
    }
    if (window.__PRODUCTS__) {
      showResults(window.__PRODUCTS__);
      return;
    }
    fetch(box.getAttribute("data-index-url"))
      .then(function (response) {
        return response.json();
      })
      .then(showResults)
      .catch(function () {
        box.innerHTML = '<p class="empty">Search index unavailable.</p>';
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireSearchForms();
    wireMobileNav();
    wireLanguageSwitcher();
    wireInquiryForms();
    renderSearchResults();
  });
})();
