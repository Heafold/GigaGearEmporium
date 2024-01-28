document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.querySelector('.fa-bars');
    const searchIcon = document.querySelector('.search-icon');
    const searchBar = document.querySelector('.search-wrapper');
    const nav = document.querySelector('nav');
  
    let firstClick = true;
  
    menuIcon.addEventListener('click', () => {
      if (firstClick) {
        nav.classList.add('active');
        firstClick = false;
      } else {
        nav.classList.toggle('active');
        nav.classList.toggle('hide');
      }
    });
  
    searchIcon.addEventListener('click', () => {
      searchBar.classList.toggle('active');
    });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      nav.classList.remove('active', 'hide');
      firstClick = true;
    }
  });
  });
  