document.addEventListener('DOMContentLoaded', () => {
    // Image animation on page load
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');

    // Slide images to middle and back
    setTimeout(() => {
        const halfWindowWidth = window.innerWidth / 2;
        mooLeft.style.transform = `translateX(${halfWindowWidth - 150}px)`; // Move left image to center
        mooRight.style.transform = `translateX(-${halfWindowWidth - 150}px)`; // Move right image to center
        setTimeout(() => {
            mooLeft.style.transform = 'translateX(0)';
            mooRight.style.transform = 'translateX(0)';
        }, 1000);
    }, 500);

    // Jump animation on click
    function jumpAround(img) {
        const startTime = Date.now();
        const originalPosition = img.style.transform || 'translateX(0)';
        const originalLeft = img.style.left || '0';
        const originalRight = img.style.right || '0';
        const jumpInterval = setInterval(() => {
            if (Date.now() - startTime > 5000) {
                img.style.transform = originalPosition;
                img.style.position = 'relative';
                img.style.left = originalLeft;
                img.style.right = originalRight;
                img.style.top = '0';
                clearInterval(jumpInterval);
                return;
            }
            const maxX = window.innerWidth - 150; // Image width
            const maxY = window.innerHeight - 150; // Image height
            const randomX = Math.random() * maxX;
            const randomY = Math.random() * maxY;
            img.style.position = 'absolute';
            img.style.left = `${randomX}px`;
            img.style.top = `${randomY}px`;
            img.style.right = 'auto';
        }, 200);
    }

    mooLeft.addEventListener('click', () => jumpAround(mooLeft));
    mooRight.addEventListener('click', () => jumpAround(mooRight));

    // Menu link handling
    const menuLinks = document.querySelectorAll('.menu-link');
    const mainContent = document.getElementById('main-content');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            fetch(page)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    mainContent.innerHTML = doc.querySelector('div').innerHTML;
                })
                .catch(error => {
                    mainContent.innerHTML = '<p>Error loading page.</p>';
                    console.error('Error:', error);
                });
        });
    });
});