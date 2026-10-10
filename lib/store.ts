export type ProductImage = { url?: string; publicId?: string };

export type ProductSize = { name: string; stock?: number };

export type ProductColor = {
  name: string;
  hex?: string;
  imageUrl?: string;
  publicId?: string;
  stock?: number;
};

export type Product = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  description?: string;
  tags?: string[] | string;
  price: number;
  salePrice?: number;
  offerTitle?: string;
  images?: ProductImage[];
  imageUrl?: string;
  stock: number;
  sizes?: ProductSize[] | string[];
  colors?: ProductColor[];
  createdAt?: unknown;
};

export type CatalogEntry = { id: string; name: string; description?: string; isActive?: boolean };

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  readMinutes?: number;
  isPublished?: boolean;
  publishedAt?: unknown;
};

export type InfoPage = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  group?: string;
  isPublished?: boolean;
  updatedAt?: unknown;
};

export const INFO_PAGES: Array<{ slug: string; title: string; group: string; fallback: string }> = [
  {
    slug: 'return-policy',
    title: 'سياسة الاستبدال والاسترجاع',
    group: 'روابط مهمة',
    fallback:
      '• الاستبدال أو الاسترجاع متاح خلال 14 يوم من الاستلام.\n• القطعة لازم تكون في حالتها الأصلية مع البيجينج.\n• لو القطعة فيها عيب تصنيع، هنتكفّل بالتغيير من غير أي تكلفة.\n•  والاسترجاع بيتحمل تكلفة الشحن إلا لو خطأ من طرفنا.',
  },
  {
    slug: 'shipping',
    title: 'الشحن والتوصيل',
    group: 'روابط مهمة',
    fallback:
      '• بنشحن لكل المحافظات، ومدة التوصيل بتبدأ من لحظة تجهيز الطلب.\n• التوصيل من 2 لـ 5 أيام عمل حسب المنطقة.\n• ممكن تختار الاستلام من الفرع أو التوصيل للمنزل.\n• هنبعتلك رسالة على واتساب أول ما الطلب يتحرك.',
  },
  {
    slug: 'faq',
    title: 'الأسئلة الشائعة',
    group: 'روابط مهمة',
    fallback:
      'كيف أعرف مقاسي؟\nكل قطعة عليها جدول المقاسات في صفحتها، لو محتار قاس على قطعة عندك تقارن بيها.\n\nالطلب عند الاستلام ولا دفع مقدم؟\nالدفع عند الاستلام في كل المحافظات.\n\nأقدر أغيّر المقاس؟\nأيوه، لو القطعة متاحة وبنفس السعر بنبدّلها من غير تكلفة.',
  },
  {
    slug: 'terms',
    title: 'الشروط والأحكام',
    group: 'روابط مهمة',
    fallback:
      '• باستخدامك للموقع أو تأكيدك للطلب، أنت بتوافق على شروط الاستخدام.\n• الأسعار والتوافر ممكن يتغيروا، والطلب بيتأكد وقت التسجيل.\n• أي صور أو نصوص على الموقع ملك العلامة ولا يجوز نسخها بدون إذن.',
  },
  {
    slug: 'privacy',
    title: 'سياسة الخصوصية',
    group: 'روابط مهمة',
    fallback:
      '• بنجمع البيانات الضرورية بس عشان نوصّل الطلب: الاسم، الموبايل، والعنوان.\n• بياناتك متحفظش عندنا بعد ما الطلب يتسلم.\n• تقدر تطلب حذف بياناتك في أي وقت عن طريق التواصل معانا.',
  },
  {
    slug: 'complaints',
    title: 'الشكاوى والاقتراحات',
    group: 'روابط مهمة',
    fallback:
      'عندك ملاحظة على منتج أو خدمة؟ ابعتلنا على واتساب أو إيميل وهنرد عليك في أقرب وقت، كل ملاحظة بتتراجع فعلاً.',
  },
];

export type Offer = {
  id: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productIds: string[];
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

export type ShippingRate = { id: string; area: string; price: number; deliveryDays: number; isActive: boolean };

export type BrandProfile = {
  name: string;
  tagline?: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  workingHours: string;
  instagram: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  telegram?: string;
  x?: string;
  snapchat?: string;
  threads?: string;
  linkedin?: string;
  pinterest?: string;
  websiteUrl?: string;
  mapUrl?: string;
};

export type CartLine = { productId: string; quantity: number; size?: string; color?: string };

export type ReviewStatus = 'جديدة' | 'معتمدة' | 'مخفية';

export type Review = {
  id: string;
  productId?: string;
  productName?: string;
  customerName: string;
  rating: number;
  comment: string;
  status?: ReviewStatus;
  createdAt?: unknown;
};

export const REVIEW_STATUSES: ReviewStatus[] = ['جديدة', 'معتمدة', 'مخفية'];
export const MAX_REVIEW_LENGTH = 600;

export type SavedCheckoutDetails = {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  shippingArea: string;
};

export type ResolvedProduct = Product & {
  salePrice: number;
  offerTitle?: string;
  discounted: boolean;
  categoryLabel: string;
  brandLabel: string;
  image: string;
  createdTime: number;
};

export type NavLink = { href: string; label: string };

export const MAIN_LINKS: NavLink[] = [
  { href: '/products', label: 'كل المنتجات' },
  { href: '/categories', label: 'الأقسام' },
  { href: '/offers', label: 'العروض' },
  { href: '/blog', label: 'المدونة' },
  { href: '/about', label: 'عن R/ONE' },
];

export const BRAND_NAME = 'R/ONE';
export const BRAND_TAGLINE = 'MADE TO MOVE';
export const LOGO_SRC = '/logo.png';
export const CURRENCY_LABEL = 'ج.م';
export const MAX_QUANTITY = 20;
export const CART_STORAGE_KEY = 'r-one-cart';

export const DEFAULT_DESCRIPTION = 'قطع معمولة بعناية، تفصيلة بتفصيلة، لحد بابك.';
export const DEFAULT_TAGLINE = 'تفاصيل معمولة علشان تعيش.';
const OFF_TOPIC = /(تصنيع|تصنع|تصنعها|غرزة|غرز|خياط|خياطة|ورشة|ورشه|craft|manufactur)/i;

export const profileDefaults: BrandProfile = {
  name: BRAND_NAME,
  tagline: DEFAULT_TAGLINE,
  description: DEFAULT_DESCRIPTION,
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: 'طوخ',
  governorate: 'القليوبية',
  workingHours: '',
  instagram: '',
};

const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', { maximumFractionDigits: 0 });

export function formatMoney(value: number) {
  return moneyFormatter.format(Math.round(Number(value) || 0));
}

export function formatPrice(value: number) {
  return `${formatMoney(value)} ${CURRENCY_LABEL}`;
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function stripWorkshopWord(value: string) {
  return String(value ?? '')
    .replace(/\s*(?:ال)?ورش[ةه]\s*/g, ' ')
    .replace(/\s*[•·\|\-–—:]\s*$/g, '')
    .replace(/[•·\|]{2,}/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function brandName(value?: string) {
  const cleaned = stripWorkshopWord(value ?? '');
  return cleaned || BRAND_NAME;
}

export function brandTagline(value?: string) {
  const cleaned = stripWorkshopWord(value ?? '').replace(/[.。]\s*$/, '');
  if (!cleaned || OFF_TOPIC.test(cleaned)) return DEFAULT_TAGLINE;
  return cleaned;
}

export function brandDescription(value?: string) {
  const cleaned = stripWorkshopWord(value ?? '');
  if (!cleaned || OFF_TOPIC.test(cleaned)) return DEFAULT_DESCRIPTION;
  return cleaned;
}

export function catalogLabel(entries: CatalogEntry[], id?: string, fallback?: string) {
  if (!id) return fallback ?? BRAND_NAME;
  return entries.find((entry) => entry.id === id)?.name || fallback || BRAND_NAME;
}

const CLOUDINARY = 'res.cloudinary.com';

/** Cloudinary can pick the best format + quality per browser — big image win. */
export function productSizes(product: Product): ProductSize[] {
  const list = Array.isArray(product.sizes) ? product.sizes : [];
  return list
    .map((size) => (typeof size === 'string' ? { name: size.trim() } : { name: String(size?.name ?? '').trim(), stock: Number(size?.stock) }))
    .filter((size) => size.name)
    .map((size) => (Number.isFinite(size.stock) ? size : { name: size.name }));
}

export function productColors(product: Product): ProductColor[] {
  const list = Array.isArray(product.colors) ? product.colors : [];
  return list
    .map((color) => ({
      name: String(color?.name ?? '').trim(),
      hex: color?.hex || '',
      imageUrl: color?.imageUrl || '',
      publicId: color?.publicId || '',
      stock: Number.isFinite(Number(color?.stock)) ? Number(color?.stock) : undefined,
    }))
    .filter((color) => color.name);
}

/** images that belong to a specific colour (falls back to the gallery) */
export function colorImages(product: Product, colorName?: string) {
  const colors = productColors(product);
  const match = colorName ? colors.find((color) => color.name === colorName) : undefined;
  if (!match) return productImages(product);
  const gallery = productImages(product);
  if (match.imageUrl && gallery.includes(match.imageUrl)) return [match.imageUrl, ...gallery.filter((url) => url !== match.imageUrl)];
  if (match.imageUrl) return [match.imageUrl, ...gallery];
  return gallery;
}

export function sizeStock(product: Product, sizeName?: string) {
  const sizes = productSizes(product);
  if (!sizes.length) return Number(product.stock) || 0;
  const match = sizeName ? sizes.find((size) => size.name === sizeName) : undefined;
  if (match && typeof match.stock === 'number') return match.stock;
  const stocks = sizes.map((size) => (typeof size.stock === 'number' ? size.stock : Number(product.stock) || 0));
  return Math.min(...stocks);
}

export function maxOrderQuantity(product: Product, sizeName?: string) {
  return Math.max(1, Math.min(MAX_QUANTITY, sizeStock(product, sizeName) || Number(product.stock) || 1));
}

export const IMAGE_WIDTH_CAP = 1400;

export function optimizeImageUrl(url: string, width?: number) {
  if (!url || !url.includes(CLOUDINARY)) return url;
  if (url.includes('/upload/f_auto')) return url;
  const target = Math.min(Math.round(width || IMAGE_WIDTH_CAP), IMAGE_WIDTH_CAP);
  const transforms = ['f_auto', 'q_auto:low', `c_limit,w_${target}`, 'dpr_auto'].filter(Boolean).join(',');
  return url.replace('/upload/', `/upload/${transforms}/`);
}

export function productImages(product: Product) {
  const list = (product.images ?? []).map((image) => image.url).filter((url): url is string => Boolean(url));
  if (list.length) return Array.from(new Set(list));
  return product.imageUrl ? [product.imageUrl] : [];
}

export function productImage(product: Product) {
  return productImages(product)[0] ?? '';
}

export function productImagesOptimized(product: Product, width?: number) {
  return productImages(product).map((url) => optimizeImageUrl(url, width));
}

export function offerIsActive(offer: Offer, productId: string, today: string) {
  return Boolean(
    offer?.isActive &&
    Array.isArray(offer.productIds) &&
    offer.productIds.includes(productId) &&
    today >= offer.startsOn &&
    today <= offer.endsOn,
  );
}

export function bestOfferFor(product: Product, offers: Offer[], today: string) {
  const active = offers.filter((offer) => offerIsActive(offer, product.id, today));
  return active.sort((left, right) => (Number(left.discountValue) || 0) - (Number(right.discountValue) || 0))[0];
}

export function currentPrice(product: Product, offers: Offer[], today: string) {
  const base = Number(product.price) || 0;
  const candidates = Number(product.salePrice) > 0 && Number(product.salePrice) < base ? [Number(product.salePrice)] : [];
  for (const offer of offers) {
    if (!offerIsActive(offer, product.id, today)) continue;
    const discount = Number(offer.discountValue) || 0;
    const amount = offer.discountType === 'percentage' ? base * (1 - discount / 100) : base - discount;
    if (amount > 0 && amount < base) candidates.push(amount);
  }
  return Math.round(Math.min(base, ...candidates) * 100) / 100;
}

export function formatDateStamp(value: unknown) {
  const time = timeValue(value);
  if (!time) return 'حديثاً';
  try {
    return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(time));
  } catch {
    return 'حديثاً';
  }
}

export function stockState(stock: number) {
  const value = Number(stock) || 0;
  if (value <= 0) return { available: false, low: false, label: 'غير متاح حالياً' };
  if (value <= 5) return { available: true, low: true, label: `متبقي ${value} قطع` };
  return { available: true, low: false, label: 'متاح للطلب' };
}

function timeValue(value: unknown) {
  try {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const seconds = typeof record.seconds === 'number' ? record.seconds : typeof record._seconds === 'number' ? record._seconds : null;
      const nanos = typeof record.nanoseconds === 'number' ? record.nanoseconds : typeof record._nanoseconds === 'number' ? record._nanoseconds : 0;
      if (seconds !== null) return seconds * 1000 + Math.floor((nanos || 0) / 1e6);
      const millis = record.toMillis;
      if (typeof millis === 'function') {
        const result = (millis as () => unknown).call(record);
        return typeof result === 'number' && Number.isFinite(result) ? result : 0;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export function resolveProduct(
  product: Product,
  offers: Offer[],
  today: string,
  categories: CatalogEntry[],
  brands: CatalogEntry[],
): ResolvedProduct {
  const offer = bestOfferFor(product, offers, today);
  const salePrice = currentPrice(product, offers, today);
  return {
    ...product,
    salePrice,
    offerTitle: offer?.title || product.offerTitle,
    discounted: salePrice < (Number(product.price) || 0),
    categoryLabel: catalogLabel(categories, product.categoryId, product.category),
    brandLabel: product.brandId ? catalogLabel(brands, product.brandId, product.brand) : product.brand || '',
    image: productImage(product),
    createdTime: timeValue(product.createdAt),
  };
}

export function resolveCatalog(
  products: Product[],
  offers: Offer[],
  today: string,
  categories: CatalogEntry[],
  brands: CatalogEntry[],
) {
  return products
    .map((product) => resolveProduct(product, offers, today, categories, brands))
    .filter((product) => Number(product.stock) > 0);
}

const DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

type FoldedText = { text: string; map: number[] };

function foldChar(char: string) {
  if (DIACRITICS.test(char) || char === 'ء') return '';
  if ('أإآٱا'.includes(char)) return 'ا';
  if (char === 'ى' || char === 'ی') return 'ي';
  if (char === 'ي' || char === 'ى') return 'ي';
  if (char === 'ة') return 'ه';
  if (char === 'ؤ') return 'و';
  if (char === 'ئ') return 'ي';
  if (char === 'ک') return 'ك';
  if (ARABIC_DIGITS.includes(char)) return String(ARABIC_DIGITS.indexOf(char));
  if (!/[\p{L}\p{N}]/u.test(char)) return ' ';
  return char.toLowerCase();
}

function foldText(value: string): FoldedText {
  const source = String(value ?? '');
  let text = '';
  const map: number[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const mapped = foldChar(source[index]);
    text += mapped;
    map.push(index);
  }
  return { text, map };
}

export function normalizeArabic(value: string) {
  return foldText(value).text.replace(/\s+/g, ' ').trim();
}

export function tokenizeQuery(query: string) {
  return normalizeArabic(query).split(' ').filter((token) => token.length > 0);
}

type SearchField = { value: string; weight: number };

const FIELD_WEIGHTS: Array<{ get: (product: ResolvedProduct) => string; weight: number }> = [
  { get: (product) => product.name, weight: 100 },
  { get: (product) => product.sku || '', weight: 64 },
  { get: (product) => product.categoryLabel, weight: 48 },
  { get: (product) => product.brandLabel, weight: 42 },
  { get: (product) => (Array.isArray(product.tags) ? product.tags.join(' ') : product.tags || ''), weight: 26 },
  { get: (product) => product.offerTitle || '', weight: 18 },
  { get: (product) => product.description || '', weight: 16 },
];

export function searchScore(product: ResolvedProduct, tokens: string[], rawQuery: string) {
  if (!tokens.length) return 0;
  const fields: SearchField[] = FIELD_WEIGHTS.map((field) => ({ value: normalizeArabic(field.get(product)), weight: field.weight }));
  const normalizedName = fields[0]?.value ?? '';
  let total = 0;

  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      if (!field.value) continue;
      let score = 0;
      if (field.value === token) score = field.weight * 2;
      else if (field.value.startsWith(token)) score = field.weight * 1.35;
      else {
        const position = field.value.indexOf(token);
        if (position < 0) continue;
        const coverage = token.length / field.value.length;
        score = field.weight * (0.45 + Math.min(0.5, coverage));
      }
      if (score > best) best = score;
    }
    if (best === 0) return 0;
    total += best;
    if (normalizedName.includes(token)) total += 26;
  }

  const joined = tokens.join(' ');
  if (normalizedName === joined) total += 140;
  else if (normalizedName.startsWith(joined)) total += 70;

  const raw = normalizeArabic(rawQuery);
  if (raw && normalizedName.startsWith(raw)) total += 40;

  total += Math.max(0, 22 - Math.round(normalizedName.length / 3));
  if (product.discounted) total += 6;
  if (Number(product.stock) > 5) total += 4;
  return total;
}

export type SortKey = 'featured' | 'relevance' | 'price-low' | 'price-high' | 'newest' | 'name';

export function rankProducts(
  products: ResolvedProduct[],
  query: string,
  sort: SortKey,
  categoryFilter: string,
  offerOnly: boolean,
) {
  const tokens = tokenizeQuery(query);
  const scored = products
    .map((product) => ({ product, score: searchScore(product, tokens, query) }))
    .filter((entry) => !tokens.length || entry.score > 0)
    .filter(({ product }) => {
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter || product.categoryLabel === categoryFilter;
      const matchesOffer = !offerOnly || product.discounted;
      return matchesCategory && matchesOffer;
    });

  const sorted = [...scored];
  if (sort === 'price-low') sorted.sort((left, right) => left.product.salePrice - right.product.salePrice || right.score - left.score);
  else if (sort === 'price-high') sorted.sort((left, right) => right.product.salePrice - left.product.salePrice || right.score - left.score);
  else if (sort === 'newest') sorted.sort((left, right) => right.product.createdTime - left.product.createdTime || right.score - left.score);
  else if (sort === 'name') sorted.sort((left, right) => left.product.name.localeCompare(right.product.name, 'ar'));
  else if (tokens.length) sorted.sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name, 'ar'));
  else sorted.sort((left, right) => right.product.createdTime - left.product.createdTime || left.product.name.localeCompare(right.product.name, 'ar'));

  return { items: sorted.map((entry) => entry.product), tokens };
}

export function dedupeByImage(products: ResolvedProduct[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (!product.image) return true;
    if (seen.has(product.image)) return false;
    seen.add(product.image);
    return true;
  });
}

function featuredScore(product: ResolvedProduct) {
  return (
    (product.image ? 30 : 0) +
    (product.discounted ? 10 : 0) +
    (Number(product.stock) > 5 ? 8 : 0) +
    Math.min(20, product.createdTime ? 20 : 0)
  );
}

export function pickFeatured(products: ResolvedProduct[], count = 2) {
  const pool = dedupeByImage([...products].sort((left, right) => featuredScore(right) - featuredScore(left)));
  const picked: ResolvedProduct[] = [];
  for (const product of pool) {
    if (picked.length >= count) break;
    if (!product.image) continue;
    if (picked.length === 0) picked.push(product);
    else if (!picked.some((entry) => entry.categoryLabel === product.categoryLabel)) picked.push(product);
  }
  for (const product of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(product)) picked.push(product);
  }
  return picked.slice(0, count);
}

export type RelatedProduct = { product: ResolvedProduct; reason: string };

export function pickRelated(products: ResolvedProduct[], current: ResolvedProduct | Product, count = 4): RelatedProduct[] {
  const currentLabels = {
    category: (current as ResolvedProduct).categoryLabel ?? current.category ?? '',
    brand: (current as ResolvedProduct).brandLabel ?? current.brand ?? '',
  };
  const pool = dedupeByImage(products.filter((product) => product.id !== current.id));
  const scored = pool
    .map((product) => {
      let score = 0;
      let reason = 'من المجموعة';
      if (current.categoryId && product.categoryId === current.categoryId) { score += 100; reason = 'نفس التصنيف'; }
      else if (currentLabels.category && product.categoryLabel === currentLabels.category) { score += 90; reason = 'نفس التصنيف'; }
      if (current.brandId && product.brandId === current.brandId) { score += 36; if (score < 100) reason = 'نفس البراند'; }
      else if (currentLabels.brand && product.brandLabel === currentLabels.brand) { score += 28; if (score < 100) reason = 'نفس البراند'; }
      if (product.image) score += 12;
      if (product.discounted) score += 6;
      if (Number(product.stock) > 5) score += 4;
      return { product, reason, score };
    })
    .sort((left, right) => right.score - left.score || right.product.createdTime - left.product.createdTime);

  return scored.slice(0, count);
}

export function whatsappHref(phone: string, message?: string) {
  return whatsappTargets(phone, message)[0].href;
}

/** لو الجهاز فيه أكتر من تطبيق واتساب، نخلي العميل نفسه يختار. */
export function whatsappTargets(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? `20${digits.slice(1)}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return [
    { id: 'whatsapp', label: 'واتساب', hint: 'التطبيق العادي', href: `https://wa.me/${international}${query}` },
    { id: 'business', label: 'واتساب للأعمال', hint: 'WhatsApp Business', href: `https://api.whatsapp.com/send?phone=${international}${query}` },
    { id: 'web', label: 'واتساب ويب', hint: 'يفتح في المتصفح', href: `https://web.whatsapp.com/send?phone=${international}${query}` },
  ];
}

export function instagramHref(value: string) {
  return value.startsWith('http') ? value : `https://${value}`;
}

export type SocialKey =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'telegram'
  | 'x'
  | 'snapchat'
  | 'threads'
  | 'linkedin'
  | 'pinterest'
  | 'website'
  | 'map';

export type SocialLink = { key: SocialKey; label: string; href: string; handle: string };

type SocialField = {
  key: SocialKey;
  label: string;
  field: keyof BrandProfile;
  host?: string;
  base?: string;
  prefix?: string;
};

const SOCIAL_FIELDS: SocialField[] = [
  { key: 'whatsapp', label: 'واتساب', field: 'whatsapp' },
  { key: 'instagram', label: 'Instagram', field: 'instagram', host: 'instagram.com', base: 'instagram.com' },
  { key: 'facebook', label: 'Facebook', field: 'facebook', host: 'facebook.com', base: 'facebook.com' },
  { key: 'tiktok', label: 'TikTok', field: 'tiktok', host: 'tiktok.com', base: 'tiktok.com', prefix: '@' },
  { key: 'youtube', label: 'YouTube', field: 'youtube', host: 'youtube.com', base: 'youtube.com', prefix: '@' },
  { key: 'telegram', label: 'Telegram', field: 'telegram', host: 't.me', base: 't.me' },
  { key: 'x', label: 'X', field: 'x', host: 'x.com', base: 'x.com' },
  { key: 'snapchat', label: 'Snapchat', field: 'snapchat', host: 'snapchat.com', base: 'snapchat.com/add' },
  { key: 'threads', label: 'Threads', field: 'threads', host: 'threads.net', base: 'threads.net', prefix: '@' },
  { key: 'linkedin', label: 'LinkedIn', field: 'linkedin', host: 'linkedin.com', base: 'linkedin.com/company' },
  { key: 'pinterest', label: 'Pinterest', field: 'pinterest', host: 'pinterest.com', base: 'pinterest.com' },
  { key: 'website', label: 'الموقع', field: 'websiteUrl' },
  { key: 'map', label: 'الموقع على الخريطة', field: 'mapUrl' },
];

function resolveSocialHref(entry: SocialField, raw: string) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (entry.key === 'whatsapp') return whatsappHref(value);
  if (entry.key === 'telegram') {
    const digits = value.replace(/\D/g, '');
    if (digits) return `https://t.me/${digits.replace(/^00/, '').replace(/^0/, '20')}`;
  }
  const clean = value.replace(/^@/, '').replace(/^\/+/, '');
  if (!entry.host || !entry.base) return `https://${clean}`;
  if (clean.toLowerCase().includes(entry.host)) return `https://${clean}`;
  return `https://${entry.base}/${entry.prefix ?? ''}${clean}`;
}

export function socialLinks(profile: BrandProfile): SocialLink[] {
  return SOCIAL_FIELDS.flatMap((entry) => {
    const raw = String(profile[entry.field] ?? '').trim();
    const href = resolveSocialHref(entry, raw);
    if (!href) return [];
    return [{ key: entry.key, label: entry.label, href, handle: raw }];
  });
}

export function socialLink(profile: BrandProfile, key: SocialKey) {
  return socialLinks(profile).find((link) => link.key === key);
}

export function highlightParts(text: string, tokens: string[]) {
  const source = String(text ?? '');
  if (!tokens.length) return [{ text: source, match: false }];

  const folded = foldText(source);
  const marks = new Array(source.length).fill(false);
  let matched = false;

  for (const token of tokens) {
    const needle = foldText(token).text;
    if (!needle) continue;
    let from = 0;
    while (from <= folded.text.length - needle.length) {
      const found = folded.text.indexOf(needle, from);
      if (found < 0) break;
      for (let offset = found; offset < found + needle.length && offset < folded.map.length; offset += 1) {
        marks[folded.map[offset]] = true;
        matched = true;
      }
      from = found + needle.length;
    }
  }

  if (!matched) return [{ text: source, match: false }];

  const parts: Array<{ text: string; match: boolean }> = [];
  let buffer = '';
  let current = marks[0] ?? false;
  for (let index = 0; index < source.length; index += 1) {
    const match = marks[index] ?? false;
    if (match !== current) {
      if (buffer) parts.push({ text: buffer, match: current });
      buffer = '';
      current = match;
    }
    buffer += source[index];
  }
  if (buffer) parts.push({ text: buffer, match: current });
  return parts;
}

export function approvedReviews(reviews: Review[]) {
  return reviews
    .filter((review) => review.status === 'معتمدة')
    .sort((left, right) => reviewTime(right.createdAt) - reviewTime(left.createdAt));
}

export function reviewTime(value: unknown) {
  return timeValue(value);
}

export function ratingSummary(reviews: Review[]) {
  const list = reviews.filter((review) => Number(review.rating) > 0);
  const count = list.length;
  const average = count ? list.reduce((sum, review) => sum + Number(review.rating), 0) / count : 0;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((review) => Number(review.rating) === star).length,
  }));
  return { count, average: Math.round(average * 10) / 10, buckets };
}

export function clampQuantity(quantity: number, stock: unknown) {
  return Math.max(0, Math.min(MAX_QUANTITY, Number(stock) || 0, Math.floor(Number(quantity) || 0)));
}