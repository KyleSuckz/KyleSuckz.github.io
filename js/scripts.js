document.addEventListener('DOMContentLoaded', () => {
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');
    const topFrame = document.getElementById('top-frame');

    // Slide images to middle and back on page load
    setTimeout(() => {
        const halfWindowWidth = window.innerWidth / 2;
        mooLeft.style.transform = `translateX(${halfWindowWidth - 150}px)`;
        mooRight.style.transform = `translateX(-${halfWindowWidth - 150}px)`;
        setTimeout(() => {
            mooLeft.style.transform = 'translateX(0)';
            mooRight.style.transform = 'translateX(0)';
        }, 1000);
    }, 500);

    // Jump animation on click
    function jumpAround(img) {
        const startTime = Date.now();
        const isLeftImage = img.id === 'moo-left';
        const originalStyles = {
            position: img.style.position,
            left: img.style.left,
            right: img.style.right,
            top: img.style.top,
            transform: img.style.transform || 'translateX(0)',
            zIndex: img.style.zIndex || '100',
            pointerEvents: img.style.pointerEvents || 'auto'
        };

        // Move image to body for jumping
        document.body.appendChild(img);
        img.style.position = 'fixed';
        img.style.zIndex = '50';
        img.style.pointerEvents = 'none';

        // Set initial random position
        const maxX = window.innerWidth - 150;
        const maxY = window.innerHeight - 150;
        img.style.left = `${Math.random() * maxX}px`;
        img.style.top = `${Math.random() * maxY}px`;
        img.style.right = 'auto';
        img.style.transform = 'none';

        // Start jumping
        const jumpInterval = setInterval(() => {
            if (Date.now() - startTime > 5000) {
                // Restore image to topFrame
                topFrame.appendChild(img);
                img.style.position = originalStyles.position;
                img.style.left = isLeftImage ? '0' : 'auto';
                img.style.right = isLeftImage ? 'auto' : '0';
                img.style.top = '0';
                img.style.transform = originalStyles.transform;
                img.style.zIndex = originalStyles.zIndex;
                img.style.pointerEvents = originalStyles.pointerEvents;
                clearInterval(jumpInterval);
                return;
            }
            const randomX = Math.random() * maxX;
            const randomY = Math.random() * maxY;
            img.style.left = `${randomX}px`;
            img.style.top = `${randomY}px`;
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