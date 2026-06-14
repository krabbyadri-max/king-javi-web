module.exports = function (eleventyConfig) {
  // Static assets — copied as-is to dist/
  eleventyConfig.addPassthroughCopy("css");
  // Sólo se sirven main.js y el bundle compilado de anime.js (no la fuente
  // anime-init.js, que usa imports bare y la compila esbuild en `build:js`).
  eleventyConfig.addPassthroughCopy("js/main.js");
  eleventyConfig.addPassthroughCopy("js/anime.bundle.js");
  eleventyConfig.addPassthroughCopy("js/payments.js");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  // The landing page stays a hand-written monolith: copy it verbatim
  // instead of running it through the template engine.
  eleventyConfig.ignores.add("index.html");
  eleventyConfig.addPassthroughCopy("index.html");

  // Human-readable date for posts (es-ES).
  eleventyConfig.addFilter("dateDisplay", function (value) {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  return {
    dir: {
      input: ".",
      output: "dist",
      includes: "_includes",
    },
    // GitHub Pages serves this repo under /king-javi-web/.
    pathPrefix: "/king-javi-web/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
};
