/* =========================================================
   BAZARIA — API CLIENT V3 (WITH LIVE DEBUG SYSTEM)
   Centralized Backend Communication

   File:
   frontend/js/utils/api.js
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BAZARIA_API_CONFIG = Object.freeze({

    baseUrl:
        "https://joy-frail-cow.abasthan.app/api",

    timeout:
        12000, // Timeout slightly increased for initial backend spin-up

    defaultProductLimit:
        20,

    maxProductLimit:
        50

});


/* =========================================================
   API ERROR & DEBUG HELPER
========================================================= */

/**
 * Show a clear debug alert on screen if API fails.
 */
function showBazariaApiAlert(message, title = "Bazaria API Notice") {
    console.error(`[${title}]:`, message);
    if (typeof window !== "undefined") {
        setTimeout(() => {
            alert(`⚠️ ${title}\n\n${message}`);
        }, 100);
    }
}

class BazariaAPIError extends Error {

    constructor(
        message,
        details = {}
    ) {

        super(
            message
        );

        this.name =
            "BazariaAPIError";

        this.status =
            details.status ?? null;

        this.data =
            details.data ?? null;

        this.code =
            details.code ?? null;

        this.isTimeout =
            details.isTimeout === true;

        this.isAbort =
            details.isAbort === true;

    }

}


/* =========================================================
   URL BUILDER
========================================================= */

function buildBazariaAPIUrl(
    endpoint
) {

    const cleanEndpoint =
        String(
            endpoint || ""
        ).trim();

    if (
        !cleanEndpoint
    ) {

        throw new BazariaAPIError(
            "API endpoint is required."
        );

    }

    return (
        BAZARIA_API_CONFIG.baseUrl.replace(
            /\/$/,
            ""
        ) +
        (
            cleanEndpoint.startsWith("/")
                ? cleanEndpoint
                : `/${cleanEndpoint}`
        )
    );

}


/* =========================================================
   QUERY BUILDER
========================================================= */

function buildBazariaQuery(
    params = {}
) {

    const searchParams =
        new URLSearchParams();

    Object.entries(
        params
    ).forEach(
        (
            [key, value]
        ) => {

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {

                return;

            }

            searchParams.set(
                key,
                String(value)
            );

        }
    );

    const query =
        searchParams.toString();

    return query
        ? `?${query}`
        : "";

}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseBazariaResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        } catch {

            return null;

        }

    }

    try {

        const text =
            await response.text();

        return text
            ? {
                raw: text
            }
            : null;

    } catch {

        return null;

    }

}


/* =========================================================
   CORE API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        buildBazariaAPIUrl(
            endpoint
        );

    const {

        timeout =
            BAZARIA_API_CONFIG.timeout,

        signal: externalSignal,

        ...fetchOptions

    } = options;

    const timeoutController =
        new AbortController();

    let timeoutId = null;

    const requestController =
        new AbortController();

    const abortFromExternal =
        () => {

            requestController.abort();

        };

    if (
        externalSignal
    ) {

        if (
            externalSignal.aborted
        ) {

            requestController.abort();

        } else {

            externalSignal.addEventListener(
                "abort",
                abortFromExternal,
                {
                    once: true
                }
            );

        }

    }

    timeoutId =
        window.setTimeout(
            () => {

                timeoutController.abort();

                requestController.abort();

            },
            Math.max(
                1000,
                Number(timeout) || 12000
            )
        );

    try {

        const headers = {

            Accept:
                "application/json",

            ...(fetchOptions.headers || {})

        };

        let body =
            fetchOptions.body;

        const isFormData =
            body instanceof FormData;

        const isPlainObject =
            body &&
            typeof body === "object" &&
            !isFormData &&
            !(body instanceof Blob) &&
            !(body instanceof URLSearchParams);

        if (
            isPlainObject
        ) {

            headers[
                "Content-Type"
            ] =
                "application/json";

            body =
                JSON.stringify(
                    body
                );

        }

        const response =
            await fetch(
                url,
                {

                    ...fetchOptions,

                    headers,

                    body,

                    signal:
                        requestController.signal

                }
            );

        const data =
            await parseBazariaResponse(
                response
            );

        if (
            !response.ok
        ) {

            const message =
                data?.message ||
                `API failed with status code ${response.status}`;

            showBazariaApiAlert(message, `HTTP Error ${response.status}`);

            throw new BazariaAPIError(
                message,
                {
                    status: response.status,
                    data
                }
            );

        }

        return data;

    } catch (error) {

        if (
            externalSignal?.aborted
        ) {

            throw new BazariaAPIError(
                "API request was cancelled.",
                { isAbort: true }
            );

        }

        if (
            error?.name === "AbortError"
        ) {

            const timeoutMsg = "Backend server response timed out. Please refresh.";
            showBazariaApiAlert(timeoutMsg, "Timeout Error");

            throw new BazariaAPIError(
                timeoutMsg,
                { isTimeout: true }
            );

        }

        if (
            error instanceof BazariaAPIError
        ) {

            throw error;

        }

        const netMsg = `Failed to connect to backend URL:\n${url}\n\nPossible Causes:\n1. CORS blocked on Backend.\n2. Server sleeping/down.`;
        showBazariaApiAlert(netMsg, "Network/CORS Error");

        throw new BazariaAPIError(
            error?.message ||
            "Unable to connect to Bazaria API.",
            {

                code:
                    "NETWORK_ERROR",

                data:
                    error

            }
        );

    } finally {

        if (
            timeoutId !== null
        ) {

            window.clearTimeout(
                timeoutId
            );

        }

        if (
            externalSignal
        ) {

            externalSignal.removeEventListener(
                "abort",
                abortFromExternal
            );

        }

    }

}


/* =========================================================
   GET ALL PRODUCTS
========================================================= */

async function fetchBazariaProducts(
    options = {}
) {

    let page = Number.parseInt(options.page, 10);
    let limit = Number.parseInt(options.limit, 10);

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = BAZARIA_API_CONFIG.defaultProductLimit;

    limit = Math.min(limit, BAZARIA_API_CONFIG.maxProductLimit);

    const query = buildBazariaQuery({
        page,
        limit,
        search: options.search,
        category: options.category,
        subCategory: options.subCategory,
        status: options.status
    });

    try {
        const response = await apiRequest(
            `/products${query}`,
            {
                method: "GET",
                signal: options.signal,
                timeout: options.timeout
            }
        );

        let productsList = [];

        if (Array.isArray(response)) {
            productsList = response;
        } else if (response && Array.isArray(response.products)) {
            productsList = response.products;
        } else if (response && response.data && Array.isArray(response.data)) {
            productsList = response.data;
        }

        if (!productsList || productsList.length === 0) {
            console.warn("Bazaria API connected successfully, but returned 0 products.");
        }

        return productsList;
    } catch (err) {
        console.error("fetchBazariaProducts failed:", err);
        return [];
    }
}


/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

async function fetchBazariaProduct(
    productId,
    options = {}
) {

    const id =
        String(
            productId || ""
        ).trim();

    if (!id) {

        throw new BazariaAPIError(
            "Product ID is required."
        );

    }

    return apiRequest(
        `/products/${encodeURIComponent(id)}`,
        {

            method:
                "GET",

            signal:
                options.signal,

            timeout:
                options.timeout

        }
    );

}


/* =========================================================
   API HEALTH CHECK
========================================================= */

async function checkBazariaAPI(
    options = {}
) {

    return apiRequest(
        "/health",
        {

            method:
                "GET",

            signal:
                options.signal,

            timeout:
                options.timeout

        }
    );

}


/* =========================================================
   PUBLIC API
========================================================= */

window.BazariaAPI =
    Object.freeze({

        request:
            apiRequest,

        getProducts:
            fetchBazariaProducts,

        getProduct:
            fetchBazariaProduct,

        health:
            checkBazariaAPI,

        buildQuery:
            buildBazariaQuery

    });
