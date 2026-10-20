/* =========================================================
   BAZARIA — API CLIENT V3
   Centralized Backend Communication

   File:
   frontend/js/utils/api.js

   Architecture:

   UI
    ↓
   page engine
    ↓
   API client
    ↓
   Express
    ↓
   Controller
    ↓
   MongoDB
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const BAZARIA_API_CONFIG = Object.freeze({

    baseUrl:
        "http://localhost:5000/api",

    timeout:
        8000,

    defaultProductLimit:
        20,

    maxProductLimit:
        50

});


/* =========================================================
   API ERROR
========================================================= */

/**
 * Standard API error.
 *
 * Keeps frontend error handling predictable.
 */
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

/**
 * Safely build API URL.
 */
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

/**
 * Build URL query string.
 *
 * Undefined / null / empty values
 * are automatically ignored.
 */
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

/**
 * Safely parse API response.
 *
 * Backend normally returns JSON,
 * but this also protects against
 * unexpected HTML/text responses.
 */
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


    /*
     * Fallback for non-JSON response.
     */
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

/**
 * Central API request engine.
 *
 * Supports:
 * - timeout
 * - external AbortSignal
 * - JSON body
 * - custom headers
 * - normalized errors
 */
async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        buildBazariaAPIUrl(
            endpoint
        );


    /*
     * Separate internal options
     * from fetch options.
     */
    const {

        timeout =
            BAZARIA_API_CONFIG.timeout,

        signal: externalSignal,

        ...fetchOptions

    } = options;


    /*
     * Internal timeout controller.
     */
    const timeoutController =
        new AbortController();


    let timeoutId =
        null;


    /*
     * Combined abort controller.
     *
     * External caller can cancel the request.
     * Internal controller handles timeout.
     */
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


    /*
     * Internal timeout.
     */
    timeoutId =
        window.setTimeout(
            () => {

                timeoutController.abort();

                requestController.abort();

            },
            Math.max(
                1000,
                Number(timeout) || 8000
            )
        );


    try {

        const headers = {

            Accept:
                "application/json",

            ...(fetchOptions.headers || {})

        };


        /*
         * Automatically set JSON content type
         * only when the body is actually JSON.
         *
         * FormData must remain untouched.
         */
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


        /*
         * HTTP error.
         */
        if (
            !response.ok
        ) {

            const message =
                data?.message ||
                `API request failed with status ${response.status}`;


            throw new BazariaAPIError(
                message,
                {

                    status:
                        response.status,

                    data

                }
            );

        }


        return data;

    } catch (error) {

        /*
         * External abort.
         */
        if (
            externalSignal?.aborted
        ) {

            throw new BazariaAPIError(
                "API request was cancelled.",
                {

                    isAbort:
                        true

                }
            );

        }


        /*
         * Timeout.
         */
        if (
            error?.name === "AbortError"
        ) {

            throw new BazariaAPIError(
                "API request timed out.",
                {

                    isTimeout:
                        true

                }
            );

        }


        /*
         * Already normalized API error.
         */
        if (
            error instanceof BazariaAPIError
        ) {

            throw error;

        }


        /*
         * Network / unknown error.
         */
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

/**
 * Fetch paginated products.
 *
 * Backend supports:
 *
 * page
 * limit
 * search
 * category
 * subCategory
 * status
 */
async function fetchBazariaProducts(
    options = {}
) {

    let page =
        Number.parseInt(
            options.page,
            10
        );


    let limit =
        Number.parseInt(
            options.limit,
            10
        );


    /*
     * Safe defaults.
     */
    if (
        !Number.isFinite(page) ||
        page < 1
    ) {

        page = 1;

    }


    if (
        !Number.isFinite(limit) ||
        limit < 1
    ) {

        limit =
            BAZARIA_API_CONFIG
                .defaultProductLimit;

    }


    /*
     * Never allow frontend to request
     * an unnecessarily huge page.
     */
    limit =
        Math.min(
            limit,
            BAZARIA_API_CONFIG
                .maxProductLimit
        );


    const query =
        buildBazariaQuery({

            page,

            limit,

            search:
                options.search,

            category:
                options.category,

            subCategory:
                options.subCategory,

            status:
                options.status

        });


    return apiRequest(
        `/products${query}`,
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
   GET SINGLE PRODUCT
========================================================= */

/**
 * Fetch one product by MongoDB ObjectId.
 */
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