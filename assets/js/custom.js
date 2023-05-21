// Smooth scrolling for navigation links
document.querySelectorAll('a.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      window.scrollTo({
        top: target.offsetTop,
        behavior: 'smooth'
      });
      history.pushState(null, null, this.getAttribute('href'));
    });
  });
  
  // Update URL on page load or manual URL changes
  window.addEventListener('load', function () {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  });
  
  window.addEventListener('popstate', function () {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  });
  