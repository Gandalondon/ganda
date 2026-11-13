/* Woden concept page: shared behaviour (from Relay's site.js, without the contour background or logo draw). */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) { window.scrollTo(0, 0); try { document.documentElement.scrollIntoView({ block: "start" }); } catch (e) {} }
/* logo: the W draws along its own line like a GPS trace, then the wordmark wipes in. Once per load; skipped with reduced motion. */
(function () {
  const logo = document.getElementById("logo");
  if (!logo || !logo.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ease = "cubic-bezier(.4,0,.2,1)";
  const t = logo.querySelector(".trace");
  if (t) t.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(.45,0,.25,1)", fill: "backwards" });
  const n = logo.querySelector(".name");
  if (n) n.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 400, delay: 600, easing: ease, fill: "backwards" });
})();
