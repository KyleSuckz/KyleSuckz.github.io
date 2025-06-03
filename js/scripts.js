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
        const originalParent = img.parentElement;
        const originalStyles = {
            position: img.style.position,
            left: img.style.left,
            right: img.style.right,
            top: img.style.top,
            transform: img.style.transform || 'translateX(0)'
        };

        // Move image to body to allow full window movement
        document.body.appendChild(img);
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.right = 'auto';

        const jumpInterval = setInterval(() => {
            if (Date.now() - startTime > 5000) {
                // Restore image to original position
                originalParent.appendChild(img);
                img.style.position = originalStyles.position;
                img.style.left = originalStyles.left;
                img.style.right = originalStyles.right;
                img.style.top = originalStyles.top;
                img.style.transform = originalStyles.transform;
                clearInterval(jumpInterval);
                return;
            }
            const maxX = window.innerWidth - 150; // Image width
            const maxY = window.innerHeight - 150; // Image height
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