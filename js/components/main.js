/* =========================================================
   BAZARIA — GLOBAL APP BOOTSTRAP ENGINE V3

   File:
   frontend/js/components/main.js

   RESPONSIBILITY:
   - Global application bootstrap
   - Top navbar loading
   - Bottom navbar loading
   - Cache-first component loading
   - Safe background cache refresh
   - Timeout protection
   - Retry handling
   - Component failure isolation
   - Global navigation state
   - App-ready lifecycle event
   - Basic performance diagnostics

   IMPORTANT:
   This file DOES NOT own:
   - Navbar scroll behavior
   - Search behavior
   - Product loading
   - Product rendering
   - Category logic

   Those systems remain separate.
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BAZARIA_MAIN_CONFIG = Object.freeze({

    version:
        "3.0.0",

    request: Object.freeze({

        timeout:
            7000,

        retries:
            1

    }),

    cache: Object.freeze({

        enabled:
            true,

        backgroundRefresh:
            true

    }),

    debug:
        true,

    components: Object.freeze({

        topNavbar: Object.freeze({

            name:
                "Top Navbar",

            containerId:
                "navbar-container",

            path:
                "./components/Navbar-top.html",

            cacheKey:
                "bazaria_topnav_v30"

        }),

        bottomNavbar: Object.freeze({

            name:
                "Bottom Navbar",

            containerId:
                "bottom-nav-container",

            path:
                "./components/Navbar-bottom.html",

            cacheKey:
                "bazaria_bottomnav_v30"

        })

    })

});


/* =========================================================
   RUNTIME STATE
========================================================= */

const BAZARIA_MAIN_STATE = {

    bootStarted:
        false,

    bootCompleted:
        false,

    topNavbarLoaded:
        false,

    bottomNavbarLoaded:
        false,

    topNavbarFailed:
        false,

    bottomNavbarFailed:
        false,

    startTime:
        0,

    readyTime:
        0,

    frontendRoot:
        "",

    initializedContainers:
        new WeakSet(),

    componentPromises:
        new Map()

};


/* =========================================================
   LOGGING
========================================================= */

function bazariaLog(
    ...args
) {

    if (
        !BAZARIA_MAIN_CONFIG.debug
    ) {

        return;

    }


    console.log(
        "[Bazaria Main]",
        ...args
    );

}


function bazariaWarn(
    ...args
) {

    if (
        !BAZARIA_MAIN_CONFIG.debug
    ) {

        return;

    }


    console.warn(
        "[Bazaria Main]",
        ...args
    );

}


function bazariaError(
    ...args
) {

    console.error(
        "[Bazaria Main]",
        ...args
    );

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function mainSafeString(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;

    }


    const result =
        String(
            value
        ).trim();


    return result ||
        fallback;

}


function wait(
    milliseconds
) {

    return new Promise(
        resolve => {

            window.setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =========================================================
   FRONTEND ROOT DETECTION
========================================================= */

/*
 * IMPORTANT:
 *
 * fetch() resolves relative URLs against the
 * current document URL, not the JS file location.
 *
 * Because main.js lives at:
 *
 * frontend/js/components/main.js
 *
 * we derive the frontend root from main.js itself.
 *
 * This allows:
 *
 * components/navbar-top.html
 *
 * to work consistently even when the current
 * page lives in another frontend subdirectory.
 */

function detectFrontendRoot() {

    const currentScript =
        document.currentScript;


    if (
        currentScript &&
        currentScript.src
    ) {

        try {

            const scriptUrl =
                new URL(
                    currentScript.src,
                    document.baseURI
                );


            return new URL(
                "../../..",
                scriptUrl
            );

        } catch (error) {

            bazariaWarn(
                "Unable to resolve frontend root from main.js:",
                error
            );

        }

    }


    /*
     * Fallback.
     *
     * This should only be reached in unusual
     * execution environments.
     */

    try {

        return new URL(
            "./",
            document.baseURI
        );

    } catch {

        return null;

    }

}


/* =========================================================
   COMPONENT URL RESOLVER
========================================================= */

function resolveComponentUrl(
    relativePath
) {

    const frontendRoot =
        detectFrontendRoot();


    if (
        !frontendRoot
    ) {

        throw new Error(
            "Bazaria frontend root could not be resolved."
        );

    }


    return new URL(
        relativePath,
        frontendRoot
    ).href;

}


/* =========================================================
   STORAGE
========================================================= */

function getCachedComponent(
    cacheKey
) {

    if (
        !BAZARIA_MAIN_CONFIG.cache.enabled
    ) {

        return null;

    }


    try {

        return sessionStorage.getItem(
            cacheKey
        );

    } catch (error) {

        bazariaWarn(
            "Cache read failed:",
            error
        );

        return null;

    }

}


function setCachedComponent(
    cacheKey,
    html
) {

    if (
        !BAZARIA_MAIN_CONFIG.cache.enabled
    ) {

        return;

    }


    if (
        typeof html !== "string" ||
        !html.trim()
    ) {

        return;

    }


    try {

        sessionStorage.setItem(
            cacheKey,
            html
        );

    } catch (error) {

        bazariaWarn(
            "Cache write failed:",
            error
        );

    }

}


function clearComponentCache(
    cacheKey
) {

    try {

        sessionStorage.removeItem(
            cacheKey
        );

    } catch (error) {

        bazariaWarn(
            "Cache clear failed:",
            error
        );

    }

}


/* =========================================================
   GLOBAL SKELETON STYLES
========================================================= */

function injectSkeletonStyles() {

    if (
        document.getElementById(
            "bazaria-main-skeleton-style"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "bazaria-main-skeleton-style";


    style.textContent = `

        .bazaria-component-skeleton {

            width: 100%;
            min-height: 52px;

            position: relative;
            overflow: hidden;

            border-radius: 14px;

            background:
                rgba(255, 255, 255, 0.045);

            border:
                1px solid
                rgba(255, 255, 255, 0.06);

        }


        .bazaria-component-skeleton::after {

            content: "";

            position: absolute;

            inset: 0;

            transform:
                translateX(-100%);

            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,0.08),
                    transparent
                );

            animation:
                bazariaMainShimmer
                1.4s infinite;

        }


        @keyframes bazariaMainShimmer {

            100% {

                transform:
                    translateX(100%);

            }

        }


        .bazaria-component-error {

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 10px;

            min-height: 52px;

            padding: 12px 16px;

            border-radius: 14px;

            background:
                rgba(255,77,77,0.06);

            border:
                1px solid
                rgba(255,77,77,0.16);

        }


        .bazaria-component-retry {

            border: 0;

            border-radius: 8px;

            padding: 7px 12px;

            cursor: pointer;

            background:
                rgba(255,255,255,0.08);

            color: inherit;

        }


        .bazaria-component-retry:disabled {

            opacity: 0.6;

            cursor: wait;

        }


        body.bazaria-app-ready {

            --bazaria-app-ready: 1;

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   COMPONENT LOADING UI
========================================================= */

function showComponentSkeleton(
    container
) {

    if (
        !container
    ) {

        return;

    }


    const skeleton =
        document.createElement(
            "div"
        );


    skeleton.className =
        "bazaria-component-skeleton";


    skeleton.setAttribute(
        "aria-hidden",
        "true"
    );


    container.replaceChildren(
        skeleton
    );

}


/* =========================================================
   COMPONENT ERROR UI
========================================================= */

function showComponentError(
    container,
    componentName,
    retryHandler
) {

    if (
        !container
    ) {

        return;

    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "bazaria-component-error";


    const message =
        document.createElement(
            "span"
        );


    message.textContent =
        `${componentName} unavailable`;


    const retryButton =
        document.createElement(
            "button"
        );


    retryButton.type =
        "button";


    retryButton.className =
        "bazaria-component-retry";


    retryButton.textContent =
        "Retry";


    retryButton.addEventListener(
        "click",
        async () => {

            retryButton.disabled =
                true;

            retryButton.textContent =
                "Retrying...";


            try {

                await retryHandler();

            } catch (error) {

                bazariaError(
                    `${componentName}: retry failed`,
                    error
                );

            } finally {

                retryButton.disabled =
                    false;

                retryButton.textContent =
                    "Retry";

            }

        }
    );


    wrapper.append(
        message,
        retryButton
    );


    container.replaceChildren(
        wrapper
    );

}


/* =========================================================
   FETCH WITH TIMEOUT
========================================================= */

async function fetchWithTimeout(
    filePath,
    timeout =
        BAZARIA_MAIN_CONFIG.request.timeout
) {

    const controller =
        new AbortController();


    const timeoutId =
        window.setTimeout(
            () => {

                controller.abort();

            },
            Math.max(
                1000,
                Number(timeout) || 7000
            )
        );


    try {

        const response =
            await fetch(
                filePath,
                {

                    method:
                        "GET",

                    cache:
                        "no-cache",

                    signal:
                        controller.signal

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const html =
            await response.text();


        if (
            !html.trim()
        ) {

            throw new Error(
                "Component returned empty HTML"
            );

        }


        return html;

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                `Component request timeout after ${timeout}ms`
            );

        }


        throw error;

    } finally {

        window.clearTimeout(
            timeoutId
        );

    }

}


/* =========================================================
   FETCH COMPONENT — SINGLE ATTEMPT
========================================================= */

async function fetchComponentOnce(
    config
) {

    try {

        const url =
            resolveComponentUrl(
                config.path
            );


        bazariaLog(
            `${config.name}: request`,
            url
        );


        const html =
            await fetchWithTimeout(
                url
            );


        /*
         * Update cache after successful
         * network response.
         */
        setCachedComponent(
            config.cacheKey,
            html
        );


        return {

            success:
                true,

            html,

            error:
                null

        };

    } catch (error) {

        return {

            success:
                false,

            html:
                null,

            error

        };

    }

}


/* =========================================================
   FETCH COMPONENT — WITH RETRIES
========================================================= */

async function fetchComponent(
    config,
    retries =
        BAZARIA_MAIN_CONFIG.request.retries
) {

    let lastError =
        null;


    const retryCount =
        Number.isFinite(
            Number(retries)
        )
            ? Math.max(
                0,
                Number(retries)
            )
            : 0;


    for (
        let attempt = 0;
        attempt <= retryCount;
        attempt++
    ) {

        const result =
            await fetchComponentOnce(
                config
            );


        if (
            result.success
        ) {

            bazariaLog(
                `${config.name}: request succeeded`
            );


            return result;

        }


        lastError =
            result.error;


        bazariaWarn(
            `${config.name}: attempt ${attempt + 1} failed`,
            result.error
        );


        if (
            attempt < retryCount
        ) {

            await wait(
                350
            );

        }

    }


    return {

        success:
            false,

        html:
            null,

        error:
            lastError

    };

}


/* =========================================================
   BACKGROUND CACHE REFRESH
========================================================= */

/*
 * IMPORTANT:
 *
 * Background refresh updates the cache ONLY.
 *
 * It does NOT replace visible navbar HTML.
 *
 * This prevents:
 *
 * fresh HTML
 *      ↓
 * replaceChildren/innerHTML
 *      ↓
 * event listeners disappear
 *
 * The current visible component remains stable.
 */

async function refreshComponentInBackground(
    config
) {

    if (
        !BAZARIA_MAIN_CONFIG.cache
            .backgroundRefresh
    ) {

        return;

    }


    try {

        const result =
            await fetchComponentOnce(
                config
            );


        if (
            !result.success
        ) {

            bazariaWarn(
                `${config.name}: background refresh failed`,
                result.error
            );


            return;

        }


        bazariaLog(
            `${config.name}: background cache refreshed`
        );

    } catch (error) {

        bazariaWarn(
            `${config.name}: background refresh failed`,
            error
        );

    }

}


/* =========================================================
   LOAD ONE GLOBAL COMPONENT
========================================================= */

async function loadGlobalComponent(
    config,
    stateKeyLoaded,
    stateKeyFailed
) {

    const container =
        document.getElementById(
            config.containerId
        );


    /*
     * Page does not have this global component.
     *
     * That is NOT an error.
     */
    if (
        !container
    ) {

        bazariaLog(
            `${config.name}: container not present, skipped`
        );


        BAZARIA_MAIN_STATE[
            stateKeyLoaded
        ] =
            false;


        BAZARIA_MAIN_STATE[
            stateKeyFailed
        ] =
            false;


        return {

            success:
                true,

            skipped:
                true

        };

    }


    /* =====================================================
       CACHE FIRST
    ===================================================== */

    const cachedHTML =
        getCachedComponent(
            config.cacheKey
        );


    if (
        cachedHTML
    ) {

        container.innerHTML =
            cachedHTML;


        BAZARIA_MAIN_STATE[
            stateKeyLoaded
        ] =
            true;


        BAZARIA_MAIN_STATE[
            stateKeyFailed
        ] =
            false;


        bazariaLog(
            `${config.name}: rendered from cache`
        );


        /*
         * Refresh cache silently.
         * Visible DOM stays untouched.
         */
        void refreshComponentInBackground(
            config
        );


        return {

            success:
                true,

            fromCache:
                true

        };

    }


    /* =====================================================
       NO CACHE → SKELETON
    ===================================================== */

    showComponentSkeleton(
        container
    );


    /* =====================================================
       DUPLICATE REQUEST PROTECTION
    ===================================================== */

    const existingPromise =
        BAZARIA_MAIN_STATE
            .componentPromises
            .get(
                config.containerId
            );


    if (
        existingPromise
    ) {

        return existingPromise;

    }


    const promise =
        fetchComponent(
            config
        );


    BAZARIA_MAIN_STATE
        .componentPromises
        .set(
            config.containerId,
            promise
        );


    try {

        const result =
            await promise;


        if (
            result.success &&
            result.html
        ) {

            container.innerHTML =
                result.html;


            BAZARIA_MAIN_STATE[
                stateKeyLoaded
            ] =
                true;


            BAZARIA_MAIN_STATE[
                stateKeyFailed
            ] =
                false;


            bazariaLog(
                `${config.name}: rendered`
            );


            return {

                success:
                    true,

                fromCache:
                    false

            };

        }


        BAZARIA_MAIN_STATE[
            stateKeyFailed
        ] =
            true;


        /*
         * Retry action from visible error UI.
         */
        async function retryComponent() {

            const retryResult =
                await fetchComponentOnce(
                    config
                );


            if (
                retryResult.success &&
                retryResult.html
            ) {

                container.innerHTML =
                    retryResult.html;


                BAZARIA_MAIN_STATE[
                    stateKeyLoaded
                ] =
                    true;


                BAZARIA_MAIN_STATE[
                    stateKeyFailed
                ] =
                    false;


                /*
                 * Notify other systems that
                 * the component became available.
                 */
                document.dispatchEvent(
                    new CustomEvent(
                        "bazaria:component-ready",
                        {
                            detail: {

                                name:
                                    config.name,

                                containerId:
                                    config.containerId

                            }

                        }
                    )
                );


                return true;

            }


            showComponentError(
                container,
                config.name,
                retryComponent
            );


            return false;

        }


        showComponentError(
            container,
            config.name,
            retryComponent
        );


        return {

            success:
                false,

            error:
                result.error

        };

    } finally {

        BAZARIA_MAIN_STATE
            .componentPromises
            .delete(
                config.containerId
            );

    }

}


/* =========================================================
   LOAD ALL GLOBAL COMPONENTS
========================================================= */

async function loadGlobalComponents() {

    const startedAt =
        performance.now();


    const results =
        await Promise.allSettled([

            loadGlobalComponent(

                BAZARIA_MAIN_CONFIG
                    .components
                    .topNavbar,

                "topNavbarLoaded",

                "topNavbarFailed"

            ),

            loadGlobalComponent(

                BAZARIA_MAIN_CONFIG
                    .components
                    .bottomNavbar,

                "bottomNavbarLoaded",

                "bottomNavbarFailed"

            )

        ]);


    const duration =
        Math.round(
            performance.now() -
            startedAt
        );


    bazariaLog(
        `Global components settled in ${duration}ms`,
        results
    );


    return results;

}


/* =========================================================
   CURRENT PAGE
========================================================= */

function getCurrentPageName() {

    const filename =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        !filename ||
        filename === "index.html"
    ) {

        return "index.html";

    }


    return filename;

}


/* =========================================================
   NAVIGATION TARGET
========================================================= */

function getNavigationTarget(
    element
) {

    const href =
        element.getAttribute(
            "href"
        );


    if (
        href
    ) {

        try {

            const url =
                new URL(
                    href,
                    window.location.href
                );


            return url.pathname
                .split("/")
                .pop()
                .toLowerCase();

        } catch {

            /* Continue with data-page */

        }

    }


    return mainSafeString(
        element.dataset.page
    )
        .replace(
            /\.html$/,
            ""
        )
        .toLowerCase();

}


/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function initializeNavigationState() {

    const currentPage =
        getCurrentPageName();


    const normalizedCurrent =
        currentPage.replace(
            /\.html$/,
            ""
        );


    const isHome =
        currentPage ===
        "index.html";


    const navItems =
        document.querySelectorAll(
            ".bottom-item, .nav-item, [data-page]"
        );


    navItems.forEach(
        item => {

            const target =
                getNavigationTarget(
                    item
                );


            const isActive =
                target ===
                (
                    isHome
                        ? "index"
                        : normalizedCurrent
                )
                ||
                (
                    isHome &&
                    target === "home"
                );


            item.classList.toggle(
                "active-bottom",
                isActive
            );


            item.classList.toggle(
                "active",
                isActive
            );


            if (
                isActive
            ) {

                item.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                item.removeAttribute(
                    "aria-current"
                );

            }

        }
    );

}


/* =========================================================
   GLOBAL UI
========================================================= */

function initializeGlobalUI() {

    initializeNavigationState();

}


/* =========================================================
   APP READY EVENT
========================================================= */

function dispatchAppReady() {

    const duration =
        Math.round(
            BAZARIA_MAIN_STATE.readyTime -
            BAZARIA_MAIN_STATE.startTime
        );


    document.dispatchEvent(
        new CustomEvent(
            "bazaria:ready",
            {
                detail: {

                    version:
                        BAZARIA_MAIN_CONFIG.version,

                    duration,

                    topNavbarLoaded:
                        BAZARIA_MAIN_STATE
                            .topNavbarLoaded,

                    bottomNavbarLoaded:
                        BAZARIA_MAIN_STATE
                            .bottomNavbarLoaded,

                    topNavbarFailed:
                        BAZARIA_MAIN_STATE
                            .topNavbarFailed,

                    bottomNavbarFailed:
                        BAZARIA_MAIN_STATE
                            .bottomNavbarFailed

                }

            }
        )
    );


    bazariaLog(
        "Application ready",
        {

            version:
                BAZARIA_MAIN_CONFIG.version,

            duration,

            topNavbarLoaded:
                BAZARIA_MAIN_STATE
                    .topNavbarLoaded,

            bottomNavbarLoaded:
                BAZARIA_MAIN_STATE
                    .bottomNavbarLoaded

        }
    );

}


/* =========================================================
   BOOTSTRAP
========================================================= */

async function bootstrapBazaria() {

    /*
     * Duplicate protection.
     */
    if (
        BAZARIA_MAIN_STATE
            .bootStarted
    ) {

        bazariaWarn(
            "Bootstrap already started."
        );


        return;

    }


    BAZARIA_MAIN_STATE
        .bootStarted =
        true;


    BAZARIA_MAIN_STATE
        .startTime =
        performance.now();


    bazariaLog(
        `Bazaria Main Engine V${BAZARIA_MAIN_CONFIG.version} starting`
    );


    injectSkeletonStyles();


    try {

        /*
         * Global components are loaded
         * independently from page systems.
         */
        await loadGlobalComponents();


        /*
         * Global navigation state only.
         */
        initializeGlobalUI();


    } catch (error) {

        /*
         * Last-resort protection.
         *
         * Page systems should still receive
         * bazaria:ready.
         */
        bazariaError(
            "Unexpected bootstrap failure:",
            error
        );

    } finally {

        BAZARIA_MAIN_STATE
            .bootCompleted =
            true;


        BAZARIA_MAIN_STATE
            .readyTime =
            performance.now();


        document.body.classList.add(
            "bazaria-app-ready"
        );


        document.documentElement.dataset
            .bazariaReady =
            "true";


        dispatchAppReady();

    }

}


/* =========================================================
   START ENGINE
========================================================= */

function startBazariaMain() {

    /*
     * Use DOMContentLoaded only for the
     * initial bootstrap.
     *
     * Page-specific systems should use:
     *
     * bazaria:ready
     *
     * instead of trying to guess when
     * dynamically-loaded components exist.
     */
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bootstrapBazaria,
            {
                once:
                    true
            }
        );


        return;

    }


    void bootstrapBazaria();

}


/* =========================================================
   PUBLIC API
========================================================= */

const bazariaMainPublicAPI =
    Object.freeze({

        version:
            BAZARIA_MAIN_CONFIG.version,

        config:
            BAZARIA_MAIN_CONFIG,

        state:
            BAZARIA_MAIN_STATE,

        bootstrap:
            bootstrapBazaria,

        loadGlobalComponents,

        initializeGlobalUI,

        initializeNavigationState,

        showComponentSkeleton,

        showComponentError,

        clearComponentCache,

        resolveComponentUrl

    });


/* =========================================================
   GLOBAL PUBLIC OBJECT
========================================================= */

Object.defineProperty(
    window,
    "BazariaMain",
    {

        value:
            bazariaMainPublicAPI,

        writable:
            false,

        configurable:
            true,

        enumerable:
            false

    }
);


/* =========================================================
   START
========================================================= */

startBazariaMain();
