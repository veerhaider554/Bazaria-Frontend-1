async function loadLayout() {

    try {

        // Load Top Navbar
        const topResponse = await fetch("components/navbar-top.html");
        const topHTML = await topResponse.text();

        document.getElementById("navbar-container").innerHTML = topHTML;

        // Load Bottom Navbar
        const bottomResponse = await fetch("components/navbar-bottom.html");
        const bottomHTML = await bottomResponse.text();

        document.getElementById("bottom-nav-container").innerHTML = bottomHTML;

        // Sab load hone ke baad hi navbar initialize karo
        initNavbar();

    } catch (error) {

        console.error("Layout loading failed:", error);

    }

}

document.addEventListener("DOMContentLoaded", loadLayout);