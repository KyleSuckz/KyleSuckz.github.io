document.addEventListener('DOMContentLoaded', () => {
    // Image animation on page load
    const mooLeft = document.getElementById('moo-left');
    const mooRight = document.getElementById('moo-right');
    const topFrame = document.getElementById('top-frame');
    let activeJumpInterval = null; // Track the active animation interval

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
        // Stop any active animation
        if (activeJumpInterval) {
            clearInterval(activeJumpInterval);
            const otherImage = img.id === 'moo-left' ? mooRight : mooLeft;
            const isOtherLeftImage = otherImage.id === 'moo-left';
            // Restore the other image to its original position
            const otherPlaceholder = otherImage.nextElementSibling && otherImage.nextElementSibling.tagName === 'DIV' && otherImage.nextElementSibling.style.visibility === 'hidden' ? otherImage.nextElementSibling : null;
            if (otherPlaceholder) {
                topFrame.insertBefore(otherImage, otherPlaceholder);
                otherPlaceholder.remove();
                otherImage.style.position = 'relative';
                otherImage.style.left = isOtherLeftImage ? '0' : 'auto';
                otherImage.style.right = isOtherLeftImage ? 'auto' : '0';
                otherImage.style.top = '0';
                otherImage.style.transform = 'translateX(0)';
            }
        }

        const startTime = Date.now();
        const isLeftImage = img.id === 'moo-left';
        const originalStyles = {
            position: img.style.position,
            left: img.style.left,
            right: img.style.right,
            top: img.style.top,
            transform: img.style.transform || 'translateX(0)'
        };

        // Create a placeholder to maintain flexbox layout
        const placeholder = document.createElement('div');
        placeholder.style.width = '150px';
        placeholder.style.height = '150px';
        placeholder.style.visibility = 'hidden';
        if (isLeftImage) {
            topFrame.insertBefore(placeholder, mooRight);
        } else {
            topFrame.appendChild(placeholder);
        }

        // Move image to body for full window jumping
        document.body.appendChild(img);
        img.style.position = 'fixed';

        // Set initial random position
        const maxX = window.innerWidth - 150; // Image width
        const maxY = window.innerHeight - 150; // Image height
        img.style.left = `${Math.random() * maxX}px`;
        img.style.top = `${Math.random() * maxY}px`;
        img.style.right = 'auto';
        img.style.transform = 'none';

        // Start jumping
        activeJumpInterval = setInterval(() => {
            if (Date.now() - startTime > 5000) {
                // Restore image to original position
                topFrame.insertBefore(img, placeholder);
                placeholder.remove();
                img.style.position = originalStyles.position;
                img.style.left = isLeftImage ? '0' : 'auto';
                img.style.right = isLeftImage ? 'auto' : '0';
                img.style.top = '0';
                img.style.transform = originalStyles.transform;
                activeJumpInterval = null; // Clear active interval
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