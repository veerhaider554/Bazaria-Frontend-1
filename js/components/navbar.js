/* =========================================================
   BAZARIA — NAVBAR CONTROLLER V3

   File:
   frontend/js/components/navbar.js

   RESPONSIBILITY:
   - Top navbar show / hide
   - Bottom navbar show / hide
   - Scroll direction handling
   - Smooth scroll state
   - Mobile keyboard handling
   - Dynamic navbar initialization
   - Duplicate initialization protection

   IMPORTANT:
   This file does NOT:
   - load navbar HTML
   - call product APIs
   - control product rendering
   - control page navigation loading

   main.js loads the navbar.
   navbar.js controls its behavior.
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BAZARIA_NAVBAR_CONFIG = Object.freeze({

    selectors: Object.freeze({

        navbar:
            ".navbar",

        bottomNav:
            ".bottom-nav",

        searchInput:
            ".search-box input"

    }),

    scroll: Object.freeze({

        /*
         * Ignore tiny movements.
         * This prevents flickering while scrolling.
         */
        movementThreshold:
            12,

        /*
         * Keep navigation visible near top.
         */
        topOffset:
            12,

        /*
         * Hide animation state.
         */
        hideTopClass:
            "hide-navbar",

        hideBottomClass:
            "hide-bottom"

    }),

    keyboard: Object.freeze({

        className:
            "keyboard-open"

    }),

    debug:
        false

});


/* =========================================================
   RUNTIME STATE
========================================================= */

const BAZARIA_NAVBAR_STATE = {

    initialized:
        false,

    scrollListening:
        false,

    keyboardListening:
        false,

    animationFrame:
        null,

    lastScrollY:
        0,

    pendingScrollY:
        0,

    isHidden:
        false,

    keyboardOpen:
        false

};


/* =========================================================
   LOGGING
========================================================= */

function navbarLog(
    ...args
) {

    if (
        !BAZARIA_NAVBAR_CONFIG.debug
    ) {

        return;

    }


    console.log(
        "[Bazaria Navbar]",
        ...args
    );

}


/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getNavbarElement() {

    return document.querySelector(
        BAZARIA_NAVBAR_CONFIG
            .selectors
            .navbar
    );

}


function getBottomNavbarElement() {

    return document.querySelector(
        BAZARIA_NAVBAR_CONFIG
            .selectors
            .bottomNav
    );

}


/* =========================================================
   NAVBAR VISIBILITY
========================================================= */

/**
 * Show both navigation bars.
 */
function showNavbar() {

    const navbar =
        getNavbarElement();


    const bottomNav =
        getBottomNavbarElement();


    if (
        navbar
    ) {

        navbar.classList.remove(
            BAZARIA_NAVBAR_CONFIG
                .scroll
                .hideTopClass
        );

    }


    if (
        bottomNav
    ) {

        bottomNav.classList.remove(
            BAZARIA_NAVBAR_CONFIG
                .scroll
                .hideBottomClass
        );

    }


    BAZARIA_NAVBAR_STATE
        .isHidden =
        false;


    navbarLog(
        "Navbar shown"
    );

}


/**
 * Hide both navigation bars.
 */
function hideNavbar() {

    const navbar =
        getNavbarElement();


    const bottomNav =
        getBottomNavbarElement();


    if (
        navbar
    ) {

        navbar.classList.add(
            BAZARIA_NAVBAR_CONFIG
                .scroll
                .hideTopClass
        );

    }


    if (
        bottomNav
    ) {

        bottomNav.classList.add(
            BAZARIA_NAVBAR_CONFIG
                .scroll
                .hideBottomClass
        );

    }


    BAZARIA_NAVBAR_STATE
        .isHidden =
        true;


    navbarLog(
        "Navbar hidden"
    );

}


/* =========================================================
   SCROLL ENGINE
========================================================= */

/**
 * Apply the current scroll position.
 *
 * Runs inside requestAnimationFrame
 * so visual updates stay synchronized
 * with browser rendering.
 */
function applyScrollState() {

    BAZARIA_NAVBAR_STATE
        .animationFrame =
        null;


    const currentScroll =
        Math.max(
            0,
            window.scrollY ||
            window.pageYOffset ||
            0
        );


    const lastScroll =
        BAZARIA_NAVBAR_STATE
            .lastScrollY;


    const delta =
        currentScroll -
        lastScroll;


    /*
     * Always show navbar near the top.
     */
    if (
        currentScroll <=
        BAZARIA_NAVBAR_CONFIG
            .scroll
            .topOffset
    ) {

        showNavbar();


        BAZARIA_NAVBAR_STATE
            .lastScrollY =
            currentScroll;


        return;

    }


    /*
     * Ignore tiny movements.
     */
    if (
        Math.abs(delta) <
        BAZARIA_NAVBAR_CONFIG
            .scroll
            .movementThreshold
    ) {

        BAZARIA_NAVBAR_STATE
            .lastScrollY =
            currentScroll;


        return;

    }


    /*
     * Scrolling downward.
     */
    if (
        delta > 0
    ) {

        if (
            !BAZARIA_NAVBAR_STATE
                .keyboardOpen
        ) {

            hideNavbar();

        }

    }


    /*
     * Scrolling upward.
     */
    else {

        showNavbar();

    }


    BAZARIA_NAVBAR_STATE
        .lastScrollY =
        currentScroll;

}


/**
 * Window scroll handler.
 *
 * Only stores the newest position and
 * schedules one animation frame.
 */
function handleScroll() {

    BAZARIA_NAVBAR_STATE
        .pendingScrollY =
        window.scrollY ||
        window.pageYOffset ||
        0;


    if (
        BAZARIA_NAVBAR_STATE
            .animationFrame !== null
    ) {

        return;

    }


    BAZARIA_NAVBAR_STATE
        .animationFrame =
        window.requestAnimationFrame(
            applyScrollState
        );

}


/* =========================================================
   SCROLL INITIALIZATION
========================================================= */

function initializeScrollBehavior() {

    if (
        BAZARIA_NAVBAR_STATE
            .scrollListening
    ) {

        return;

    }


    window.addEventListener(
        "scroll",
        handleScroll,
        {
            passive:
                true
        }
    );


    BAZARIA_NAVBAR_STATE
        .scrollListening =
        true;


    /*
     * Start from the current page position.
     */
    BAZARIA_NAVBAR_STATE
        .lastScrollY =
        Math.max(
            0,
            window.scrollY ||
            window.pageYOffset ||
            0
        );


    /*
     * Always start visible.
     */
    showNavbar();


    navbarLog(
        "Scroll behavior initialized"
    );

}


/* =========================================================
   KEYBOARD / SEARCH STATE
========================================================= */

/**
 * Handle search focus using event delegation.
 *
 * Delegation matters because the navbar HTML
 * is injected dynamically by main.js.
 */
function handleFocusIn(
    event
) {

    const searchInput =
        event.target.closest(
            BAZARIA_NAVBAR_CONFIG
                .selectors
                .searchInput
        );


    if (
        !searchInput
    ) {

        return;

    }


    BAZARIA_NAVBAR_STATE
        .keyboardOpen =
        true;


    const bottomNav =
        getBottomNavbarElement();


    if (
        bottomNav
    ) {

        bottomNav.classList.add(
            BAZARIA_NAVBAR_CONFIG
                .keyboard
                .className
        );

    }


    navbarLog(
        "Keyboard/search mode opened"
    );

}


/**
 * Handle search blur.
 */
function handleFocusOut(
    event
) {

    const searchInput =
        event.target.closest(
            BAZARIA_NAVBAR_CONFIG
                .selectors
                .searchInput
        );


    if (
        !searchInput
    ) {

        return;

    }


    /*
     * Wait one tick so focus can move to
     * another element inside the search UI
     * without flickering.
     */
    window.setTimeout(
        () => {

            const activeElement =
                document.activeElement;


            const stillInSearch =
                activeElement &&
                activeElement.closest &&
                activeElement.closest(
                    BAZARIA_NAVBAR_CONFIG
                        .selectors
                        .searchInput
                );


            if (
                stillInSearch
            ) {

                return;

            }


            BAZARIA_NAVBAR_STATE
                .keyboardOpen =
                false;


            const bottomNav =
                getBottomNavbarElement();


            if (
                bottomNav
            ) {

                bottomNav.classList.remove(
                    BAZARIA_NAVBAR_CONFIG
                        .keyboard
                        .className
                );

            }


            navbarLog(
                "Keyboard/search mode closed"
            );

        },
        0
    );

}


/* =========================================================
   KEYBOARD INITIALIZATION
========================================================= */

function initializeKeyboardBehavior() {

    if (
        BAZARIA_NAVBAR_STATE
            .keyboardListening
    ) {

        return;

    }


    /*
     * Document-level delegation.
     *
     * Works even when navbar HTML is
     * inserted after this JS file loads.
     */
    document.addEventListener(
        "focusin",
        handleFocusIn
    );


    document.addEventListener(
        "focusout",
        handleFocusOut
    );


    BAZARIA_NAVBAR_STATE
        .keyboardListening =
        true;


    navbarLog(
        "Keyboard behavior initialized"
    );

}


/* =========================================================
   DYNAMIC COMPONENT READY
========================================================= */

/**
 * When main.js successfully loads a component
 * after a retry, make sure navbar state is valid.
 */
function handleComponentReady(
    event
) {

    const componentName =
        event?.detail?.name;


    if (
        componentName !==
        "Top Navbar" &&
        componentName !==
        "Bottom Navbar"
    ) {

        return;

    }


    navbarLog(
        `${componentName} became available`
    );


    /*
     * Re-apply current visibility state.
     */
    if (
        BAZARIA_NAVBAR_STATE
            .isHidden
    ) {

        hideNavbar();

    } else {

        showNavbar();

    }

}


/* =========================================================
   NAVBAR INITIALIZATION
========================================================= */

/**
 * Initialize the navbar behavior.
 *
 * Can safely be called more than once.
 */
function initNavbar() {

    /*
     * The behavior listeners themselves
     * are installed only once.
     */
    initializeScrollBehavior();

    initializeKeyboardBehavior();


    BAZARIA_NAVBAR_STATE
        .initialized =
        true;


    /*
     * Make sure currently injected navbar
     * starts in the correct state.
     */
    if (
        BAZARIA_NAVBAR_STATE
            .isHidden
    ) {

        hideNavbar();

    } else {

        showNavbar();

    }


    navbarLog(
        "Navbar controller initialized"
    );

}


/* =========================================================
   APP READY
========================================================= */

/*
 * IMPORTANT:
 *
 * main.js dispatches this event AFTER
 * global navbar HTML has been loaded.
 *
 * Therefore navbar.js no longer races
 * against dynamically injected HTML.
 */
document.addEventListener(
    "bazaria:ready",
    () => {

        initNavbar();

    }
);


/* =========================================================
   COMPONENT RETRY SUPPORT
========================================================= */

document.addEventListener(
    "bazaria:component-ready",
    handleComponentReady
);


/* =========================================================
   PUBLIC API
========================================================= */

const bazariaNavbarPublicAPI =
    Object.freeze({

        init:
            initNavbar,

        show:
            showNavbar,

        hide:
            hideNavbar,

        getState:
            () => ({

                initialized:
                    BAZARIA_NAVBAR_STATE
                        .initialized,

                isHidden:
                    BAZARIA_NAVBAR_STATE
                        .isHidden,

                keyboardOpen:
                    BAZARIA_NAVBAR_STATE
                        .keyboardOpen,

                lastScrollY:
                    BAZARIA_NAVBAR_STATE
                        .lastScrollY

            })

    });


/* =========================================================
   GLOBAL API
========================================================= */

Object.defineProperty(
    window,
    "BazariaNavbar",
    {

        value:
            bazariaNavbarPublicAPI,

        writable:
            false,

        configurable:
            true,

        enumerable:
            false

    }
);