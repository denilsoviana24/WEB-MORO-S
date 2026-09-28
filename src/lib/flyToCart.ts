// Helper para disparar la animación "volar al carrito"
export function flyToCart(image: string, fromX: number, fromY: number) {
  try {
    window.dispatchEvent(
      new CustomEvent('moros:fly-to-cart', { detail: { image, fromX, fromY } })
    );
  } catch {
    // ignorar (SSR)
  }
}

export function flyToCartFromEvent(
  e: React.MouseEvent,
  image: string,
  offsetX = 0,
  offsetY = 0
) {
  flyToCart(image, e.clientX + offsetX, e.clientY + offsetY);
}
