import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../services/supabaseClient';

const isPhoneCategory = (slug) => ['mobiles', 'mobile-phones'].includes(slug);
const usesRamAndStorage = (slug) =>
  [...['mobiles', 'mobile-phones'], 'tablets'].includes(slug);

const variantLabelForCategory = (slug) => ({
  tvs: 'Screen Size',
  'cooling-appliances': 'Capacity',
  'kitchen-appliances': 'Capacity',
  watches: 'Dial / Case Size',
  audio: 'Model / Fit',
  'phone-protection': 'Compatible Model',
  storage: 'Capacity',
  accessories: 'Model / Type'
}[slug] || 'Variant Option');

const specificationsForCategory = (slug) => {
  if (isPhoneCategory(slug) || slug === 'tablets') {
    return {
      display: '',
      cpu: '',
      rearCamera: '',
      frontCamera: '',
      batteryCapacity: '',
      operatingSystem: '',
      warranty: '1 Year Brand Warranty'
    };
  }

  if (slug === 'tvs') {
    return {
      screenSize: '',
      resolution: '',
      displayType: '',
      smartPlatform: '',
      audioOutput: '',
      ports: '',
      warranty: ''
    };
  }

  if (slug === 'cooling-appliances') {
    return {
      capacity: '',
      energyRating: '',
      inverter: '',
      refrigerant: '',
      noiseLevel: '',
      warranty: ''
    };
  }

  if (slug === 'kitchen-appliances') {
    return {
      capacity: '',
      power: '',
      functions: '',
      controls: '',
      accessories: '',
      warranty: ''
    };
  }

  if (slug === 'watches') {
    return {
      display: '',
      connectivity: '',
      batteryLife: '',
      waterResistance: '',
      compatibility: '',
      warranty: ''
    };
  }

  if (slug === 'audio') {
    return {
      type: '',
      connectivity: '',
      batteryLife: '',
      noiseCancellation: '',
      microphone: '',
      warranty: ''
    };
  }

  if (slug === 'sim-cards') {
    return {
      network: '',
      planValidity: '',
      dataAllowance: '',
      activationRequirements: ''
    };
  }

  return {
    compatibility: '',
    material: '',
    dimensions: '',
    includedInBox: '',
    warranty: ''
  };
};

export default function AdminProductEditor() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { db, addProduct, updateProduct, catalogLoading, catalogError, offersLoading, offersError, reloadOffers } = useData();

  const categories = Array.isArray(db?.categories) ? db.categories : [];
  const activeOffers = (Array.isArray(db?.offers) ? db.offers : []).filter(
    (offer) => offer.status === 'active'
  );

  const [activeTab, setActiveTab] = useState('basic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    brand: 'Samsung',
    category: 'Mobile Phones',
    categorySlug: 'mobile-phones',
    tagline: '',
    description: '',
    coverImage: '',
    images: [],
    colors: [{ name: 'Black', hex: '#1C1C1E' }],
    ramOptions: ['8GB'],
    storageOptions: ['128GB', '256GB'],
    variantLabel: 'Variant Option',
    variantOptions: [],
    variants: [],
    originalPrice: 29999,
    sellingPrice: 24999,
    stockStatus: 'In Stock',
    badges: [],
    offers: [],
    isFeatured: false,
    isLatestLaunch: false,
    isBestSeller: false,
    status: 'published',
    specsType: 'phone',
    specifications: {
      cpu: '',
      frontCamera: '',
      rearCamera: '',
      display: '',
      batteryCapacity: '',
      chargingSpeed: '',
      operatingSystem: '',
      warranty: '1 Year Brand Warranty'
    },
    highlights: ['']
  });

  const brands = Array.isArray(db?.brands) ? db.brands : [];
  const existingProduct = (Array.isArray(db?.products) ? db.products : []).find((product) => product.id === id);

  // Show active database brands and retain the current brand while editing
  // older products whose brand is inactive or absent from the brands table.
  const brandOptions = [
    ...new Set([
      ...brands
        .filter((brand) => brand.isActive)
        .map((brand) => brand.name)
        .filter(Boolean),
      ...(formData.brand ? [formData.brand] : [])
    ])
  ].sort((a, b) => a.localeCompare(b));

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Load the existing product when editing.
  useEffect(() => {
    if (!isEditMode) return;

    const existing = (db.products || []).find((product) => product.id === id);
    if (!existing) return;

    setFormData({
      ...existing,
      colors: existing.colors || [],
      ramOptions: existing.ramOptions || [],
      storageOptions: existing.storageOptions || [],
      variantLabel:
        existing.variantLabel ||
        variantLabelForCategory(existing.categorySlug),
      variantOptions: [
        ...new Set(
          (existing.variants || [])
            .flatMap((variant) =>
              Object.values(variant.variantAttributes || {})
            )
            .filter(Boolean)
        )
      ],
      variants: existing.variants || [],
      images:
        existing.images ||
        (existing.coverImage ? [existing.coverImage] : []),
      highlights:
        existing.highlights?.length > 0 ? existing.highlights : [''],
      specifications: existing.specifications || {}
    });
  }, [id, isEditMode, db.products]);

  const handleCategoryChange = (event) => {
    const selectedCategory = categories.find(
      (category) => category.name === event.target.value
    );
    const categorySlug = selectedCategory?.slug || 'mobile-phones';

    const specsType = isPhoneCategory(categorySlug)
      ? 'phone'
      : categorySlug === 'tablets'
        ? 'phone'
        : categorySlug === 'tvs'
          ? 'tv'
          : categorySlug === 'audio'
            ? 'audio'
            : categorySlug === 'cooling-appliances'
              ? 'cooling'
              : categorySlug === 'kitchen-appliances'
                ? 'appliance'
                : categorySlug === 'sim-cards'
                  ? 'sim'
                  : 'accessory';

    setFormData((previous) => ({
      ...previous,
      category: event.target.value,
      categorySlug,
      specsType,
      specifications: specificationsForCategory(categorySlug),
      ramOptions: [],
      storageOptions: [],
      variantLabel: variantLabelForCategory(categorySlug),
      variantOptions: [],
      variants: []
    }));
  };

  const handleImageFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSaveError('');

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured for image uploads.');
      }

      for (const file of files) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const filePath = `products/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        setFormData((previous) => ({
          ...previous,
          coverImage: previous.coverImage || publicData.publicUrl,
          images: [...previous.images, publicData.publicUrl]
        }));
      }
    } catch (error) {
      console.error('Could not upload product image:', error);
      setSaveError(error.message || 'Could not upload the image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const imageUrl = newImageUrl.trim();
    if (!imageUrl) return;

    setFormData((previous) => ({
      ...previous,
      coverImage: previous.coverImage || imageUrl,
      images: [...previous.images, imageUrl]
    }));
    setNewImageUrl('');
  };

  const handleAddColor = () => {
    const name = newColorName.trim();
    const hex = newColorHex.trim().toUpperCase();

    if (!name) {
      setSaveError('Enter a color name.');
      return;
    }

    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      setSaveError('Enter a valid six-digit hex code, such as #F1AFB5.');
      return;
    }

    setSaveError('');
    setFormData((previous) => ({
      ...previous,
      colors: [...previous.colors, { name, hex }]
    }));
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const handleRemoveColor = (index) => {
    setFormData((previous) => ({
      ...previous,
      colors: previous.colors.filter((_, colorIndex) => colorIndex !== index)
    }));
  };

  const handleGenerateVariants = () => {
    const colors =
      formData.colors.length > 0
        ? formData.colors
        : [{ name: 'Standard', hex: '#000000' }];

    const hasRamStorage = usesRamAndStorage(formData.categorySlug);
    const ramOptions = (formData.ramOptions || [])
      .map((value) => value.trim())
      .filter(Boolean);
    const storageOptions = (formData.storageOptions || [])
      .map((value) => value.trim())
      .filter(Boolean);
    const customOptions = (formData.variantOptions || [])
      .map((value) => value.trim())
      .filter(Boolean);

    if (hasRamStorage && ramOptions.length === 0) ramOptions.push('');
    if (hasRamStorage && storageOptions.length === 0) storageOptions.push('');
    if (!hasRamStorage && customOptions.length === 0) customOptions.push('');

    const combinations = [];
    const skuTokens = new Set();

    const makeSku = (color, ram, storage, attributes) => {
      const text = [
        formData.slug || formData.name || 'PRODUCT',
        color,
        ram,
        storage,
        ...Object.values(attributes)
      ]
        .filter(Boolean)
        .join('-')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);

      let sku = `${text || 'PRODUCT'}-${
        crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8)
          : Date.now().toString(36)
      }`;

      while (skuTokens.has(sku)) sku += 'X';
      skuTokens.add(sku);
      return sku;
    };

    colors.forEach((color) => {
      (hasRamStorage ? ramOptions : ['']).forEach((ram) => {
        (hasRamStorage ? storageOptions : customOptions).forEach((option) => {
          const storage = hasRamStorage ? option : '';
          const variantAttributes =
            !hasRamStorage && option
              ? {
                  [formData.variantLabel ||
                  variantLabelForCategory(formData.categorySlug)]: option
                }
              : {};

          combinations.push({
            color: color.name,
            colorHex: String(color.hex || '').trim().toUpperCase(),
            ram,
            storage,
            variantAttributes,
            sellingPrice: formData.sellingPrice,
            originalPrice: formData.originalPrice,
            stockStatus: 'In Stock',
            sku: makeSku(color.name, ram, storage, variantAttributes)
          });
        });
      });
    });

    setFormData((previous) => ({ ...previous, variants: combinations }));
  };

  const handleHighlightChange = (index, value) => {
    setFormData((previous) => {
      const highlights = [...previous.highlights];
      highlights[index] = value;
      return { ...previous, highlights };
    });
  };

  const handleAddHighlight = () => {
    setFormData((previous) => ({
      ...previous,
      highlights: [...previous.highlights, '']
    }));
  };

  const handleRemoveHighlight = (index) => {
    setFormData((previous) => ({
      ...previous,
      highlights: previous.highlights.filter(
        (_, highlightIndex) => highlightIndex !== index
      )
    }));
  };

  const handleSaveProduct = async (targetStatus = formData.status) => {
    setSaveError('');
    setSaveSuccess(false);

    const normalizedColors = (Array.isArray(formData.colors) ? formData.colors : [])
      .map((color) => ({
        ...color,
        name: String(color.name || '').trim(),
        hex: String(color.hex || '').trim().toUpperCase()
      }));

    const hexByColorName = new Map(
      normalizedColors.map((color) => [color.name.toLowerCase(), color.hex])
    );

    const normalizedVariants = (Array.isArray(formData.variants) ? formData.variants : [])
      .map((variant) => {
        const colorName = String(variant.color || '').trim();
        const matchingHex = hexByColorName.get(colorName.toLowerCase());

        return {
          ...variant,
          color: colorName,
          colorHex: String(matchingHex || variant.colorHex || '').trim().toUpperCase()
        };
      });

    const invalidColor =
      normalizedColors.some(
        (color) => !color.name || !/^#[0-9A-F]{6}$/.test(color.hex)
      ) ||
      normalizedVariants.some(
        (variant) => !variant.color || !/^#[0-9A-F]{6}$/.test(variant.colorHex)
      );

    if (invalidColor) {
      setSaveError(
        'Every product colour and variant needs a valid six-digit hex code, such as #F1AFB5. Regenerate the variant matrix after changing colours.'
      );
      return;
    }

    setIsSaving(true);

    const productPayload = {
      ...formData,
      colors: normalizedColors,
      variants: normalizedVariants,
      status: targetStatus,
      sellingPrice: Number(formData.sellingPrice),
      originalPrice: Number(formData.originalPrice),
      slug:
        formData.slug ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
    };

    try {
      if (isEditMode) {
        await updateProduct(id, productPayload);
      } else {
        await addProduct(productPayload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        navigate('/store-owner-7f3c9a2e6b41d805/products');
      }, 800);
    } catch (error) {
      console.error('Could not save product:', error);
      setSaveError(
        error.message || 'Could not save the product. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (catalogLoading) {
    return (
      <div className="admin-product-editor pb-5">
        <div className="card p-5 text-center border rounded-4 bg-white shadow-sm" role="status">
          <div className="spinner-border text-danger mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted mb-0">Loading product catalogue…</p>
        </div>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="admin-product-editor pb-5">
        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
          <span>{catalogError}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
        <Link to="/store-owner-7f3c9a2e6b41d805/products" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">
          <ArrowLeft size={16} /> Back to products
        </Link>
      </div>
    );
  }

  if (isEditMode && !existingProduct) {
    return (
      <div className="admin-product-editor pb-5">
        <div className="card p-5 text-center border rounded-4 bg-white shadow-sm">
          <h3 className="fw-bold text-dark fs-5 mb-2">Product not found</h3>
          <p className="text-muted mb-4">This product may have been removed or the address may be incorrect.</p>
          <div>
            <Link to="/store-owner-7f3c9a2e6b41d805/products" className="btn btn-brand-primary btn-sm d-inline-flex align-items-center gap-2">
              <ArrowLeft size={16} /> Back to products
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="admin-product-editor pb-5">
      <div
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 bg-white p-3 rounded-3 border shadow-sm"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/store-owner-7f3c9a2e6b41d805/products"
            className="btn btn-light btn-sm p-2 rounded-circle"
            title="Back to products list"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-0 fs-5">
              {isEditMode
                ? `Edit: ${formData.name || 'Product'}`
                : 'Add New Product'}
            </h3>
            <small className="text-muted">
              {isEditMode
                ? `ID: ${id}`
                : 'Create a new catalogue item with custom variants'}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleSaveProduct('draft')}
            disabled={isSaving}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="btn btn-brand-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => handleSaveProduct('published')}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>
              {isSaving
                ? 'Saving…'
                : isEditMode
                  ? 'Update & Publish'
                  : 'Publish Product'}
            </span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 shadow-sm mb-4" role="status">
          <CheckCircle2 size={20} />
          <span>
            Product successfully saved and synchronized to public website!
            Redirecting…
          </span>
        </div>
      )}

      {saveError && (
        <div className="alert alert-danger" role="alert">
          {saveError}
        </div>
      )}

      <div
        className="card border rounded-4 bg-white shadow-sm overflow-hidden"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="border-bottom bg-light px-3 pt-2">
          <ul
            className="nav nav-tabs border-0 flex-nowrap overflow-x-auto"
            style={{ whiteSpace: 'nowrap' }}
          >
            {[
              { id: 'basic', label: '1. Basic Details' },
              { id: 'images', label: '2. Images' },
              { id: 'variants', label: '3. Colours & Variants' },
              { id: 'pricing', label: '4. Pricing & Stock' },
              { id: 'specs', label: '5. Specifications' },
              { id: 'highlights', label: '6. What Makes It Special' },
              { id: 'offers', label: '7. Offers' },
              { id: 'visibility', label: '8. Visibility' }
            ].map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 fw-semibold px-3 py-2 ${
                    activeTab === tab.id
                      ? 'active text-danger border-bottom border-danger border-3 bg-white'
                      : 'text-muted'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          {activeTab === 'basic' && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Product Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Samsung Galaxy S24 5G"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      name: event.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Model Code / Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SM-S921B"
                  value={formData.model}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      model: event.target.value
                    }))
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Brand *
                </label>
                <select
                  className="form-select"
                  value={formData.brand}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      brand: event.target.value
                    }))
                  }
                  required
                >
                  <option value="">Select a brand</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                {brandOptions.length === 0 && (
                  <small className="text-danger">
                    No brands are available. Add a brand in Categories &amp;
                    Brands first.
                  </small>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Category *
                </label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-dark">
                  Short Tagline
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Galaxy AI is here - Flagship Compact Performance"
                  value={formData.tagline}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      tagline: event.target.value
                    }))
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-dark">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  className="form-control"
                  placeholder="Detailed description of features, display, battery, and camera..."
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      description: event.target.value
                    }))
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <h6 className="fw-bold mb-3">Product Photos &amp; Cover Image</h6>

              <div className="p-4 border rounded-3 bg-light text-center mb-4">
                <Upload size={32} className="text-danger mb-2" />
                <h6 className="fw-bold mb-1">Upload Local Image Files</h6>
                <p className="text-muted small mb-3">
                  Uploaded images are stored in <strong>Supabase Storage</strong>{' '}
                  and linked to this product when you save it.
                </p>
                <label className="btn btn-brand-primary btn-sm px-4 cursor-pointer">
                  <span>Browse Photos from Computer</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageFileUpload}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-dark">
                  Or Add Image Web URL
                </label>
                <div className="input-group">
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    placeholder="https://example.com/phone.jpg"
                    value={newImageUrl}
                    onChange={(event) => setNewImageUrl(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleAddImageUrl}
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="row g-3">
                {formData.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="col-6 col-sm-4 col-md-3">
                    <div className="card p-2 border position-relative">
                      <img
                        src={image}
                        alt={`Product photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '140px',
                          objectFit: 'contain'
                        }}
                      />
                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                        <button
                          type="button"
                          className={`btn btn-sm p-1 ${
                            formData.coverImage === image
                              ? 'btn-danger'
                              : 'btn-light'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                          onClick={() =>
                            setFormData((previous) => ({
                              ...previous,
                              coverImage: image
                            }))
                          }
                        >
                          {formData.coverImage === image
                            ? 'Cover Photo'
                            : 'Make Cover'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1 border-0"
                          aria-label={`Remove photo ${index + 1}`}
                          onClick={() =>
                            setFormData((previous) => {
                              const images = previous.images.filter(
                                (_, imageIndex) => imageIndex !== index
                              );

                              return {
                                ...previous,
                                images,
                                coverImage:
                                  previous.coverImage === image
                                    ? images[0] || ''
                                    : previous.coverImage
                              };
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div>
              <h6 className="fw-bold mb-3">Colours &amp; Variant Matrix</h6>

              <div className="card p-3 border mb-4 bg-light">
                <h6 className="fw-bold small mb-3 text-dark">
                  Product Colours (Hex Codes)
                </h6>

                <div className="d-flex flex-column gap-2 mb-3">
                  {formData.colors.map((color, index) => (
                    <div
                      key={`${color.name}-${index}`}
                      className="d-flex align-items-center gap-2 flex-wrap"
                    >
                      <span
                        className="rounded-circle border"
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(color.hex || '')
                            ? color.hex
                            : '#FFFFFF'
                        }}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ maxWidth: '190px' }}
                        value={color.name}
                        aria-label="Color name"
                        onChange={(event) => {
                          setFormData((previous) => {
                            const colors = [...previous.colors];
                            colors[index] = {
                              ...colors[index],
                              name: event.target.value
                            };
                            return { ...previous, colors };
                          });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ maxWidth: '130px' }}
                        placeholder="#F1AFB5"
                        value={color.hex || ''}
                        maxLength={7}
                        aria-label={`Hex code for ${color.name}`}
                        onChange={(event) => {
                          const hex = event.target.value.toUpperCase();
                          setFormData((previous) => {
                            const colors = [...previous.colors];
                            colors[index] = { ...colors[index], hex };
                            return { ...previous, colors };
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveColor(index)}
                        aria-label={`Remove ${color.name} color`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Color name (e.g. Rose Pink)"
                    style={{ maxWidth: '220px' }}
                    value={newColorName}
                    onChange={(event) => setNewColorName(event.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="#F1AFB5"
                    style={{ maxWidth: '130px' }}
                    value={newColorHex}
                    onChange={(event) =>
                      setNewColorHex(event.target.value.toUpperCase())
                    }
                    maxLength={7}
                    aria-label="New color hex code"
                  />
                  <button
                    type="button"
                    className="btn btn-brand-primary btn-sm px-3"
                    onClick={handleAddColor}
                  >
                    Add Colour
                  </button>
                </div>

                <small className="text-muted d-block mt-2">
                  Enter a six-digit hex code including #, for example #F1AFB5.
                </small>
              </div>
              {usesRamAndStorage(formData.categorySlug) ? (
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">
                      RAM Sizes (Comma-separated)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. 6GB, 8GB, 12GB"
                      value={(formData.ramOptions || []).join(', ')}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          ramOptions: event.target.value.split(',')
                        }))
                      }
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-dark">
                      Storage Sizes (Comma-separated)
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. 128GB, 256GB, 512GB"
                      value={(formData.storageOptions || []).join(', ')}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          storageOptions: event.target.value.split(',')
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="form-label small fw-bold text-dark">
                    {formData.variantLabel || 'Variant Options'} (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. 43 inch, 55 inch, 65 inch"
                    value={(formData.variantOptions || []).join(', ')}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        variantOptions: event.target.value.split(',')
                      }))
                    }
                  />
                  <small className="text-muted">
                    Enter the options customers can choose for this category.
                  </small>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0">Valid Variant Combinations</h6>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={handleGenerateVariants}
                >
                  <Sliders size={14} />
                  <span>Generate Matrix from Colours &amp; Options</span>
                </button>
              </div>

              {formData.variants?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>Colour</th>
                        <th>
                          {usesRamAndStorage(formData.categorySlug)
                            ? 'RAM / Storage'
                            : 'Variant'}
                        </th>
                        <th>Selling Price (₹)</th>
                        <th>Original Price (₹)</th>
                        <th>Stock Status</th>
                        <th>SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((variant, index) => (
                        <tr key={variant.sku || index}>
                          <td className="fw-bold">{variant.color}</td>
                          <td>
                            {usesRamAndStorage(formData.categorySlug)
                              ? `${variant.ram ? `${variant.ram} + ` : ''}${
                                  variant.storage || 'Standard'
                                }`
                              : Object.values(
                                  variant.variantAttributes || {}
                                ).join(' / ') || 'Standard'}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={variant.sellingPrice}
                              onChange={(event) =>
                                setFormData((previous) => {
                                  const variants = [...previous.variants];
                                  variants[index] = {
                                    ...variants[index],
                                    sellingPrice: Number(event.target.value)
                                  };
                                  return { ...previous, variants };
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={variant.originalPrice}
                              onChange={(event) =>
                                setFormData((previous) => {
                                  const variants = [...previous.variants];
                                  variants[index] = {
                                    ...variants[index],
                                    originalPrice: Number(event.target.value)
                                  };
                                  return { ...previous, variants };
                                })
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={variant.stockStatus}
                              onChange={(event) =>
                                setFormData((previous) => {
                                  const variants = [...previous.variants];
                                  variants[index] = {
                                    ...variants[index],
                                    stockStatus: event.target.value
                                  };
                                  return { ...previous, variants };
                                })
                              }
                            >
                              <option value="In Stock">In Stock</option>
                              <option value="Out of Stock">Out of Stock</option>
                            </select>
                          </td>
                          <td className="text-muted">{variant.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-light border small text-muted">
                  No variant matrix generated yet. Enter this category&apos;s
                  options and click the button to create the combinations.
                </div>
              )}
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Base Selling Price (₹) *
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.sellingPrice}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      sellingPrice: event.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Base Original Price (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Crossed out if higher than selling price"
                  value={formData.originalPrice}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      originalPrice: event.target.value
                    }))
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">
                  Default Stock Availability
                </label>
                <select
                  className="form-select"
                  value={formData.stockStatus}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      stockStatus: event.target.value
                    }))
                  }
                >
                  <option value="In Stock">
                    In Stock (Available for Store Pickup)
                  </option>
                  <option value="Out of Stock">
                    Out of Stock (Awaiting Consignment)
                  </option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h6 className="fw-bold mb-3">
                Technical Specifications (
                {formData.specsType?.toUpperCase() || 'GENERAL'})
              </h6>

              {formData.specsType === 'phone' ? (
                <div className="row g-3">
                  {[
                    {
                      key: 'display',
                      label: 'Display',
                      placeholder: 'e.g. 6.7 inch 120Hz AMOLED'
                    },
                    {
                      key: 'cpu',
                      label: 'Processor / CPU',
                      placeholder: 'e.g. Snapdragon 8 Gen 3'
                    },
                    {
                      key: 'rearCamera',
                      label: 'Rear Camera',
                      placeholder: 'e.g. 50MP OIS + 12MP Ultra-wide'
                    },
                    {
                      key: 'frontCamera',
                      label: 'Front Camera',
                      placeholder: 'e.g. 32MP Eye-AF Selfie'
                    },
                    {
                      key: 'batteryCapacity',
                      label: 'Battery & Charging',
                      placeholder: 'e.g. 5000 mAh, 80W Fast Charge'
                    },
                    {
                      key: 'operatingSystem',
                      label: 'Operating System',
                      placeholder: 'e.g. Android 14'
                    }
                  ].map((field) => (
                    <div key={field.key} className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-dark">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.specifications?.[field.key] || ''}
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            specifications: {
                              ...previous.specifications,
                              [field.key]: event.target.value
                            }
                          }))
                        }
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="row g-3">
                  {Object.keys(
                    specificationsForCategory(formData.categorySlug)
                  ).map((key) => (
                    <div key={key} className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-dark text-capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.specifications?.[key] || ''}
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            specifications: {
                              ...previous.specifications,
                              [key]: event.target.value
                            }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'highlights' && (
            <div>
              <h6 className="fw-bold mb-3">
                Concise Highlights &amp; Bullet Points
              </h6>
              <div className="d-flex flex-column gap-2 mb-3">
                {formData.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="d-flex align-items-center gap-2"
                  >
                    <span className="text-danger fw-bold">★</span>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Flagship camera with optical image stabilization"
                      value={highlight}
                      onChange={(event) =>
                        handleHighlightChange(index, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm p-1"
                      onClick={() => handleRemoveHighlight(index)}
                      aria-label="Remove highlight"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                onClick={handleAddHighlight}
              >
                <Plus size={14} /> Add Highlight Bullet
              </button>
            </div>
          )}

          {activeTab === 'offers' && (
            <div>
              <h6 className="fw-bold mb-3">
                Attach Store Offers &amp; Financing
              </h6>
              <p className="text-muted small mb-3">
                Check eligible promotions that should display on this product&apos;s
                page.
              </p>
              <div className="d-flex flex-column gap-2">
                {offersLoading ? (
                  <p className="small text-muted mb-0" role="status">Loading current offers…</p>
                ) : offersError ? (
                  <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-0" role="alert">
                    <span>{offersError}</span>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void reloadOffers()}>Try again</button>
                  </div>
                ) : activeOffers.map((offer) => {
                  const isChecked = formData.offers?.includes(offer.id);

                  return (
                    <label
                      key={offer.id}
                      className="card p-3 border cursor-pointer d-flex flex-row align-items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={isChecked}
                        onChange={() =>
                          setFormData((previous) => {
                            const selectedOffers = previous.offers || [];
                            const offers = isChecked
                              ? selectedOffers.filter(
                                  (offerId) => offerId !== offer.id
                                )
                              : [...selectedOffers, offer.id];

                            return { ...previous, offers };
                          })
                        }
                      />
                      <div>
                        <div className="fw-bold text-dark small">
                          {offer.title}
                        </div>
                        <span className="badge bg-light text-dark border small">
                          {offer.type}
                        </span>
                        <small className="text-muted ms-2">
                          {offer.provider}
                        </small>
                      </div>
                    </label>
                  );
                })}
                {!offersLoading && !offersError && activeOffers.length === 0 && (
                  <div className="text-muted small">
                    No active offers are available.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="card p-4 border bg-light rounded-3">
                  <h6 className="fw-bold mb-3 text-dark">
                    Publishing Status
                  </h6>
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="statusSwitch"
                      checked={formData.status === 'published'}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          status: event.target.checked ? 'published' : 'draft'
                        }))
                      }
                    />
                    <label
                      className="form-check-label fw-semibold"
                      htmlFor="statusSwitch"
                    >
                      {formData.status === 'published'
                        ? 'Published (Live on Website)'
                        : 'Draft (Hidden from Store)'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card p-4 border bg-light rounded-3">
                  <h6 className="fw-bold mb-3 text-dark">Featured Badges</h6>

                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="latestLaunchSwitch"
                      checked={formData.isLatestLaunch}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          isLatestLaunch: event.target.checked
                        }))
                      }
                    />
                    <label
                      className="form-check-label small fw-semibold"
                      htmlFor="latestLaunchSwitch"
                    >
                      Mark as Latest Launch (Shows on Home &amp; Filter)
                    </label>
                  </div>

                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="bestSellerSwitch"
                      checked={formData.isBestSeller}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          isBestSeller: event.target.checked
                        }))
                      }
                    />
                    <label
                      className="form-check-label small fw-semibold"
                      htmlFor="bestSellerSwitch"
                    >
                      Mark as Best Seller (Shows in Best Sellers grid)
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="featuredSwitch"
                      checked={formData.isFeatured}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          isFeatured: event.target.checked
                        }))
                      }
                    />
                    <label
                      className="form-check-label small fw-semibold"
                      htmlFor="featuredSwitch"
                    >
                      Featured Item (Boosts search ranking)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



