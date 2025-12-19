document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.navigation');
    if (!nav) return; 
    const pagesToScroll = ['simulation.html'];
    const currentPage = window.location.pathname;

    const shouldScroll = pagesToScroll.some(page => currentPage.includes(page));

    if (shouldScroll) {
        setTimeout(() => {
            const navTop = nav.offsetTop + 90;
            window.scrollTo({
                top: navTop,
                behavior: 'smooth'
            });
        }, 200);
    }
});
