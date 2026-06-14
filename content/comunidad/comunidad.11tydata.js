// Datos de directorio: se aplican a todos los .md de content/comunidad/.
module.exports = {
  tags: ["posts"],
  layout: "layouts/post.njk",
  ogType: "article",
  // Slug = nombre de archivo completo (incluye la fecha), p.ej.
  // 2026-06-14-bienvenida.md -> /comunidad/2026-06-14-bienvenida/index.html
  // (page.fileSlug eliminaría el prefijo de fecha; usamos filePathStem).
  permalink: (data) => {
    const slug = data.page.inputPath
      .split("/")
      .pop()
      .replace(/\.md$/, "");
    return `/comunidad/${slug}/index.html`;
  },
};
