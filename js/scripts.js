document.addEventListener('DOMContentLoaded', () => {
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');
    const mainContent = document.getElementById('main-content');

    // Slide images to middle and back on page load
    function slideImages() {
        const totalWidth = 300; // 150px each
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

    // Jump animation on click with slower movement
    function jumpAround(img) {
        const topFrame = document.getElementById('top-frame');
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

        document.body.appendChild(img);
        img.style.position = 'fixed';
        img.style.zIndex = '999';
        img.style.pointerEvents = 'none';

        const maxX = window.innerWidth - 150;
        const maxY = window.innerHeight - 150;

        function animate() {
            if (Date.now() - startTime > 5000) {
                topFrame.appendChild(img);
                Object.assign(img.style, originalStyles);
                return;
            }
            // Slow down movement by limiting updates to every 200ms
            const elapsed = Date.now() - startTime;
            if (elapsed % 400 < 10) { // Update every 400ms
                const randomX = Math.random() * maxX;
                const randomY = Math.random() * maxY;
                img.style.left = `${randomX}px`;
                img.style.top = `${randomY}px`;
            }
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
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
    mooLeft.addEventListener('click', () => jumpAround(mooLeft));
    mooRight.addEventListener('click', () => jumpAround(mooRight));
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            loadPageInIframe(page);
        });
    });
});
