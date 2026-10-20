/* =========================================================
   BAZARIA — HOME PAGE ENGINE V3
   ---------------------------------------------------------
   File:
   frontend/js/pages/home.js

   RESPONSIBILITY:
   - Wait for Bazaria global bootstrap
   - Load products through api.js
   - Normalize API response
   - Product state management
   - Category filtering
   - Local live search
   - Loading state
   - Empty state
   - Error state
   - Search + category coordination
   - Request protection
   - Safe rendering
   - Duplicate initialization protection

   ARCHITECTURE:

   main.js
       ↓
   navbar components loaded
       ↓
   bazaria:ready
       ↓
   home.js initialization
       ↓
   api.js
       ↓
   Product State
       ↓
   Search + Category
       ↓
   renderProducts.js
       ↓
   UI
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BAZARIA_HOME_CONFIG = Object.freeze({

    selectors: Object.freeze({

        searchInput:
            "#searchInput",

        productGrid:
            "gridProducts",

        moreProductGrid:
            "moreGridProducts",

        dealContainer:
            "dealProducts",

        categoryItem:
            ".cat-item"

    }),


    search: Object.freeze({

        minimumCharacters:
            0,

        debounceDelay:
            180

    }),


    messages: Object.freeze({

        loading:
            "Loading Bazaria products... 🛍️",

        noProducts:
            "No products found on Bazaria yet! 🛍️",

        noSearchResults:
            "No products matched your search.",

        error:
            "Failed to load products. Please try again. 🔄"

    })

});


/* =========================================================
   STATE
========================================================= */

const BazariaHomeState = {

    allProducts: [],

    filteredProducts: [],

    activeCategory: "",

    searchQuery: "",

    isLoading: false,

    hasError: false,

    initialized: false,

    initializing: false,

    renderVersion: 0,

    searchTimer: null,

    requestController: null,

    slider: null

};


/* =========================================================
   PAGE DETECTION
========================================================= */

function isBazariaHomePage() {

    const path =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    return (
        path === "" ||
        path === "index.html"
    );

}


/* =========================================================
   HOME ENGINE START
========================================================= */

function startBazariaHomeEngine() {

    /*
        Home engine should only run
        on Home page.
    */

    if (!isBazariaHomePage()) {

        return;

    }


    /*
        Prevent duplicate initialization.
    */

    if (
        BazariaHomeState.initialized ||
        BazariaHomeState.initializing
    ) {

        return;

    }


    BazariaHomeState.initializing =
        true;


    /*
        Navbar + other global components
        should already be loaded here.
    */

    initCategoryTabs();

    initLiveSearch();


    /*
        Load products.
    */

    void loadHomePageProducts();

}


/* =========================================================
   BAZARIA READY LISTENER
========================================================= */

/*
    main.js dispatches:

    bazaria:ready

    only after global components have
    been processed.

    This prevents home.js from trying
    to access #searchInput before the
    dynamic navbar exists.
*/

document.addEventListener(
    "bazaria:ready",
    () => {

        startBazariaHomeEngine();

    },
    {
        once: true
    }
);


/* =========================================================
   SAFE FALLBACK
========================================================= */

/*
    If main.js has already finished before
    this file attaches its listener,
    we can still initialize safely.

    If navbar is not available yet,
    we simply wait for bazaria:ready.
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            document.querySelector(
                BAZARIA_HOME_CONFIG.selectors.searchInput
            )
        ) {

            startBazariaHomeEngine();

        }

    },
    {
        once: true
    }
);


/* =========================================================
   CATEGORY SYSTEM
========================================================= */

function initCategoryTabs() {

    const categoryButtons =
        document.querySelectorAll(
            BAZARIA_HOME_CONFIG.selectors.categoryItem
        );


    if (!categoryButtons.length) {

        console.info(
            "Bazaria Home: No category buttons found."
        );

        return;

    }


    categoryButtons.forEach(
        button => {

            if (
                button.dataset
                    .bazariaCategoryReady ===
                "true"
            ) {

                return;

            }


            button.dataset
                .bazariaCategoryReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    handleCategoryChange(
                        button,
                        categoryButtons
                    );

                }
            );

        }
    );

}


/* =========================================================
   CATEGORY CHANGE
========================================================= */

function handleCategoryChange(
    selectedButton,
    allButtons
) {

    allButtons.forEach(
        button => {

            button.classList.remove(
                "active-cat"
            );

        }
    );


    selectedButton.classList.add(
        "active-cat"
    );


    const category =
        normalizeText(
            selectedButton.dataset.category ||
            selectedButton.dataset.cat ||
            selectedButton.textContent
        );


    if (
        category === "all" ||
        category === ""
    ) {

        BazariaHomeState.activeCategory =
            "";

    } else {

        BazariaHomeState.activeCategory =
            category;

    }


    applyHomeFilters();

}


/* =========================================================
   SEARCH SYSTEM
========================================================= */

function initLiveSearch() {

    const searchInput =
        document.querySelector(
            BAZARIA_HOME_CONFIG.selectors.searchInput
        );


    /*
        Important:
        Navbar may not exist yet.
    */

    if (!searchInput) {

        console.info(
            "Bazaria Home: Search input not found yet."
        );

        return;

    }


    /*
        Prevent duplicate listeners.
    */

    if (
        searchInput.dataset
            .bazariaSearchReady ===
        "true"
    ) {

        return;

    }


    searchInput.dataset
        .bazariaSearchReady =
        "true";


    searchInput.addEventListener(
        "input",
        event => {

            const value =
                event.target.value;


            clearTimeout(
                BazariaHomeState.searchTimer
            );


            BazariaHomeState.searchTimer =
                window.setTimeout(
                    () => {

                        BazariaHomeState.searchQuery =
                            normalizeText(value);


                        applyHomeFilters();

                    },
                    BAZARIA_HOME_CONFIG
                        .search
                        .debounceDelay
                );

        }
    );

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadHomePageProducts() {

    /*
        Prevent overlapping product requests.
    */

    if (
        BazariaHomeState.isLoading
    ) {

        return;

    }


    BazariaHomeState.isLoading =
        true;

    BazariaHomeState.hasError =
        false;


    setHomeLoadingState(
        true
    );


    /*
        Cancel old request if any.
    */

    if (
        BazariaHomeState.requestController
    ) {

        BazariaHomeState.requestController
            .abort();

    }


    BazariaHomeState.requestController =
        new AbortController();


    try {

        /*
            IMPORTANT:

            Product API communication remains
            inside api.js.

            home.js does NOT directly fetch.
        */

        const response =
            await fetchBazariaProducts();


        /*
            Normalize backend response.
        */

        const products =
            normalizeProductsResponse(
                response
            );


        BazariaHomeState.allProducts =
            products;


        BazariaHomeState.hasError =
            false;


        /*
            Apply current search/category
            immediately after loading.
        */

        applyHomeFilters();


    } catch (error) {

        /*
            Abort is not a real product error.
        */

        if (
            error?.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "Bazaria Home Engine Error:",
            error
        );


        BazariaHomeState.allProducts =
            [];

        BazariaHomeState.filteredProducts =
            [];

        BazariaHomeState.hasError =
            true;


        showHomeErrorState();

    } finally {

        BazariaHomeState.isLoading =
            false;


        BazariaHomeState.requestController =
            null;


        setHomeLoadingState(
            false
        );

    }

}


/* =========================================================
   API RESPONSE NORMALIZATION
========================================================= */

function normalizeProductsResponse(
    response
) {

    /*
        Response:

        [
            product,
            product
        ]
    */

    if (
        Array.isArray(response)
    ) {

        return response.filter(
            isValidProduct
        );

    }


    /*
        Response:

        {
            products: []
        }
    */

    if (
        response &&
        Array.isArray(
            response.products
        )
    ) {

        return response.products.filter(
            isValidProduct
        );

    }


    /*
        Response:

        {
            data: []
        }
    */

    if (
        response &&
        Array.isArray(
            response.data
        )
    ) {

        return response.data.filter(
            isValidProduct
        );

    }


    return [];

}


/* =========================================================
   PRODUCT VALIDATION
========================================================= */

function isValidProduct(
    product
) {

    if (
        !product ||
        typeof product !== "object"
    ) {

        return false;

    }


    const productId =
        product._id ||
        product.id;


    return Boolean(
        productId
    );

}


/* =========================================================
   FILTER ENGINE
========================================================= */

function applyHomeFilters() {

    const products =
        BazariaHomeState.allProducts;


    const searchQuery =
        BazariaHomeState.searchQuery;


    const activeCategory =
        BazariaHomeState.activeCategory;


    const filtered =
        products.filter(
            product => {

                const matchesCategory =
                    matchesProductCategory(
                        product,
                        activeCategory
                    );


                const matchesSearch =
                    matchesProductSearch(
                        product,
                        searchQuery
                    );


                return (
                    matchesCategory &&
                    matchesSearch
                );

            }
        );


    BazariaHomeState.filteredProducts =
        filtered;


    BazariaHomeState.renderVersion++;


    renderHomeProducts(
        filtered
    );

}


/* =========================================================
   CATEGORY MATCHING
========================================================= */

function matchesProductCategory(
    product,
    category
) {

    if (!category) {

        return true;

    }


    const productCategory =
        normalizeText(
            product.category
        );


    const productSubCategory =
        normalizeText(
            product.subCategory
        );


    return (
        productCategory === category ||
        productSubCategory === category
    );

}


/* =========================================================
   SEARCH MATCHING
========================================================= */

function matchesProductSearch(
    product,
    query
) {

    if (!query) {

        return true;

    }


    /*
        Search stays LOCAL for now.

        This means home.js searches the
        products already loaded from API.

        It does NOT call a /search endpoint.
    */

    const searchableFields = [

        product.name,

        product.title,

        product.category,

        product.subCategory,

        product.brand,

        product.condition,

        product.city,

        product.area

    ];


    return searchableFields.some(
        value =>
            normalizeText(value)
                .includes(query)
    );

}


/* =========================================================
   PRODUCT RENDERING
========================================================= */

function renderHomeProducts(
    products
) {

    /*
        DEALS
    */

    renderDealBanner(
        products,
        BAZARIA_HOME_CONFIG
            .selectors
            .dealContainer
    );


    /*
        MAIN PRODUCTS
    */

    renderProductGrid(
        products,
        BAZARIA_HOME_CONFIG
            .selectors
            .productGrid
    );


    /*
        MORE PRODUCTS
    */

    renderProductGrid(
        products,
        BAZARIA_HOME_CONFIG
            .selectors
            .moreProductGrid
    );


    /*
        Restart deal slider
        after rendering.
    */

    initAmazonDealSlider(
        BAZARIA_HOME_CONFIG
            .selectors
            .dealContainer
    );

}


/* =========================================================
   LOADING UI
========================================================= */

function setHomeLoadingState(
    isLoading
) {

    if (!isLoading) {

        return;

    }


    showProductLoading(
        BAZARIA_HOME_CONFIG
            .selectors
            .productGrid,

        BAZARIA_HOME_CONFIG
            .messages
            .loading
    );


    showProductLoading(
        BAZARIA_HOME_CONFIG
            .selectors
            .moreProductGrid,

        BAZARIA_HOME_CONFIG
            .messages
            .loading
    );

}


/* =========================================================
   ERROR UI
========================================================= */

function showHomeErrorState() {

    showProductRenderError(
        BAZARIA_HOME_CONFIG
            .selectors
            .productGrid,

        BAZARIA_HOME_CONFIG
            .messages
            .error
    );


    showProductRenderError(
        BAZARIA_HOME_CONFIG
            .selectors
            .moreProductGrid,

        BAZARIA_HOME_CONFIG
            .messages
            .error
    );


    const dealContainer =
        document.getElementById(
            BAZARIA_HOME_CONFIG
                .selectors
                .dealContainer
        );


    if (dealContainer) {

        renderEmptyState(
            dealContainer,

            "Deals are temporarily unavailable."
        );

    }

}


/* =========================================================
   DEAL SLIDER
========================================================= */

function initAmazonDealSlider(
    containerId
) {

    const slider =
        document.getElementById(
            containerId
        );


    if (!slider) {

        return;

    }


    /*
        Cleanup old slider instance.
    */

    if (
        slider._bazariaSliderCleanup
    ) {

        slider._bazariaSliderCleanup();

    }


    if (
        slider.scrollWidth <=
        slider.clientWidth
    ) {

        return;

    }


    const scrollStep =
        335;


    const scrollDelay =
        3000;


    let intervalId =
        null;


    let resumeTimer =
        null;


    function slideNext() {

        const reachedEnd =
            slider.scrollLeft +
            slider.clientWidth >=
            slider.scrollWidth - 5;


        if (reachedEnd) {

            slider.scrollTo({

                left: 0,

                behavior: "smooth"

            });

            return;

        }


        slider.scrollBy({

            left: scrollStep,

            behavior: "smooth"

        });

    }


    function stopAutoSlide() {

        if (
            intervalId !== null
        ) {

            clearInterval(
                intervalId
            );

            intervalId = null;

        }

    }


    function startAutoSlide() {

        stopAutoSlide();


        intervalId =
            window.setInterval(
                slideNext,
                scrollDelay
            );

    }


    function pauseThenResume() {

        stopAutoSlide();


        if (
            resumeTimer !== null
        ) {

            clearTimeout(
                resumeTimer
            );

        }


        resumeTimer =
            window.setTimeout(
                startAutoSlide,
                4000
            );

    }


    function handleMouseEnter() {

        stopAutoSlide();

    }


    function handleMouseLeave() {

        startAutoSlide();

    }


    function handleTouchStart() {

        stopAutoSlide();

    }


    function handleTouchEnd() {

        pauseThenResume();

    }


    slider.addEventListener(
        "mouseenter",
        handleMouseEnter
    );


    slider.addEventListener(
        "mouseleave",
        handleMouseLeave
    );


    slider.addEventListener(
        "touchstart",
        handleTouchStart,
        {
            passive: true
        }
    );


    slider.addEventListener(
        "touchend",
        handleTouchEnd,
        {
            passive: true
        }
    );


    slider._bazariaSliderCleanup =
        () => {

            stopAutoSlide();


            if (
                resumeTimer !== null
            ) {

                clearTimeout(
                    resumeTimer
                );

                resumeTimer = null;

            }


            slider.removeEventListener(
                "mouseenter",
                handleMouseEnter
            );


            slider.removeEventListener(
                "mouseleave",
                handleMouseLeave
            );


            slider.removeEventListener(
                "touchstart",
                handleTouchStart
            );


            slider.removeEventListener(
                "touchend",
                handleTouchEnd
            );

        };


    startAutoSlide();

}


/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim()
        .toLowerCase();

}


/* =========================================================
   PUBLIC HOME API
========================================================= */

window.BazariaHome =
    Object.freeze({

        loadProducts:
            loadHomePageProducts,

        refresh:
            loadHomePageProducts,

        applyFilters:
            applyHomeFilters,

        getState:
            () => ({

                allProducts: [
                    ...BazariaHomeState.allProducts
                ],

                filteredProducts: [
                    ...BazariaHomeState.filteredProducts
                ],

                activeCategory:
                    BazariaHomeState.activeCategory,

                searchQuery:
                    BazariaHomeState.searchQuery,

                isLoading:
                    BazariaHomeState.isLoading,

                hasError:
                    BazariaHomeState.hasError,

                initialized:
                    BazariaHomeState.initialized

            })

    });


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Bazaria Home Engine V3 loaded."
);