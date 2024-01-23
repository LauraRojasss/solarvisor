(function () {
  // change the nav links color by page
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname;
  navLinks.forEach((link) => {
    link.parentElement.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.parentElement.classList.add('active');
    }
  });
})();
