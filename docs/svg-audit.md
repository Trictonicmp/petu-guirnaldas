# Auditoria de SVG

## Inventario

Los 41 SVG estan en `src/public/assets/`: 21 archivos `semi-circulo-*` y 20 archivos `tradicional-*`. La lista coincide con `svgnames.md`; la unica variante exclusiva de rectangulo es `diademuertos`. No se encontraron nombres duplicados ni variantes esperadas ausentes.

## Estructura

- Los archivos son SVG 1.1 exportados por CorelDRAW, con `viewBox` y dimensiones fisicas en milimetros.
- Cada archivo contiene un grupo y un unico `path`, con clase `fil0` y relleno `gray` declarado en un bloque de estilo.
- No hay elementos `text`/`tspan`, `stroke`, imagenes rasterizadas, referencias `use` ni scripts.
- Hay dos IDs por archivo, correspondientes al grupo de capa y a metadatos de CorelDRAW. Se pueden ignorar al mostrar el asset externamente.
- Los archivos incluyen DOCTYPE SVG 1.1 y namespaces `xlink`/`xodm`; no necesitan esos elementos para este preview.

## Diferencias por forma

- Semicirculo: `viewBox` y dimensiones varian entre variantes; el arte ocupa una proporcion vertical aproximada de 0.89 de ancho/alto.
- Rectangulo: el arte es mas apaisado, aproximadamente 1.27 de ancho/alto. `nombre` y `diademuertos` tienen medidas fisicas ligeramente diferentes del resto.
- Las diferencias de escala se deben conservar con `preserveAspectRatio` equivalente; no se debe forzar el mismo `viewBox` entre diseños.

## Decisiones del renderer

- Color: el path monocromo puede usarse como mascara alfa CSS. El color de fondo de la mascara define el papel y las zonas transparentes del diseno quedan recortadas por la forma. Esto evita editar los archivos y es preferible a `<img>`, que no permite cambiar `fill` desde React.
- Nombre: ningun SVG contiene texto. El nombre debe renderizarse como texto HTML superpuesto al SVG `nombre`; su posicion y tipografia se revisaran visualmente en ambas formas.
- Preview: `getBanderinSvg(shape, designId)` sigue siendo la unica funcion que deriva el nombre. Vite publica `src/public` como raiz estatica.
- No se encontraron placeholders de texto ni dependencias externas en los archivos auditados.