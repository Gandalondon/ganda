/* Woden concept page: shared behaviour (from Relay's site.js, without the contour background; the logo is static). */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) { window.scrollTo(0, 0); try { document.documentElement.scrollIntoView({ block: "start" }); } catch (e) {} }
