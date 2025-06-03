document.addEventListener('DOMContentLoaded', () => {
    // Image animation on page load
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');
    const topFrame = document.getElementById('top-frame');
    const placeholders = new Map(); // Track placeholders per image

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
        const isLeftImage = img.id === 'moo-left';
        const imageId = img.id;
        const originalStyles = {
            position: img.style.position,
            left: img.style.left,
            right: img.style.right,
            top: img.style.top,
            transform: img.style.transform || 'translateX(0)',
            zIndex: img.style.zIndex || '100',
            pointerEvents: img.style.pointerEvents || 'auto'
        };

        // Remove existing placeholder for this image, if any
        if (placeholders.has(imageId)) {
            placeholders.get(imageId).remove();
            placeholders.delete(imageId);
        }

        // Create a new placeholder
        const placeholder = document.createElement('div');
        placeholder.style.width = '150px';
        placeholder.style.height = '150px';
        placeholder.style.visibility = 'hidden';
        placeholder.dataset.imageId = imageId;
        placeholders.set(imageId, placeholder);

        // Insert placeholder
        if (isLeftImage) {
            topFrame.insertBefore(placeholder, topFrame.firstChild); // Always first for moo-left
        } else {
            topFrame.appendChild(placeholder); // Always last for moo-right
        }

        // Move image to body for full window jumping
        document.body.appendChild(img);
        img.style.position = 'fixed';
        img.style.zIndex = '50'; // Lower than non-jumping image
        img.style.pointerEvents = 'none'; // Prevent capturing clicks

        // Set initial random position
        const maxX = window.innerWidth - 150; // Image width
        const maxY = window.innerHeight - 150; // Image height
        img.style.left = `${Math.random() * maxX}px`;
        img.style.top = `${Math.random() * maxY}px`;
        img.style.right = 'auto';
        img.style.transform = 'none';

        // Start jumping
        const jumpInterval = setInterval(() => {
            if (Date.now() - startTime > 5000) {
                // Restore image to original position
                const currentPlaceholder = placeholders.get(imageId);
                if (currentPlaceholder && currentPlaceholder.parentNode === topFrame) {
                    topFrame.insertBefore(img, currentPlaceholder);
                    currentPlaceholder.remove();
                } else {
                    // Fallback: insert based on image position
                    if (isLeftImage) {
                        topFrame.insertBefore(img, topFrame.firstChild);
                    } else {
                        topFrame.appendChild(img);
                    }
                }
                placeholders.delete(imageId);
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