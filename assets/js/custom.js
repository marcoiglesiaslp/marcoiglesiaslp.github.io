// Smooth scrolling for navigation links
document.querySelectorAll('a.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const section = this.getAttribute('href');
      const target = document.querySelector(section);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
        const urlWithoutHash = window.location.href.split('#')[0]; // Remove the hash from the current URL
        history.pushState(null, null, urlWithoutHash + section);
      }
    });
  });
  
  // Update URL on page load or manual URL changes
  window.addEventListener('load', function () {
    const path = window.location.pathname;
    if (path !== '/') {
      const target = document.querySelector(`#${path.substr(1)}`);
      if (target) {
        target.scrollIntoView();
      }
    }
  });
  
  window.addEventListener('popstate', function () {
    const path = window.location.pathname;
    if (path !== '/') {
      const target = document.querySelector(`#${path.substr(1)}`);
      if (target) {
        target.scrollIntoView();
      }
    }
  });
  