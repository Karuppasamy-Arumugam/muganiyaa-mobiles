import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  loadDatabase,
  saveDatabase,
  resetDatabase
} from '../services/storageService';
import { fetchSupabaseCatalog } from '../services/supabaseCatalogService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const DataContext = createContext(null);

// Sample data is available only for local development without Supabase.
// A configured local or hosted Supabase instance always starts from empty
// state and gets its data from the database.
const useLocalSampleData = import.meta.env.DEV && !isSupabaseConfigured;
const isProductionBuild = import.meta.env.PROD;

function createEmptyDatabase() {
  return {
    version: '1.0.0',
    products: [],
    categories: [],
    brands: [],
    offers: [],
    banners: [],
    services: [],
    websiteContent: {},
    chatbotSettings: {},
    contactSettings: {
      shopName: 'Muganiyaa-Mobiles',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      hours: '',
      mapQuery: '',
      mapUrl: ''
    },
    enquiries: []
  };
}

function mapStoreSettings(row, fallback = {}) {
  const openingHours = row?.opening_hours;
  const hoursText =
    typeof openingHours === 'string'
      ? openingHours
      : openingHours?.display || fallback.hours || '';

  return {
    ...fallback,
    shopName: row?.store_name || fallback.shopName || 'Muganiyaa-Mobiles',
    phone: row?.phone ?? fallback.phone ?? '',
    whatsapp: row?.whatsapp ?? fallback.whatsapp ?? '',
    email: row?.email ?? fallback.email ?? '',
    address: row?.address ?? fallback.address ?? '',
    hours: hoursText,
    mapQuery: openingHours?.map_query || fallback.mapQuery || row?.address || '',
    mapUrl: row?.map_url || ''
  };
}

function mapSupabaseEnquiry(row) {
  const [enquiryType, ...itemParts] = String(
    row.subject || 'General Enquiry'
  ).split(' — ');

  const statusLabels = {
    new: 'New',
    contacted: 'In Progress',
    resolved: 'Handled',
    archived: 'Handled'
  };

  return {
    id: row.id,
    customerName: row.name,
    phone: row.phone,
    email: row.email || '',
    enquiryType: enquiryType || 'General Enquiry',
    selectedProductOrService: itemParts.join(' — '),
    message: row.message,
    createdAt: row.created_at,
    status: statusLabels[row.internal_status] || 'New',
    notes: row.internal_notes || '',
    repairProgress: 'Not Applicable'
  };
}

function toSupabaseEnquiryStatus(status) {
  return (
    {
      New: 'new',
      'In Progress': 'contacted',
      Handled: 'resolved'
    }[status] || 'new'
  );
}
function getValidColorHex(...values) {
  const value = values.find((item) => String(item ?? '').trim() !== '');
  if (value == null) return null;

  const hex = String(value).trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(
      'Product colours must use a six-digit hex code, such as #F1AFB5.'
    );
  }

  return hex.toUpperCase();
}

function mapSupabaseBanner(row) {
  const imagePath = row.image_path || '';
  const imageUrl = !imagePath
    ? ''
    : /^https?:\/\//i.test(imagePath)
      ? imagePath
      : supabase.storage
          .from('banner-images')
          .getPublicUrl(imagePath).data.publicUrl;

  return {
    id: row.id,
    title: row.title || '',
    subtitle: row.subtitle || '',
    badge: row.badge_text || '',
    ctaText: row.button_label || 'Explore Now',
    link: row.target_url || '/mobiles',
    imagePath,
    imageUrl,
    active: Boolean(row.is_active),
    order: row.sort_order ?? 0
  };
}

function mapServiceFromRow(row) {
  return {
    id: row.id,
    slug: row.slug || '',
    title: row.name || '',
    subtitle: row.description || '',
    imagePath: row.image_path || '',
    features: Array.isArray(row.features) ? row.features : [],
    enquiryService: row.enquiry_service || '',
    icon: row.icon || 'Wrench',
    order: row.sort_order ?? 0,
    active: Boolean(row.is_active)
  };
}

function mapOfferFromRow(row) {
  return {
    id: row.id,
    title: row.title || '',
    type: row.offer_type || 'Card Offer',
    discountAmount: Number(row.discount_value) || 0,
    startDate: row.start_at?.slice(0, 10) || '',
    endDate: row.end_at?.slice(0, 10) || '',
    terms: row.terms || '',
    status: row.is_active ? 'active' : 'expired',
    badgeText: row.badge_text || '',
    provider: row.provider || '',
    minPurchase: Number(row.min_purchase) || 0,
    tenureOptions: row.tenure_options || '',
    downPayment: row.down_payment || '',
    processingFee: row.processing_fee || ''
  };
}
export function DataProvider({ children }) {
  const [db, setDb] = useState(() => {
    const initialDatabase = useLocalSampleData
      ? loadDatabase()
      : createEmptyDatabase();

    // Enquiries can contain personal information. Never restore saved enquiry
    // records from this browser, whether Supabase is configured or not.
    return {
      ...initialDatabase,
      enquiries: []
    };
  });

  const [catalogLoading, setCatalogLoading] = useState(isSupabaseConfigured);
  const [catalogError, setCatalogError] = useState(
    !isSupabaseConfigured && isProductionBuild
      ? 'The store catalogue is temporarily unavailable.'
      : ''
  );
  const [bannersLoading, setBannersLoading] = useState(Boolean(supabase));
  const [bannersError, setBannersError] = useState(
    !supabase && isProductionBuild ? 'Homepage content is temporarily unavailable.' : ''
  );
  const [servicesLoading, setServicesLoading] = useState(Boolean(supabase));
  const [servicesError, setServicesError] = useState(
    !supabase && isProductionBuild ? 'Store services are temporarily unavailable.' : ''
  );
  const [offersLoading, setOffersLoading] = useState(Boolean(supabase));
  const [offersError, setOffersError] = useState(
    !supabase && isProductionBuild ? 'Current offers are temporarily unavailable.' : ''
  );
  const [enquiriesLoading, setEnquiriesLoading] = useState(Boolean(supabase));
  const [enquiriesError, setEnquiriesError] = useState(
    !supabase && isProductionBuild ? 'Enquiries are temporarily unavailable.' : ''
  );
  const [websiteContentLoading, setWebsiteContentLoading] = useState(Boolean(supabase));
  const [websiteContentError, setWebsiteContentError] = useState(
    !supabase && isProductionBuild ? 'Website content is temporarily unavailable.' : ''
  );
  const [contactSettingsLoading, setContactSettingsLoading] = useState(Boolean(supabase));
  const [contactSettingsError, setContactSettingsError] = useState(
    !supabase && isProductionBuild ? 'Contact details are temporarily unavailable.' : ''
  );

  // Load the public catalogue from Supabase and expose its loading/error state.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCatalogLoading(false);
      if (isProductionBuild) {
        setCatalogError('The store catalogue is not configured yet.');
      }
      return undefined;
    }

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError('');

    fetchSupabaseCatalog({})
      .then((catalogue) => {
        if (catalogue && !cancelled) {
          setDb((current) => ({ ...current, ...catalogue }));
        }
      })
      .catch((error) => {
        console.error(
          'Could not load catalogue from Supabase:',
          error.message
        );
        if (!cancelled) {
          setCatalogError('We could not load the catalogue. Please try again later.');
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadEnquiries = useCallback(async () => {
    if (!supabase) {
      setEnquiriesLoading(false);
      setEnquiriesError(
        isProductionBuild ? 'Enquiries are temporarily unavailable.' : ''
      );
      return;
    }

    setEnquiriesLoading(true);
    setEnquiriesError('');

    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select(
          'id, name, phone, email, subject, message, internal_status, internal_notes, created_at'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDb((current) => ({
        ...current,
        enquiries: (data || []).map(mapSupabaseEnquiry)
      }));
    } catch (error) {
      console.error('Could not load enquiries from Supabase:', error.message);
      setEnquiriesError('Enquiries could not be loaded. Please try again.');
      throw error;
    } finally {
      setEnquiriesLoading(false);
    }
  }, []);

  // Load the admin inbox after startup and refresh it after auth or live changes.
  useEffect(() => {
    if (!supabase) {
      setEnquiriesLoading(false);
      setEnquiriesError(
        isProductionBuild ? 'Enquiries are temporarily unavailable.' : ''
      );
      return undefined;
    }

    let cancelled = false;
    const refreshEnquiries = () => {
      if (!cancelled) void reloadEnquiries().catch(() => {});
    };

    refreshEnquiries();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          session &&
          ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)
        ) {
          setTimeout(() => {
            if (!cancelled) refreshEnquiries();
          }, 0);
        }
      }
    );

    const channel = supabase
      .channel('enquiries-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        (payload) => {
          if (cancelled) return;

          setDb((current) => {
            const rows = current.enquiries || [];

            if (payload.eventType === 'DELETE') {
              return {
                ...current,
                enquiries: rows.filter((item) => item.id !== payload.old.id)
              };
            }

            const item = mapSupabaseEnquiry(payload.new);
            const exists = rows.some((row) => row.id === item.id);

            return {
              ...current,
              enquiries: exists
                ? rows.map((row) => (row.id === item.id ? item : row))
                : [item, ...rows]
            };
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [reloadEnquiries]);

  // Load showroom settings from Supabase and expose loading, error, and retry state.
  const reloadContactSettings = useCallback(async () => {
    if (!supabase) {
      setContactSettingsLoading(false);
      setContactSettingsError(
        isProductionBuild ? 'Contact details are temporarily unavailable.' : ''
      );
      return;
    }

    setContactSettingsLoading(true);
    setContactSettingsError('');

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('id, store_name, phone, whatsapp, email, address, opening_hours, map_url')
        .eq('id', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setDb((current) => ({
          ...current,
          contactSettings: mapStoreSettings(data, current.contactSettings)
        }));
      }
    } catch (error) {
      console.error('Could not load showroom settings from Supabase:', error.message);
      setContactSettingsError('Contact settings could not be loaded. Check your connection and try again.');
    } finally {
      setContactSettingsLoading(false);
    }
  }, []);

  // Load contact settings on startup and listen for live changes.
  useEffect(() => {
    if (!supabase) {
      setContactSettingsLoading(false);
      setContactSettingsError(
        isProductionBuild ? 'Contact details are temporarily unavailable.' : ''
      );
      return undefined;
    }

    let cancelled = false;
    void reloadContactSettings();

    const channel = supabase
      .channel('store-settings-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (cancelled || payload.new?.id !== true) return;

          setDb((current) => ({
            ...current,
            contactSettings: mapStoreSettings(payload.new, current.contactSettings)
          }));
          setContactSettingsError('');
          setContactSettingsLoading(false);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Live showroom settings updates could not be connected.');
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [reloadContactSettings]);
  // Load website content from Supabase and expose loading, error, and retry state.
  const reloadWebsiteContent = useCallback(async () => {
    if (!supabase) {
      setWebsiteContentLoading(false);
      setWebsiteContentError(
        isProductionBuild ? 'Website content is temporarily unavailable.' : ''
      );
      return;
    }

    setWebsiteContentLoading(true);
    setWebsiteContentError('');

    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('id, content, updated_at')
        .eq('id', true)
        .maybeSingle();

      if (error) throw error;

      const content = data?.content || {};
      setDb((current) => ({
        ...current,
        websiteContent: content,
        chatbotSettings: content.chatbotSettings || current.chatbotSettings
      }));
    } catch (error) {
      console.error('Could not load website content from Supabase:', error.message);
      setWebsiteContentError('Website content could not be loaded. Check your connection and try again.');
    } finally {
      setWebsiteContentLoading(false);
    }
  }, []);

  // Load website content on startup and listen for live changes.
  useEffect(() => {
    if (!supabase) {
      setWebsiteContentLoading(false);
      setWebsiteContentError(
        isProductionBuild ? 'Website content is temporarily unavailable.' : ''
      );
      return undefined;
    }

    let cancelled = false;
    void reloadWebsiteContent();

    const channel = supabase
      .channel('website-content-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'website_content' },
        (payload) => {
          if (cancelled || payload.new?.id !== true || !payload.new?.content) return;

          setDb((current) => ({
            ...current,
            websiteContent: payload.new.content,
            chatbotSettings: payload.new.content.chatbotSettings || current.chatbotSettings
          }));
          setWebsiteContentError('');
          setWebsiteContentLoading(false);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [reloadWebsiteContent]);
  // Persist sample data only in local development without Supabase.
// Production content must always be loaded from the database.
  useEffect(() => {
    if (!useLocalSampleData) return;

    saveDatabase({
      ...db,
      enquiries: []
    });
  }, [db]);

  const publishedProducts = useMemo(
    () => (db.products || []).filter((product) => product.status === 'published'),
    [db.products]
  );

  const activeOffers = useMemo(
    () => (db.offers || []).filter((offer) => offer.status === 'active'),
    [db.offers]
  );

  const productCategoryFor = (product) =>
    (db.categories || []).find(
      (category) =>
        category.slug === product.categorySlug ||
        category.name === product.category
    );

  const productRowFor = (product, category) => {
    if (!category?.id) {
      throw new Error('Select a valid product category before saving.');
    }

    const slug =
      product.slug ||
      String(product.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const isPublished =
      product.status === 'published' || product.status === 'active';

    return {
      category_id: category.id,
      name: String(product.name || '').trim(),
      slug,
      brand: product.brand || '',
      model: product.model || '',
      tagline: product.tagline || '',
      description: product.description || '',
      base_price: Number(product.sellingPrice) || 0,
      original_price: Number(product.originalPrice) || 0,
      status: isPublished ? 'active' : 'draft',
      is_active: isPublished,
      is_featured: Boolean(product.isFeatured),
      is_latest_launch: Boolean(product.isLatestLaunch),
      is_best_seller: Boolean(product.isBestSeller),
      badges: Array.isArray(product.badges) ? product.badges : [],
      highlights: Array.isArray(product.highlights) ? product.highlights : [],
      updated_at: new Date().toISOString()
    };
  };

  const productRelatedRowsFor = (productId, product) => {
    const colors = product.colors || [];
    const variants = product.variants?.length
      ? product.variants
      : [
          {
            sku: '',
            color: colors[0]?.name || '',
            ram: '',
            storage: '',
            variantAttributes: {},
            sellingPrice: product.sellingPrice,
            originalPrice: product.originalPrice,
            stockStatus: product.stockStatus
          }
        ];

    const variantRows = variants.map((variant) => {
      const color = colors.find((item) => item.name === variant.color);

      return {
        product_id: productId,
        sku: `${product.slug || 'product'}-${crypto.randomUUID()}`,
        color_name: variant.color || '',
        color_hex: getValidColorHex(
          variant.colorHex,
          variant.color_hex,
          color?.hex
        ),
        ram: variant.ram || '',
        storage: variant.storage || '',
        variant_attributes: variant.variantAttributes || {},
        price: Number(variant.sellingPrice || product.sellingPrice) || 0,
        original_price:
          Number(variant.originalPrice || product.originalPrice) || 0,
        stock_quantity: variant.stockStatus === 'In Stock' ? 1 : 0,
        is_available: variant.stockStatus === 'In Stock'
      };
    });

    const imageUrls = [
      ...new Set(
        [...(product.images || []), ...(product.coverImage ? [product.coverImage] : [])]
          .filter(Boolean)
      )
    ];

    const imageRows = imageUrls.map((storagePath, index) => ({
      product_id: productId,
      storage_path: storagePath,
      alt_text: product.name || '',
      sort_order: index,
      is_primary: index === 0
    }));

    const specificationRows = Object.entries(product.specifications || {})
      .filter(([, value]) => value !== '' && value != null)
      .map(([name, value], index) => ({
        product_id: productId,
        group_name: product.specsType || 'general',
        name,
        value: String(value),
        sort_order: index
      }));

    const offerIds = Array.isArray(product.offers) ? product.offers : [];
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (offerIds.some((offerId) => !uuidPattern.test(offerId))) {
      throw new Error(
        'A selected offer has an invalid ID. Refresh offers and select them again.'
      );
    }

    return [
      ['product_variants', variantRows],
      ['product_images', imageRows],
      ['product_specifications', specificationRows],
      [
        'product_offers',
        offerIds.map((offerId) => ({
          product_id: productId,
          offer_id: offerId
        }))
      ]
    ];
  };

  const saveProductRelatedRows = async (productId, product, replace = false) => {
    const relatedRows = productRelatedRowsFor(productId, product);

    if (replace) {
      for (const [table] of relatedRows) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('product_id', productId);

        if (error) throw error;
      }
    }

    for (const [table, rows] of relatedRows) {
      if (!rows.length) continue;

      const { error } = await supabase.from(table).insert(rows);
      if (error) throw error;
    }
  };

  const addProduct = async (newProduct) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Product was not saved.');
    }

    const category = productCategoryFor(newProduct);
    const productRow = productRowFor(newProduct, category);

    if (!productRow.name) {
      throw new Error('Enter a product name before saving.');
    }

    const { data: savedRow, error } = await supabase
      .from('products')
      .insert(productRow)
      .select('id')
      .single();

    if (error) throw error;

    try {
      await saveProductRelatedRows(savedRow.id, newProduct);
    } catch (saveError) {
      await supabase.from('products').delete().eq('id', savedRow.id);
      throw saveError;
    }

    const savedProduct = {
      ...newProduct,
      id: savedRow.id,
      slug: productRow.slug,
      category: category.name,
      categorySlug: category.slug,
      createdAt: new Date().toISOString()
    };

    setDb((previous) => ({
      ...previous,
      products: [savedProduct, ...(previous.products || [])]
    }));

    return savedProduct;
  };

  const updateProduct = async (id, updates) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Product was not updated.');
    }

    const existingProduct = (db.products || []).find(
      (product) => product.id === id
    );

    if (!existingProduct) {
      throw new Error(
        'Product was not found. Refresh the product list and try again.'
      );
    }

    const updatedProduct = { ...existingProduct, ...updates };
    const category = productCategoryFor(updatedProduct);
    const productRow = productRowFor(updatedProduct, category);

    if (!productRow.name) {
      throw new Error('Enter a product name before saving.');
    }

    const { data, error } = await supabase
      .from('products')
      .update(productRow)
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        'Product update returned no row. Check Supabase update permissions (RLS).'
      );
    }

    await saveProductRelatedRows(id, updatedProduct, true);

    const savedProduct = {
      ...updatedProduct,
      id,
      slug: productRow.slug,
      category: category.name,
      categorySlug: category.slug,
      updatedAt: new Date().toISOString()
    };

    setDb((previous) => ({
      ...previous,
      products: (previous.products || []).map((product) =>
        product.id === id ? savedProduct : product
      )
    }));

    return savedProduct;
  };

  const deleteProduct = async (id) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Product was not deleted.');
    }

    for (const table of [
      'product_offers',
      'product_specifications',
      'product_images',
      'product_variants'
    ]) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('product_id', id);

      if (error) throw error;
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      products: (previous.products || []).filter(
        (product) => product.id !== id
      )
    }));
  };

  // Category actions
  const makeCategorySlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const addCategory = async (category) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const name = category.name.trim();
    const slug = category.slug || makeCategorySlug(name);

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select('id, name, slug')
      .single();

    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      categories: [...previous.categories, data]
    }));

    return data;
  };

  const updateCategory = async (id, updates) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const previousCategory = db.categories.find(
      (category) => category.id === id
    );
    const name = updates.name?.trim() || previousCategory?.name;
    const slug = updates.slug || makeCategorySlug(name);

    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .select('id, name, slug')
      .single();

    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === id ? data : category
      ),
      products: previous.products.map((product) =>
        product.categorySlug === previousCategory?.slug
          ? { ...product, category: data.name, categorySlug: data.slug }
          : product
      )
    }));

    return data;
  };

  const deleteCategory = async (id) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const category = db.categories.find((item) => item.id === id);
    const linkedProducts = db.products.filter(
      (product) => product.categorySlug === category?.slug
    );

    if (linkedProducts.length > 0) {
      throw new Error(
        'This category has products assigned to it. Reassign those products before deleting the category.'
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      categories: previous.categories.filter(
        (categoryItem) => categoryItem.id !== id
      )
    }));
  };

  // Brand actions
  const makeBrandSlug = (name) =>
    String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const addBrand = async (brand) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const name = String(brand.name || '').trim();
    if (!name) throw new Error('Enter a brand name.');

    const slug = brand.slug?.trim() || makeBrandSlug(name);
    if (!slug) throw new Error('Enter a valid brand name.');

    const { data, error } = await supabase
      .from('brands')
      .insert({
        name,
        slug,
        is_active: brand.isActive ?? true
      })
      .select('id, name, slug, is_active')
      .single();

    if (error) throw error;

    const savedBrand = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      isActive: Boolean(data.is_active)
    };

    setDb((previous) => ({
      ...previous,
      brands: [...(previous.brands || []), savedBrand].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    }));

    return savedBrand;
  };

  const updateBrand = async (id, updates) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const previousBrand = (db.brands || []).find((brand) => brand.id === id);
    if (!previousBrand) throw new Error('Brand was not found.');

    const name = String(updates.name ?? previousBrand.name).trim();
    if (!name) throw new Error('Brand name cannot be empty.');

    const slug = updates.slug?.trim() || makeBrandSlug(name);
    const isActive = updates.isActive ?? previousBrand.isActive;

    const { data, error } = await supabase
      .from('brands')
      .update({
        name,
        slug,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, slug, is_active')
      .single();

    if (error) throw error;

    const savedBrand = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      isActive: Boolean(data.is_active)
    };

    setDb((previous) => ({
      ...previous,
      brands: (previous.brands || [])
        .map((brand) => (brand.id === id ? savedBrand : brand))
        .sort((a, b) => a.name.localeCompare(b.name)),
      products:
        name !== previousBrand.name
          ? (previous.products || []).map((product) =>
              product.brand === previousBrand.name
                ? { ...product, brand: name }
                : product
            )
          : previous.products
    }));

    return savedBrand;
  };

  const deleteBrand = async (id) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const brand = (db.brands || []).find((item) => item.id === id);
    if (!brand) throw new Error('Brand was not found.');

    const { count, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand', brand.name);

    if (productsError) throw productsError;

    if (count > 0) {
      throw new Error(
        'This brand is assigned to products. Reassign those products before deleting the brand.'
      );
    }

    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      brands: (previous.brands || []).filter((item) => item.id !== id)
    }));
  };

  // Offer actions
  const offerToRow = (offer) => ({
    title: offer.title?.trim(),
    offer_type: offer.type,
    discount_value: Number(offer.discountAmount) || 0,
    start_at: offer.startDate
      ? `${offer.startDate}T00:00:00.000Z`
      : null,
    end_at: offer.endDate ? `${offer.endDate}T23:59:59.999Z` : null,
    terms: offer.terms || null,
    is_active: offer.status === 'active',
    badge_text: offer.badgeText || null,
    provider: offer.provider || null,
    min_purchase: Number(offer.minPurchase) || 0,
    tenure_options: offer.tenureOptions || null,
    down_payment: offer.downPayment || null,
    processing_fee: offer.processingFee || null
  });

  const reloadBanners = useCallback(async () => {
    if (!supabase) {
      setBannersLoading(false);
      setBannersError(
        isProductionBuild ? 'Homepage content is temporarily unavailable.' : ''
      );
      return;
    }

    setBannersLoading(true);
    setBannersError('');

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setDb((current) => ({
        ...current,
        banners: (data || []).map(mapSupabaseBanner)
      }));
    } catch (error) {
      console.error('Could not load banners from Supabase:', error.message);
      setBannersError('We could not load the homepage banners. Please try again later.');
    } finally {
      setBannersLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadBanners();
  }, [reloadBanners]);
  const reloadOffers = useCallback(async () => {
    if (!supabase) {
      setOffersLoading(false);
      setOffersError(
        isProductionBuild ? 'Current offers are temporarily unavailable.' : ''
      );
      return;
    }

    setOffersLoading(true);
    setOffersError('');

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('start_at', { ascending: false });

      if (error) throw error;

      setDb((current) => ({
        ...current,
        offers: (data || []).map(mapOfferFromRow)
      }));
    } catch (error) {
      console.error('Could not load offers from Supabase:', error.message);
      setOffersError('We could not load current offers. Please try again later.');
    } finally {
      setOffersLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadOffers();
  }, [reloadOffers]);
  const addOffer = async (offer) => {
    const { data, error } = await supabase
      .from('offers')
      .insert(offerToRow(offer))
      .select('*')
      .single();

    if (error) throw error;

    const savedOffer = mapOfferFromRow(data);
    setDb((previous) => ({
      ...previous,
      offers: [savedOffer, ...(previous.offers || [])]
    }));

    return savedOffer;
  };

  const updateOffer = async (id, updates) => {
    const existingOffer = (db.offers || []).find((offer) => offer.id === id);
    if (!existingOffer) throw new Error('Offer was not found.');

    const { data, error } = await supabase
      .from('offers')
      .update(offerToRow({ ...existingOffer, ...updates }))
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    const savedOffer = mapOfferFromRow(data);
    setDb((previous) => ({
      ...previous,
      offers: (previous.offers || []).map((offer) =>
        offer.id === id ? savedOffer : offer
      )
    }));

    return savedOffer;
  };

  const deleteOffer = async (id) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      offers: (previous.offers || []).filter((offer) => offer.id !== id)
    }));
  };

  // Banner actions
  const updateBanners = async (banners) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Banners were not saved.');
    }

    const currentBanners = db.banners || [];
    const nextBanners = banners || [];
    const isUuid = (value) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value || ''
      );

    const toBannerRow = (banner, index) => {
      const imagePath = banner.imagePath || banner.imageUrl;

      if (!imagePath) {
        throw new Error('Select or upload a banner image before saving.');
      }

      return {
        title: banner.title?.trim(),
        subtitle: banner.subtitle || null,
        badge_text: banner.badge || null,
        button_label: banner.ctaText || null,
        target_url: banner.link || '/mobiles',
        image_path: imagePath,
        sort_order: index,
        is_active: Boolean(banner.active),
        updated_at: new Date().toISOString()
      };
    };

    const existingBanners = nextBanners.filter((banner) =>
      isUuid(banner.id)
    );
    const newBanners = nextBanners.filter((banner) => !isUuid(banner.id));

    const existingRows = existingBanners.map((banner) => ({
      ...toBannerRow(banner, nextBanners.indexOf(banner)),
      id: banner.id
    }));

    const newRows = newBanners.map((banner) =>
      toBannerRow(banner, nextBanners.indexOf(banner))
    );

    const savedRows = [];

    if (existingRows.length > 0) {
      const { data, error } = await supabase
        .from('banners')
        .upsert(existingRows, { onConflict: 'id' })
        .select('*');

      if (error) throw error;
      savedRows.push(...(data || []));
    }

    if (newRows.length > 0) {
      const { data, error } = await supabase
        .from('banners')
        .insert(newRows)
        .select('*');

      if (error) throw error;
      savedRows.push(...(data || []));
    }

    const nextIds = new Set(existingBanners.map((banner) => banner.id));
    const removedIds = currentBanners
      .filter((banner) => isUuid(banner.id) && !nextIds.has(banner.id))
      .map((banner) => banner.id);

    if (removedIds.length > 0) {
      const { error } = await supabase
        .from('banners')
        .delete()
        .in('id', removedIds);

      if (error) throw error;
    }

    const savedBanners = savedRows
      .map(mapSupabaseBanner)
      .sort((a, b) => a.order - b.order);

    setDb((previous) => ({ ...previous, banners: savedBanners }));
    return savedBanners;
  };

  // Store service actions
  const makeServiceSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const serviceToRow = (service) => ({
    slug: service.slug || makeServiceSlug(service.title || 'new-service'),
    name: service.title?.trim() || '',
    description: service.subtitle || null,
    image_path: service.imagePath || null,
    features: Array.isArray(service.features) ? service.features : [],
    enquiry_service: service.enquiryService || null,
    icon: service.icon || 'Wrench',
    sort_order: service.order ?? 0,
    is_active: service.active ?? true,
    updated_at: new Date().toISOString()
  });
  const reloadServices = useCallback(async () => {
    if (!supabase) {
      setServicesLoading(false);
      setServicesError(
        isProductionBuild ? 'Store services are temporarily unavailable.' : ''
      );
      return;
    }

    setServicesLoading(true);
    setServicesError('');

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setDb((current) => ({
        ...current,
        services: (data || []).map(mapServiceFromRow)
      }));
    } catch (error) {
      console.error('Could not load services from Supabase:', error.message);
      setServicesError('We could not load store services. Please try again later.');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadServices();
  }, [reloadServices]);

  const addService = async (service) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Service was not saved.');
    }

    const row = serviceToRow(service);
    if (!row.name) throw new Error('Enter a service title before saving.');

    const { data, error } = await supabase
      .from('services')
      .insert(row)
      .select('*')
      .single();

    if (error) throw error;

    const savedService = mapServiceFromRow(data);
    setDb((previous) => ({
      ...previous,
      services: [...(previous.services || []), savedService]
    }));

    return savedService;
  };

  const updateService = async (id, updates) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Service was not updated.');
    }

    const currentService = (db.services || []).find(
      (service) => service.id === id
    );
    if (!currentService) throw new Error('Service was not found.');

    const row = serviceToRow({ ...currentService, ...updates });
    if (!row.name) throw new Error('Service title cannot be empty.');

    const { data, error } = await supabase
      .from('services')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    const savedService = mapServiceFromRow(data);
    setDb((previous) => ({
      ...previous,
      services: (previous.services || []).map((service) =>
        service.id === id ? savedService : service
      )
    }));

    return savedService;
  };

  const deleteService = async (id) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Service was not deleted.');
    }

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      services: (previous.services || []).filter(
        (service) => service.id !== id
      )
    }));
  };

  // Website content and settings actions
  const updateWebsiteContent = async (websiteContent) => {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Website content was not saved.'
      );
    }

    const mergedWebsiteContent = {
      ...(db.websiteContent || {}),
      ...(websiteContent || {})
    };

    const { data, error } = await supabase
      .from('website_content')
      .upsert(
        {
          id: true,
          content: mergedWebsiteContent,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select('id, content, updated_at')
      .single();

    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      websiteContent: data.content,
      chatbotSettings: data.content.chatbotSettings || previous.chatbotSettings
    }));

    return data.content;
  };

  const updateContactSettings = async (contactSettings) => {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Contact settings were not saved.'
      );
    }

    const openingHours = {
      display: contactSettings.hours || '',
      map_query: contactSettings.mapQuery || ''
    };

    const { data, error } = await supabase
      .from('store_settings')
      .upsert(
        {
          id: true,
          store_name: contactSettings.shopName || 'Muganiyaa-Mobiles',
          phone: contactSettings.phone || '',
          whatsapp: contactSettings.whatsapp || '',
          email: contactSettings.email || '',
          address: contactSettings.address || '',
          opening_hours: openingHours,
          map_url: contactSettings.mapUrl || '',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select(
        'id, store_name, phone, whatsapp, email, address, opening_hours, map_url'
      )
      .single();

    if (error) throw error;

    const savedSettings = mapStoreSettings(data, contactSettings);
    setDb((previous) => ({
      ...previous,
      contactSettings: savedSettings
    }));

    return savedSettings;
  };

  const updateChatbotSettings = async (chatbotSettings) => {
    if (!supabase) {
      setDb((previous) => ({ ...previous, chatbotSettings }));
      return chatbotSettings;
    }

    const mergedWebsiteContent = {
      ...(db.websiteContent || {}),
      chatbotSettings
    };

    const { data, error } = await supabase
      .from('website_content')
      .upsert(
        {
          id: true,
          content: mergedWebsiteContent,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select('id, content, updated_at')
      .single();

    if (error) throw error;

    setDb((previous) => ({
      ...previous,
      websiteContent: data.content,
      chatbotSettings: data.content.chatbotSettings || chatbotSettings
    }));

    return chatbotSettings;
  };

  // Enquiry actions
  const addEnquiry = async (enquiry) => {
    if (supabase) {
      const { data, error } = await supabase.functions.invoke('send-enquiry', {
        body: {
          customerName: enquiry.customerName,
          phone: enquiry.phone,
          email: enquiry.email || '',
          enquiryType: enquiry.enquiryType || 'General Enquiry',
          selectedProductOrService: enquiry.selectedProductOrService || '',
          message: enquiry.message,
          website: enquiry.website || ''
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Do not return or store the customer's submitted details here.
      return {
        id: null,
        createdAt: new Date().toISOString(),
        status: 'New'
      };
    }

    // Local-only fallback. Enquiries remain in memory for this browser session,
    // but the persistence effect above prevents saving them to local storage.
    const newEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'New',
      notes: '',
      repairProgress: enquiry.enquiryType?.includes('Repair')
        ? 'Received'
        : 'Not Applicable'
    };

    setDb((previous) => ({
      ...previous,
      enquiries: [newEnquiry, ...(previous.enquiries || [])]
    }));

    return newEnquiry;
  };

  const updateEnquiry = async (id, updates) => {
    if (supabase && (updates.status || updates.notes !== undefined)) {
      const payload = {};

      if (updates.status) {
        payload.internal_status = toSupabaseEnquiryStatus(updates.status);
      }
      if (updates.notes !== undefined) {
        payload.internal_notes = updates.notes;
      }

      const { error } = await supabase
        .from('enquiries')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    }

    setDb((previous) => ({
      ...previous,
      enquiries: (previous.enquiries || []).map((enquiryItem) =>
        enquiryItem.id === id ? { ...enquiryItem, ...updates } : enquiryItem
      )
    }));
  };

  const deleteEnquiry = async (id) => {
    if (supabase) {
      const { error } = await supabase
        .from('enquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    setDb((previous) => ({
      ...previous,
      enquiries: (previous.enquiries || []).filter(
        (enquiryItem) => enquiryItem.id !== id
      )
    }));
  };

  const handleResetData = () => {
    if (!useLocalSampleData) {
      throw new Error('Sample data reset is available only in local development.');
    }

    const fresh = resetDatabase();
    setDb({ ...fresh, enquiries: [] });
  };

  const value = {
    db,
    catalogLoading,
    catalogError,
    offersLoading,
    offersError,
    reloadOffers,
    servicesLoading,
    servicesError,
    reloadServices,
    bannersLoading,
    bannersError,
    reloadBanners,
    enquiriesLoading,
    enquiriesError,
    reloadEnquiries,
    websiteContentLoading,
    websiteContentError,
    reloadWebsiteContent,
    contactSettingsLoading,
    contactSettingsError,
    reloadContactSettings,
    publishedProducts,
    activeOffers,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addBrand,
    updateBrand,
    deleteBrand,
    addOffer,
    updateOffer,
    deleteOffer,
    updateBanners,
    addService,
    updateService,
    deleteService,
    updateWebsiteContent,
    updateContactSettings,
    updateChatbotSettings,
    addEnquiry,
    updateEnquiry,
    deleteEnquiry,
    resetData: handleResetData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}
