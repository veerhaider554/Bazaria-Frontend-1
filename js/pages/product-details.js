/* =========================================================
   BAZARIA — PRODUCT GALLERY V2
   Professional Gallery Controller
   HTML STRUCTURE: UNCHANGED
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const gallery = document.querySelector(".product-gallery-section");

    if (!gallery) return;


    const wrapper = gallery.querySelector(".product-main-image-wrapper");
    const imageBox = gallery.querySelector(".product-main-image");
    const mainImage = gallery.querySelector(".product-main-image img");

    const prevBtn = gallery.querySelector(".gallery-prev-btn");
    const nextBtn = gallery.querySelector(".gallery-next-btn");

    const counter = gallery.querySelector(".product-image-counter");

    const thumbnailWrapper =
        gallery.querySelector(".product-thumbnail-wrapper");

    const thumbnails = [
        ...gallery.querySelectorAll(".product-thumbnail")
    ];

    if (!wrapper || !imageBox || !mainImage) return;


    /* =====================================================
       IMAGE COLLECTION
    ===================================================== */

    const images = thumbnails
        .map(thumbnail => {

            const img = thumbnail.querySelector("img");

            return img ? img.currentSrc || img.src : null;

        })
        .filter(Boolean);


    /*
        If thumbnails are not available,
        gallery still remains usable.
    */

    if (!images.length) {
        images.push(
            mainImage.currentSrc ||
            mainImage.src
        );
    }


    /* =====================================================
       STATE
    ===================================================== */

    let currentIndex = 0;

    let zoom = 1;

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3;

    const ZOOM_STEP = 0.25;

    let panX = 0;
    let panY = 0;


    /* =====================================================
       HELPERS
    ===================================================== */

    function clamp(value, min, max) {
        return Math.min(
            Math.max(value, min),
            max
        );
    }


    function updateTransform() {

        imageBox.style.setProperty(
            "--gallery-zoom",
            zoom
        );

        imageBox.style.setProperty(
            "--gallery-pan-x",
            `${panX}px`
        );

        imageBox.style.setProperty(
            "--gallery-pan-y",
            `${panY}px`
        );
    }


    function resetZoom() {

        zoom = 1;

        panX = 0;
        panY = 0;

        updateTransform();

        updateZoomUI();
    }


    function updateZoomUI() {

        const value =
            gallery.querySelector(".gallery-zoom-value");

        if (!value) return;

        value.textContent =
            `${Math.round(zoom * 100)}%`;
    }


    /* =====================================================
       IMAGE COUNTER
    ===================================================== */

    function updateCounter() {

        if (!counter) return;

        counter.textContent =
            `${currentIndex + 1} / ${images.length}`;
    }


    /* =====================================================
       THUMBNAIL STATE
    ===================================================== */

    function updateThumbnails() {

        thumbnails.forEach((thumbnail, index) => {

            thumbnail.classList.toggle(
                "active",
                index === currentIndex
            );

        });


        /*
            Keep active thumbnail visible.
        */

        const activeThumbnail =
            thumbnails[currentIndex];

        if (
            activeThumbnail &&
            thumbnailWrapper
        ) {

            activeThumbnail.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });

        }
    }


    /* =====================================================
       ARROW STATE
    ===================================================== */

    function updateNavigation() {

        if (prevBtn) {

            prevBtn.disabled =
                currentIndex <= 0;

            prevBtn.classList.toggle(
                "is-disabled",
                currentIndex <= 0
            );
        }


        if (nextBtn) {

            nextBtn.disabled =
                currentIndex >= images.length - 1;

            nextBtn.classList.toggle(
                "is-disabled",
                currentIndex >= images.length - 1
            );
        }
    }


    /* =====================================================
       SHOW IMAGE
    ===================================================== */

    function showImage(index) {

        if (!images.length) return;


        currentIndex = clamp(
            index,
            0,
            images.length - 1
        );


        const nextSource =
            images[currentIndex];


        if (
            mainImage.src !== nextSource
        ) {

            mainImage.src =
                nextSource;
        }


        /*
            Every image starts from
            normal scale.
        */

        resetZoom();

        updateCounter();

        updateThumbnails();

        updateNavigation();
    }


    /* =====================================================
       NEXT
    ===================================================== */

    function nextImage() {

        if (
            currentIndex >=
            images.length - 1
        ) {
            return;
        }

        showImage(
            currentIndex + 1
        );
    }


    /* =====================================================
       PREVIOUS
    ===================================================== */

    function previousImage() {

        if (
            currentIndex <= 0
        ) {
            return;
        }

        showImage(
            currentIndex - 1
        );
    }


    /* =====================================================
       THUMBNAILS
    ===================================================== */

    thumbnails.forEach(
        (thumbnail, index) => {

            thumbnail.addEventListener(
                "click",
                () => {

                    showImage(index);

                }
            );

        }
    );


    /* =====================================================
       ARROWS
    ===================================================== */

    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            previousImage
        );

    }


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            nextImage
        );

    }


    /* =====================================================
       CREATE ZOOM UI
       NO HTML CHANGE REQUIRED
    ===================================================== */

    let zoomControls =
        gallery.querySelector(
            ".gallery-zoom-controls"
        );


    if (!zoomControls) {

        zoomControls =
            document.createElement("div");

        zoomControls.className =
            "gallery-zoom-controls";


        const zoomOut =
            document.createElement("button");

        zoomOut.type = "button";

        zoomOut.className =
            "gallery-zoom-out";

        zoomOut.setAttribute(
            "aria-label",
            "Zoom out"
        );

        zoomOut.innerHTML = "−";


        const zoomValue =
            document.createElement("span");

        zoomValue.className =
            "gallery-zoom-value";


        const zoomIn =
            document.createElement("button");

        zoomIn.type = "button";

        zoomIn.className =
            "gallery-zoom-in";

        zoomIn.setAttribute(
            "aria-label",
            "Zoom in"
        );

        zoomIn.innerHTML = "+";


        zoomControls.append(
            zoomOut,
            zoomValue,
            zoomIn
        );


        wrapper.appendChild(
            zoomControls
        );
    }


    const zoomInBtn =
        zoomControls.querySelector(
            ".gallery-zoom-in"
        );

    const zoomOutBtn =
        zoomControls.querySelector(
            ".gallery-zoom-out"
        );


    /* =====================================================
       ZOOM IN
    ===================================================== */

    function zoomIn() {

        zoom =
            clamp(
                zoom + ZOOM_STEP,
                MIN_ZOOM,
                MAX_ZOOM
            );


        if (zoom === 1) {

            panX = 0;
            panY = 0;

        }


        updateTransform();

        updateZoomUI();
    }


    /* =====================================================
       ZOOM OUT
    ===================================================== */

    function zoomOut() {

        zoom =
            clamp(
                zoom - ZOOM_STEP,
                MIN_ZOOM,
                MAX_ZOOM
            );


        if (zoom === 1) {

            panX = 0;
            panY = 0;

        }


        updateTransform();

        updateZoomUI();
    }


    if (zoomInBtn) {

        zoomInBtn.addEventListener(
            "click",
            zoomIn
        );

    }


    if (zoomOutBtn) {

        zoomOutBtn.addEventListener(
            "click",
            zoomOut
        );

    }


    /* =====================================================
       MOUSE WHEEL ZOOM
    ===================================================== */

    imageBox.addEventListener(
        "wheel",
        event => {

            /*
                Only zoom while
                user intentionally uses wheel.
            */

            if (
                event.ctrlKey ||
                event.deltaY !== 0
            ) {

                event.preventDefault();

                if (
                    event.deltaY < 0
                ) {

                    zoomIn();

                } else {

                    zoomOut();

                }

            }

        },
        {
            passive: false
        }
    );


    /* =====================================================
       DOUBLE CLICK / DOUBLE TAP
    ===================================================== */

    imageBox.addEventListener(
        "dblclick",
        () => {

            if (zoom === 1) {

                zoom = 2;

            } else {

                zoom = 1;

                panX = 0;
                panY = 0;

            }


            updateTransform();

            updateZoomUI();

        }
    );


    /* =====================================================
       KEYBOARD
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            /*
                Don't control gallery when
                typing inside an input.
            */

            const tag =
                document.activeElement?.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT"
            ) {
                return;
            }


            if (
                event.key === "ArrowLeft"
            ) {

                previousImage();

            }


            if (
                event.key === "ArrowRight"
            ) {

                nextImage();

            }


            if (
                event.key === "+"
                ||
                event.key === "="
            ) {

                zoomIn();

            }


            if (
                event.key === "-"
            ) {

                zoomOut();

            }


            if (
                event.key === "0"
            ) {

                resetZoom();

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    /*
        Don't replace the initial main image
        unnecessarily.
    */

    if (
        images.length &&
        mainImage.src
    ) {

        const foundIndex =
            images.findIndex(
                src =>
                    src ===
                    mainImage.currentSrc ||
                    src ===
                    mainImage.src
            );


        if (foundIndex >= 0) {

            currentIndex =
                foundIndex;

        }

    }


    updateTransform();

    updateZoomUI();

    updateCounter();

    updateThumbnails();

    updateNavigation();

});