document.addEventListener('DOMContentLoaded', () => {
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');
    const mainContent = document.getElementById('main-content');

    // Slide images to middle and back on page load
    function slideImages() {
        const totalWidth = window.innerWidth <= 600 ? 200 : 300;
        const halfWindowWidth = (window.innerWidth - totalWidth) / 2;
        setTimeout(() => {
            mooLeft.style.transform = `translateX(${halfWindowWidth}px)`;
            mooRight.style.transform = `translateX(-${halfWindowWidth}px)`;
            setTimeout(() => {
                mooLeft.style.transform = 'translateX(0)';
                mooRight.style.transform = 'translateX(0)';
            }, 1000);
        }, 500);
    }

    // Load page in iframe
    function loadPageInIframe(page) {
        mainContent.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = page;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.onerror = () => {
            mainContent.innerHTML = '<p>Failed to load game, please try again.</p>';
        };
        mainContent.appendChild(iframe);
    }

    // Initialize
    slideImages();
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            loadPageInIframe(page);
        });
    });

    window.addEventListener('resize', slideImages);
});