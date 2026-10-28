import logo from "./assets/hero-logo.webp";

/** Artwork shown in place of the text title on the home page while Diwali is active. */
export const heroArt = {
  src: logo,
  alt: "SIC — Science & Innovation Club, GEC Palamu, decorated for Diwali with diyas",
  /** The artwork already shows "Science & Innovation Club / GEC Palamu", so the page hides its own subtitle. */
  includesTitleText: true,
};
