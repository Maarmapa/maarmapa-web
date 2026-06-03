# Remediación de cartas/fichas rotas — boykot.cl (WooCommerce)

Auditoría de solo lectura del catálogo público de **boykot.cl** (3.460 productos visibles)
y herramienta para aplicar los arreglos vía la **API REST de WooCommerce** desde una sesión
que **sí tenga credenciales Read/Write**.

> ⚠️ Esta carpeta es un **toolkit de operaciones**; no toca el código del sitio Next.js.

## Qué se detectó (escaneo del 2026-06-03)

| Defecto | Cantidad | Archivo | Es realmente un defecto |
|---|---|---|---|
| 🔴 **Cartas rotas** (producto *variable* con TODAS las variantes agotadas → la carta de color no muestra nada comprable) | **33** | [`data/cartas_rotas.csv`](data/cartas_rotas.csv) | Sí (UX rota) |
| 🟣 **Sin categoría** (atrapados en `Uncategorized`, id 15 → URL `/tienda/uncategorized/...`, breadcrumb y SEO rotos) | **204** | [`data/sin_categoria.csv`](data/sin_categoria.csv) | Sí |
| 🟠 Simples agotados | 577 | [`data/simples_agotados.csv`](data/simples_agotados.csv) | Probablemente NO — muchos solo están sin stock (inventario real). Revisar antes de tocar. |

Referencia: [`data/categories.csv`](data/categories.csv) — las 190 categorías reales (id, nombre, slug, parent) para mapear.

Casos de ejemplo que originaron la auditoría:
- `52385` Molotow Metallic 400ml → carta rota (Gold/Silver agotados). *Nota: esa línea SOLO tiene 2 colores; no faltan colores, es restock.*
- `61661` Pluma Drawing Pen Copic → sin categoría (cuelga de Uncategorized).

## Requisitos

- Node ≥ 18 (usa `fetch` nativo, sin dependencias).
- Credenciales WooCommerce **Read/Write**: WooCommerce → Ajustes → Avanzado → API REST.

```bash
export WC_STORE_URL="https://www.boykot.cl"
export WC_CONSUMER_KEY="ck_xxx"
export WC_CONSUMER_SECRET="cs_xxx"
```

> Nunca pongas las credenciales en archivos del repo. Solo en el entorno.

## Flujo de trabajo

Todo corre en **DRY-RUN por defecto** (no modifica nada). Agrega `--apply` para escribir.

### 1) Sin categoría (204)
Edita `fixes_categories.csv` (plantilla: `fixes_categories.example.csv`) asignando a cada `id`
las `category_ids` correctas (de `data/categories.csv`, separadas por `|`).
Hay un primer borrador sugerido en `data/suggested_categories.csv` — **revísalo, no lo apliques a ciegas.**

```bash
node remediate.mjs apply-categories fixes_categories.csv          # dry-run
node remediate.mjs apply-categories fixes_categories.csv --apply  # aplica
```

### 2) Cartas rotas / restock de variantes (33)
Primero lista las variaciones de cada producto variable para obtener sus IDs:

```bash
node remediate.mjs list-variations 52385
```

Luego llena `fixes_variation_stock.csv` (plantilla incluida) y aplica:

```bash
node remediate.mjs apply-variation-stock fixes_variation_stock.csv --apply
```

> Solo marca `instock` lo que de verdad tengas en bodega. No inventes stock.

### 3) Stock de productos simples (opcional)
```bash
node remediate.mjs apply-stock fixes_stock.csv --apply
```

## Seguridad / garantías

- Credenciales solo por env; el repo nunca las contiene.
- Dry-run por defecto; cada cambio se imprime como `antes -> después`.
- Pausa de 250 ms entre escrituras para no saturar el servidor.
- Reversible: cada cambio es un campo editable en WooCommerce.

## Cómo se generó la auditoría

Escaneo de solo lectura contra la **Store API pública** (`/wp-json/wc/store/v1/products`),
sin autenticación, paginando los 3.460 productos visibles. Los productos **ocultos**
(visibility = hidden) NO aparecen en este escaneo — para incluirlos se necesita la API
autenticada (`wc/v3`).
