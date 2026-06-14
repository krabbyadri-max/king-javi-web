# Blog de la Comunidad King Javi

Este directorio contiene los posts del blog en formato Markdown.

## Estructura

- **Ubicación**: `content/comunidad/`
- **Formato de archivo**: `YYYY-MM-DD-slug.md`
  - Ejemplo: `2026-06-14-bienvenida.md`

## Frontmatter YAML (metadatos)

Cada post debe comenzar con un bloque YAML entre `---`:

```yaml
---
title: "Título del post"
date: YYYY-MM-DD
author: "Nombre del autor"
tags: ["tag1", "tag2"]
excerpt: "Resumen breve que aparecerá en listados"
---
```

## Campos obligatorios

- `title`: Título del post
- `date`: Fecha de publicación (YYYY-MM-DD)
- `author`: Nombre del autor
- `tags`: Array de etiquetas
- `excerpt`: Extracto corto (máx. 160 caracteres aprox.)

## Estatus actual

📝 **Posts**: Solo archivos markdown. El renderizado a HTML se implementará en la siguiente fase del desarrollo del blog.

🚫 **No visible en web**: Los posts aquí no se muestran aún en la página. Están listos para ser consumidos por el sistema de blog cuando esté implementado.

## Próximas fases

- [ ] Implementar parser Markdown → HTML
- [ ] Sistema de comentarios con autenticación por email
- [ ] Página de listado de posts
- [ ] Página individual de cada post
- [ ] Navegación por tags
