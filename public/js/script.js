document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("mainNav");

  //SHRINK NAVBAR
  const toggleNavbar = () => {
    if (window.scrollY > 1) {
      navbar.classList.add("navbar-shrink");
    } else {
      navbar.classList.remove("navbar-shrink");
    }
  };

  if (navbar) {
    toggleNavbar(); // inizializza subito

    let ticking = false;

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          toggleNavbar();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  //SCROLL TO TOP
  const scrollBtn = document.getElementById("scrollTopBtn");
  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      if (
        document.body.scrollTop > 400 ||
        document.documentElement.scrollTop > 400
      ) {
        scrollBtn.style.display = "block";
      } else {
        scrollBtn.style.display = "none";
      }
    });

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // LENTE DI RICERCA
  const searchToggle = document.querySelector(".search-toggle");
  const searchBar = document.getElementById("searchBar");
  const searchInput = document.querySelector(".search-form input");
  if (searchToggle && searchBar && searchInput) {
    searchToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      searchBar.classList.toggle("active");
      searchInput.focus();
    });
    searchBar.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", (e) => {
      if (!searchBar.contains(e.target) && !searchToggle.contains(e.target)) {
        searchBar.classList.remove("active");
      }
    });
    searchInput.addEventListener("focusout", () => {
      setTimeout(() => {
        if (
          !searchBar.contains(document.activeElement) &&
          document.activeElement !== searchToggle
        ) {
          searchBar.classList.remove("active");
        }
      }, 100);
    });
  }

  //RICERCA DA BARRA
  const searchInputLive = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  if (searchInputLive && searchResults) {
    let timeout;

    searchInputLive.addEventListener("input", () => {
      const query = searchInputLive.value.trim();
      clearTimeout(timeout);

      if (!query) {
        searchResults.innerHTML = "";
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const res = await fetch(`/research?q=${encodeURIComponent(query)}`);
          const risultati = await res.json();

          if (Array.isArray(risultati)) {
            searchResults.innerHTML = risultati.length
              ? risultati
                  .map(
                    (e) => `
              <div class="search-item">
                <a href="/eventi/${e.id}">
                  <strong>${e.titolo}</strong><br/>
                  <small>${e.descrizione?.slice(0, 50)}...</small>
                </a>
              </div>
            `
                  )
                  .join("")
              : '<div class="search-item">Nessun risultato</div>';
          }
        } catch (err) {
          console.error("Errore nella ricerca:", err);
          searchResults.innerHTML =
            '<div class="search-item">Errore nella ricerca</div>';
        }
      }, 300); // debounce
    });

    //CHIUDI RISULTATI SE PUNTA FUORI
    document.addEventListener("click", (e) => {
      if (
        !searchResults.contains(e.target) &&
        !searchInputLive.contains(e.target)
      ) {
        searchResults.innerHTML = "";
      }
    });
  }

  // SVUOTA CARRELLO CONFERMA
  const form = document.getElementById("svuotaCarrelloForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      const conferma = confirm("Sei sicuro di voler svuotare il carrello?");
      if (!conferma) e.preventDefault();
    });
  }

  // GESTIONE PULSANTI QUANTITÀ - VERSIONE UNIFICATA
  // Per pagina carrello (con form submit)
// GESTIONE PULSANTI QUANTITÀ - VERSIONE FINALE
const quantityBtns = document.querySelectorAll(
  ".btn-incrementa, .btn-decrementa"
);

quantityBtns.forEach((btn) => {
  btn.addEventListener("click", async function (e) {
    if (this.disabled) {
      e.preventDefault();
      return false;
    }
    
    this.disabled = true;
    const originalText = this.textContent;
    this.textContent = "...";
    
    // Se ha data-index, usa AJAX
    if (this.dataset.index) {
      e.preventDefault(); // Previeni il form submit
      
      const index = this.dataset.index;
      const action = this.classList.contains("btn-incrementa")
        ? "incrementa"
        : "decrementa";
        
      try {
        const res = await fetch(`/carrello/${action}/${index}`, {
          method: "POST",
        });
        
        if (res.ok) {
          location.reload();
        } else {
          console.error("Errore nella richiesta");
          this.textContent = originalText;
          this.disabled = false;
        }
      } catch (error) {
        console.error("Errore:", error);
        this.textContent = originalText;
        this.disabled = false;
      }
    }
    // Se NON ha data-index, lascia che il form si submitti normalmente
  });
});

  // AGGIUNGI BIGLIETTO (btn-acquista)
  document.querySelectorAll(".btn-acquista").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      if (button.disabled) return;
      button.disabled = true;

      const id = button.dataset.id;
      const quantita = button.dataset.quantita;
      const prezzo = button.dataset.prezzo;

      try {
        const res = await fetch("/carrello/aggiungi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: parseInt(id),
            quantita: parseInt(quantita),
            prezzo: parseFloat(prezzo),
          }),
        });

        const data = await res.json();

        if (data.success) {
          // Aggiorna badge
          const badge = document.getElementById("cartBadge");
          if (badge) {
            badge.textContent = data.carrelloLength;
            badge.classList.add("badge-pop");
            setTimeout(() => badge.classList.remove("badge-pop"), 300);
          }

          // Toast
          mostraToast();
        } else {
          console.error("Errore:", data.message);
        }
      } catch (err) {
        console.error("Errore durante l'aggiunta al carrello", err);
      } finally {
        // Riabilita il pulsante dopo 1 secondo
        setTimeout(() => {
          button.disabled = false;
        }, 1000);
      }
    });
  });

  // HAMBURGER MENU
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("menuOverlay");
  if (hamburger && menu && overlay) {
    hamburger.addEventListener("click", () => {
      menu.classList.toggle("active");
      overlay.classList.toggle("active");
    });
    overlay.addEventListener("click", () => {
      menu.classList.remove("active");
      overlay.classList.remove("active");
    });
    document.querySelectorAll(".menu a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("active");
        overlay.classList.remove("active");
      });
    });
  }

  // TOAST
  function mostraToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  // Rendi mostraToast disponibile globalmente se necessario
  window.mostraToast = mostraToast;

  // AOS
  if (window.AOS) {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: "ease-out-cubic",
    });
  }

  // Smooth scroll per anchor interni
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId.length > 1) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
});

// SWIPER (dopo che lo script CDN è caricato)
window.addEventListener("load", () => {
  if (window.Swiper && document.querySelector(".mySwiper")) {
    new Swiper(".mySwiper", {
      loop: true,
      speed: 2000,
      effect: "fade",
      autoplay: {
        delay: 6000, // come in index
        disableOnInteraction: false,
      },
      fadeEffect: { crossFade: true },
      parallax: false,
    });
  }
});

// VANILLA TILT (fuori da DOMContentLoaded se necessario)
//VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
//  max: 15,
//  speed: 400,
//  glare: true,
//  "max-glare": 0.2,
//});
