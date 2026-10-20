/* =========================================================
   BAZARIA — PRODUCT RENDER ENGINE V3

   File:
   frontend/js/components/renderProducts.js

   RESPONSIBILITY:
   - Render normal product cards
   - Render deal cards
   - Normalize product data
   - Safe DOM rendering
   - Optimized image loading
   - Image fallback
   - Price formatting
   - Empty states
   - Loading states
   - Product navigation
   - Event delegation

   IMPORTANT:
   This file does NOT call the API.
========================================================= */


/* =========================================================
   BAZARIA RENDER CONFIG
========================================================= */

const BAZARIA_RENDER_CONFIG = Object.freeze({

    placeholderImage:
        "./assets/images/product-placeholder.jpg",

    animationDelay:
        200,

    currency:
        "Rs ",

    defaultProductName:
        "Unnamed Product",

    defaultDealName:
        "Deal Product",

    /*
     * First few visible cards can load eagerly.
     * Remaining images stay lazy.
     */
    eagerProductImages:
        4,

    eagerDealImages:
        2

});


/* =========================================================
   INTERNAL HELPERS
========================================================= */


/**
 * Safely convert any value into a clean string.
 */
function safeString(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value).trim() || fallback;
}


/**
 * Safely convert a value into a valid number.
 */
function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/**
 * Format product price.
 */
function formatProductPrice(
    price
) {

    const numericPrice =
        safeNumber(
            price,
            0
        );


    return (
        BAZARIA_RENDER_CONFIG.currency +
        numericPrice.toLocaleString(
            "en-PK"
        )
    );

}


/**
 * Get product ID safely.
 */
function getProductId(
    product
) {

    if (
        !product ||
        typeof product !== "object"
    ) {
        return "";
    }


    return safeString(
        product._id ||
        product.id ||
        ""
    );

}


/**
 * Extract the first usable product image.
 *
 * Supports:
 *
 * images: [
 *     "https://..."
 * ]
 *
 * OR:
 *
 * images: [
 *     {
 *         url: "...",
 *         public_id: "..."
 *     }
 * ]
 */
function getProductImage(
    product
) {

    const images =
        Array.isArray(
            product?.images
        )
            ? product.images
            : [];


    for (
        const image of images
    ) {

        if (
            typeof image === "string"
        ) {

            const url =
                image.trim();


            if (url) {
                return url;
            }

        }


        if (
            image &&
            typeof image === "object"
        ) {

            const url =
                safeString(
                    image.url
                );


            if (url) {
                return url;
            }

        }

    }


    return (
        BAZARIA_RENDER_CONFIG
            .placeholderImage
    );

}


/**
 * Get product display name.
 */
function getProductName(
    product
) {

    return safeString(

        product?.name ||
        product?.title,

        BAZARIA_RENDER_CONFIG
            .defaultProductName

    );

}


/**
 * Get image alt text.
 */
function getProductAlt(
    product
) {

    return getProductName(
        product
    );

}


/**
 * Create an element.
 */
function createElement(
    tagName,
    className = ""
) {

    const element =
        document.createElement(
            tagName
        );


    if (className) {

        element.className =
            className;

    }


    return element;

}


/**
 * Create text element.
 */
function createTextElement(
    tagName,
    className,
    text
) {

    const element =
        createElement(
            tagName,
            className
        );


    element.textContent =
        safeString(
            text
        );


    return element;

}


/* =========================================================
   IMAGE CREATION
========================================================= */


/**
 * Create an optimized product image.
 *
 * IMPORTANT:
 * Loading/decoding/fetchPriority are assigned
 * BEFORE src so the browser receives loading
 * instructions before starting the image request.
 */
function createProductImage(
    product,
    className = "card-image",
    options = {}
) {

    const image =
        createElement(
            "img",
            className
        );


    const source =
        getProductImage(
            product
        );


    const eager =
        options.eager === true;


    image.alt =
        getProductAlt(
            product
        );


    /*
     * Set browser loading strategy first.
     */
    image.loading =
        eager
            ? "eager"
            : "lazy";


    /*
     * Async decoding prevents image decoding
     * from blocking the main UI thread where possible.
     */
    image.decoding =
        "async";


    /*
     * Prioritize only the first visible images.
     * Avoid making every image high priority.
     */
    image.fetchPriority =
        eager
            ? "high"
            : "auto";


    /*
     * Fallback protection.
     */
    image.addEventListener(
        "error",
        () => {

            const fallback =
                BAZARIA_RENDER_CONFIG
                    .placeholderImage;


            /*
             * Prevent an endless fallback loop.
             */
            if (
                image.dataset.fallbackApplied ===
                "true"
            ) {

                return;

            }


            if (
                image.src !== fallback
            ) {

                image.dataset.fallbackApplied =
                    "true";


                image.src =
                    fallback;

            }

        }
    );


    /*
     * Set source AFTER loading strategy.
     */
    image.src =
        source;


    return image;

}


/* =========================================================
   PRODUCT CARD
========================================================= */


/**
 * Create standard Bazaria product card.
 */
function createProductCard(
    product,
    options = {}
) {

    if (
        !product ||
        typeof product !== "object"
    ) {
        return null;
    }


    const productId =
        getProductId(
            product
        );


    if (!productId) {

        console.warn(
            "Bazaria: Product skipped because _id is missing.",
            product
        );


        return null;

    }


    const productName =
        getProductName(
            product
        );


    const card =
        createElement(
            "article",
            "product-card"
        );


    card.dataset.productId =
        productId;


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        `View ${productName}`
    );


    /* =====================================================
       IMAGE CONTAINER
    ===================================================== */

    const imageContainer =
        createElement(
            "div",
            "card-image-container"
        );


    const image =
        createProductImage(

            product,

            "card-image",

            {
                eager:
                    options.eager === true
            }

        );


    imageContainer.appendChild(
        image
    );


    /* =====================================================
       CARD BODY
    ===================================================== */

    const cardBody =
        createElement(
            "div",
            "card-body"
        );


    const title =
        createTextElement(
            "div",
            "product-title",
            productName
        );


    title.title =
        productName;


    const priceRow =
        createElement(
            "div",
            "product-price-row"
        );


    const price =
        createTextElement(
            "div",
            "product-price",
            formatProductPrice(
                product.price
            )
        );


    priceRow.appendChild(
        price
    );


    cardBody.append(
        title,
        priceRow
    );


    /* =====================================================
       CARD ASSEMBLY
    ===================================================== */

    card.append(
        imageContainer,
        cardBody
    );


    return card;

}


/* =========================================================
   EVENT DELEGATION
========================================================= */


/**
 * Attach one navigation system to a whole container.
 *
 * Instead of:
 *
 * 100 cards × multiple listeners
 *
 * we use:
 *
 * 1 container × delegated listeners
 *
 * This scales better as product counts increase.
 */
function attachProductContainerNavigation(
    container
) {

    if (!container) {
        return;
    }


    /*
     * Prevent duplicate listeners.
     */
    if (
        container.dataset
            .bazariaNavigationReady ===
        "true"
    ) {

        return;

    }


    container.dataset
        .bazariaNavigationReady =
        "true";


    container.addEventListener(
        "click",
        event => {

            const card =
                event.target.closest(
                    ".product-card"
                );


            if (
                !card ||
                !container.contains(card)
            ) {

                return;

            }


            activateProductCard(
                card,
                event
            );

        }
    );


    container.addEventListener(
        "keydown",
        event => {

            const card =
                event.target.closest(
                    ".product-card"
                );


            if (
                !card ||
                !container.contains(card)
            ) {

                return;

            }


            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {

                return;

            }


            activateProductCard(
                card,
                event
            );

        }
    );

}


/**
 * Activate a product card.
 */
function activateProductCard(
    card,
    event
) {

    if (!card) {
        return;
    }


    if (event) {
        event.preventDefault();
    }


    if (
        card.classList.contains(
            "clicked"
        )
    ) {

        return;

    }


    const productId =
        safeString(
            card.dataset.productId
        );


    if (!productId) {
        return;
    }


    card.classList.add(
        "clicked"
    );


    window.setTimeout(
        () => {

            viewProductDetails(
                productId
            );

        },

        BAZARIA_RENDER_CONFIG
            .animationDelay

    );

}


/* =========================================================
   PRODUCT GRID RENDERER
========================================================= */


/**
 * Render normal products.
 */
function renderProductGrid(
    products,
    containerId = "product-grid"
) {

    const productGrid =
        document.getElementById(
            containerId
        );


    if (!productGrid) {

        console.warn(
            `Bazaria: Product container #${containerId} not found.`
        );


        return;

    }


    const productList =
        Array.isArray(products)
            ? products
            : [];


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (
        !productList.length
    ) {

        renderEmptyState(
            productGrid,
            "No products found on Bazaria yet! 🛍️"
        );


        return;

    }


    /* =====================================================
       BUILD OFF-DOM
    ===================================================== */

    const fragment =
        document.createDocumentFragment();


    let renderedCount =
        0;


    productList.forEach(
        (
            product,
            index
        ) => {

            const card =
                createProductCard(
                    product,
                    {
                        /*
                         * Only first few cards
                         * are treated as above-fold priority.
                         */
                        eager:
                            index <
                            BAZARIA_RENDER_CONFIG
                                .eagerProductImages
                    }
                );


            if (card) {

                fragment.appendChild(
                    card
                );


                renderedCount++;

            }

        }
    );


    /* =====================================================
       NOTHING VALID TO RENDER
    ===================================================== */

    if (
        !renderedCount
    ) {

        renderEmptyState(
            productGrid,
            "No valid products available right now."
        );


        return;

    }


    /* =====================================================
       SINGLE DOM UPDATE
    ===================================================== */

    productGrid.replaceChildren(
        fragment
    );


    /*
     * One delegated event system per container.
     */
    attachProductContainerNavigation(
        productGrid
    );

}


/* =========================================================
   DEAL CARD
========================================================= */


/**
 * Create image-only deal card.
 */
function createDealCard(
    product,
    options = {}
) {

    if (
        !product ||
        typeof product !== "object"
    ) {
        return null;
    }


    const productId =
        getProductId(
            product
        );


    if (!productId) {

        console.warn(
            "Bazaria: Deal skipped because product ID is missing.",
            product
        );


        return null;

    }


    const card =
        createElement(
            "article",
            "product-card"
        );


    card.dataset.productId =
        productId;


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        `View ${safeString(
            product.name,
            BAZARIA_RENDER_CONFIG
                .defaultDealName
        )}`
    );


    /* =====================================================
       IMAGE
    ===================================================== */

    const imageContainer =
        createElement(
            "div",
            "card-image-container"
        );


    const image =
        createProductImage(

            product,

            "card-image",

            {
                eager:
                    options.eager === true
            }

        );


    imageContainer.appendChild(
        image
    );


    card.appendChild(
        imageContainer
    );


    return card;

}


/* =========================================================
   DEAL BANNER RENDERER
========================================================= */


/**
 * Render image-only deal slider.
 */
function renderDealBanner(
    products,
    containerId = "dealProducts"
) {

    const bannerContainer =
        document.getElementById(
            containerId
        );


    if (!bannerContainer) {

        console.warn(
            `Bazaria: Deal container #${containerId} not found.`
        );


        return;

    }


    const productList =
        Array.isArray(products)
            ? products
            : [];


    /* =====================================================
       EMPTY DEALS
    ===================================================== */

    if (
        !productList.length
    ) {

        renderEmptyState(
            bannerContainer,
            "No deals available right now!"
        );


        return;

    }


    /* =====================================================
       BUILD OFF-DOM
    ===================================================== */

    const fragment =
        document.createDocumentFragment();


    let renderedCount =
        0;


    productList.forEach(
        (
            product,
            index
        ) => {

            const card =
                createDealCard(
                    product,
                    {
                        eager:
                            index <
                            BAZARIA_RENDER_CONFIG
                                .eagerDealImages
                    }
                );


            if (card) {

                fragment.appendChild(
                    card
                );


                renderedCount++;

            }

        }
    );


    if (
        !renderedCount
    ) {

        renderEmptyState(
            bannerContainer,
            "No deals available right now."
        );


        return;

    }


    bannerContainer.replaceChildren(
        fragment
    );


    attachProductContainerNavigation(
        bannerContainer
    );

}


/* =========================================================
   EMPTY STATE
========================================================= */


/**
 * Render reusable empty state.
 */
function renderEmptyState(
    container,
    message
) {

    if (!container) {
        return;
    }


    const emptyState =
        createElement(
            "p",
            "no-product-msg"
        );


    emptyState.textContent =
        safeString(
            message,
            "Nothing to show right now."
        );


    container.replaceChildren(
        emptyState
    );

}


/* =========================================================
   LOADING STATE
========================================================= */


/**
 * Reusable loading state.
 */
function showProductLoading(
    containerId = "gridProducts",
    message =
        "Loading Bazaria products... 🛍️"
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const loading =
        createElement(
            "p",
            "loading-msg"
        );


    loading.setAttribute(
        "role",
        "status"
    );


    loading.setAttribute(
        "aria-live",
        "polite"
    );


    loading.textContent =
        message;


    container.replaceChildren(
        loading
    );

}


/* =========================================================
   ERROR STATE
========================================================= */


/**
 * Reusable rendering error state.
 */
function showProductRenderError(
    containerId = "gridProducts",
    message =
        "Products could not be displayed. Please try again."
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const error =
        createElement(
            "p",
            "no-product-msg"
        );


    error.setAttribute(
        "role",
        "alert"
    );


    error.textContent =
        message;


    container.replaceChildren(
        error
    );

}


/* =========================================================
   PRODUCT DETAILS NAVIGATION
========================================================= */


/**
 * Navigate to Product Details.
 */
function viewProductDetails(
    productId
) {

    const cleanId =
        safeString(
            productId
        );


    if (!cleanId) {

        console.error(
            "Bazaria: Cannot open product details. Product ID missing."
        );


        return;

    }


    const encodedId =
        encodeURIComponent(
            cleanId
        );


    window.location.href =
        `product-details.html?id=${encodedId}`;

}


/* =========================================================
   PUBLIC HELPERS
========================================================= */

window.BazariaRender =
    Object.freeze({

        renderProductGrid,

        renderDealBanner,

        createProductCard,

        createDealCard,

        showProductLoading,

        showProductRenderError,

        renderEmptyState,

        viewProductDetails

    });