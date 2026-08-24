"use client";

import { useEffect } from "react";

/**
 * Global scroll-reveal driver. Any element carrying [data-reveal] fades in
 * when it enters the viewport. Respects prefers-reduced-motion (elements are
 * simply shown; the CSS transition is also disabled globally).
 */
export default function Reveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = new Set<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
            els.delete(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    const scan = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        if (els.has(el)) return;
        els.add(el);
        if (reduced) {
          el.classList.add("is-in");
        } else {
          io.observe(el);
        }
      });
    };

    scan(document.body);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.hasAttribute("data-reveal")) {
              els.add(n);
              reduced ? n.classList.add("is-in") : io.observe(n);
            }
            scan(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
