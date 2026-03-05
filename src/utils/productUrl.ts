export const slugifyProductName = (name: unknown) =>
  String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const getProductUrl = (product: { id?: unknown; name?: unknown }) => {
  const candidateId =
    (product as any)?.id ??
    (product as any)?.productId ??
    (product as any)?.PK ??
    (product as any)?.pk;

  const id = String(candidateId ?? '').trim();
  const slug = slugifyProductName(product?.name);

  if (!id) return '/product';
  return `/product/${slug || 'item'}--${encodeURIComponent(id)}`;
};

export const getProductIdFromSlug = (slugParam: string | undefined) => {
  const raw = decodeURIComponent(String(slugParam ?? '')).trim();
  if (!raw) return '';

  const parts = raw.split('--');
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return raw;
};
