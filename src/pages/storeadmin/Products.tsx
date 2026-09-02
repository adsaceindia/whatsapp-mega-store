import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Trash2, Edit2, Download, X, ArrowUpDown, ArrowUp, ArrowDown, Settings, Tag, Upload, Search } from 'lucide-react';
import { getProducts, addProduct, deleteProduct, updateProduct, Product } from '../../services/productService';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { getOrders, Order } from '../../services/orderService';
import { getWishlistStats } from '../../services/wishlistService';
import { getCurrencySymbol } from '../../utils/currency';
import { useUserRole } from '../../hooks/useUserRole';
import { ImageUploader } from '../../components/ImageUploader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getCategories, addCategory, updateCategory, deleteCategory, Category } from '../../services/categoryService';

export function Products() {
  const { isAdmin } = useUserRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistStats, setWishlistStats] = useState<{ [productId: string]: number }>({});
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom delete confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialProductState: Partial<Product> = {
    title: '',
    category: '',
    price: 0,
    originalPrice: 0,
    inventoryQuantity: 0,
    cost: 0,
    image: '',
    images: [],
    description: '',
    keySpecs: '',
    features: '',
    sizes: [],
    colors: [],
    active: true,
    spotlight: false,
    variantPrices: {}
  };

  const [newProduct, setNewProduct] = useState<Partial<Product>>(initialProductState);
  
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  // Category Manager State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatImage, setEditingCatImage] = useState('');

  // Bulk Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'completed' | 'error'>('idle');
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [importingProgress, setImportingProgress] = useState(0);
  const [totalImporting, setTotalImporting] = useState(0);
  const [importFileName, setImportFileName] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const fetchCategoriesList = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  };

  useEffect(() => {
    fetchProductsAndOrders();
    fetchCategoriesList();
    getGeneralSettings().then(setSettings).catch(console.error);
  }, []);

  const fetchProductsAndOrders = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData, wishlistData] = await Promise.all([
        getProducts(),
        getOrders(),
        getWishlistStats()
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setWishlistStats(wishlistData);
    } catch (error) {
      console.error("Error fetching products and orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = () => {
    fetchProductsAndOrders();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price || !newProduct.image || !newProduct.category) return;
    
    try {
      if (newProduct.spotlight) {
        // Reset other spotlight products
        const otherSpotlights = products.filter(p => p.spotlight);
        for (const p of otherSpotlights) {
          if (p.id) {
            await updateProduct(p.id, { spotlight: false });
          }
        }
      }
      await addProduct(newProduct as Omit<Product, 'id'>);
      setIsAdding(false);
      setNewProduct(initialProductState);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    try {
      if (newProduct.spotlight) {
        // Reset other spotlight products
        const otherSpotlights = products.filter(p => p.spotlight && p.id !== editingId);
        for (const p of otherSpotlights) {
          if (p.id) {
            await updateProduct(p.id, { spotlight: false });
          }
        }
      }
      await updateProduct(editingId, newProduct);
      setIsAdding(false);
      setEditingId(null);
      setNewProduct(initialProductState);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setNewProduct({
      ...product,
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || []
    });
    setEditingId(product.id || null);
    setIsAdding(true);
  };

  const escapeCSVValue = (val: any) => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val);
    const escaped = stringVal.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const handleDownloadCSV = () => {
    if (products.length === 0) return;
    
    const headers = ["ID", "Title", "Category", "Cost Price", "Selling Price", "Original Price", "Inventory", "Active Status", "Image URL"];
    const csvRows = [headers.join(",")];
    
    products.forEach(p => {
      const row = [
        escapeCSVValue(p.id),
        escapeCSVValue(p.title),
        escapeCSVValue(p.category),
        escapeCSVValue(p.cost || 0),
        escapeCSVValue(p.price),
        escapeCSVValue(p.originalPrice || ''),
        escapeCSVValue(p.inventoryQuantity || 0),
        escapeCSVValue(p.active !== false ? 'Active' : 'Inactive'),
        escapeCSVValue(p.image)
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 compliance!
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadXLS = () => {
    if (products.length === 0) return;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Products List</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #059669; color: white; font-weight: bold; padding: 5px; border: 0.5px solid #ccc; }
          td { border: 0.5px solid #ccc; padding: 5px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Original Price</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Image URL</th>
            </tr>
          </thead>
          <tbody>
    `;

    products.forEach(p => {
      html += `
        <tr>
          <td>${p.id || ''}</td>
          <td>${p.title || ''}</td>
          <td>${p.category || ''}</td>
          <td>${p.cost || 0}</td>
          <td>${p.price || 0}</td>
          <td>${p.originalPrice || ''}</td>
          <td>${p.inventoryQuantity || 0}</td>
          <td>${p.active !== false ? 'Active' : 'Inactive'}</td>
          <td>${p.image || ''}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCategory({ name: newCatName.trim(), image: newCatImage.trim(), active: true, productCount: 0, sortOrder: 0 });
      setNewCatName('');
      setNewCatImage('');
      await fetchCategoriesList();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategoryClick = (cat: Category) => {
    setEditingCatId(cat.id || null);
    setEditingCatName(cat.name);
    setEditingCatImage(cat.image || '');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId || !editingCatName.trim()) return;
    try {
      await updateCategory(editingCatId, { name: editingCatName.trim(), image: editingCatImage.trim() });
      setEditingCatId(null);
      setEditingCatName('');
      setEditingCatImage('');
      await fetchCategoriesList();
      fetchProductsAndOrders();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? Products belonging to this category will have their category field cleared.`)) {
      return;
    }
    try {
      await deleteCategory(id);
      await fetchCategoriesList();
      fetchProductsAndOrders();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const headers = ["Title", "Category", "Selling Price", "Cost Price", "Original Price", "Inventory", "Image URL", "Description", "Sizes", "Colors"];
    const rows = [
      headers.join(","),
      `"Premium Silk Dress","Fashion","89.99","35.00","120.00","20","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600","Handcrafted premium silk dress with custom waist tie","S, M, L","Red, Emerald, Black"`,
      `"Leather Ankle Boots","Footwear","145.00","60.00","180.00","12","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600","Durable full grain leather autumn footwear","8, 9, 10, 11","Brown, Black"`,
      `"Classic Coffee Mug","Kitchenware","18.50","5.20","24.00","50","https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600","Ceramic minimalist coffee mug","One Size","White, Grey, Navy"`
    ];
    const csvContent = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "boutique_products_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const robustParseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF
        }
        row.push(currentField.trim());
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          lines.push(row);
        }
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField || row.length > 0) {
      row.push(currentField.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
        lines.push(row);
      }
    }

    return lines;
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportStatus('parsing');
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("Could not read file or file is empty");
        }

        const rows = robustParseCSV(text);
        if (rows.length < 2) {
          throw new Error("CSV file must have a header row and at least one data row");
        }

        const rawHeaders = rows[0];
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        // Identify key column indices
        const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name') || h.includes('item'));
        const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type') || h.includes('class') || h.includes('group'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('selling') || h.includes('rate') || h.includes('mrp'));
        const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('purchase') || h.includes('buying'));
        const originalPriceIdx = headers.findIndex(h => h.includes('original') || h.includes('old') || h.includes('compare'));
        const qtyIdx = headers.findIndex(h => h.includes('inventory') || h.includes('quantity') || h.includes('qty') || h.includes('stock') || h.includes('count'));
        const imageIdx = headers.findIndex(h => h.includes('image') || h.includes('url') || h.includes('photo') || h.includes('pic') || h.includes('picture'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('about') || h.includes('detail'));
        const sizesIdx = headers.findIndex(h => h.includes('size'));
        const colorsIdx = headers.findIndex(h => h.includes('color'));

        if (titleIdx === -1) {
          throw new Error("Could not locate a 'Title' or 'Name' column in your CSV. Please check the headers.");
        }

        const items: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Skip empty lines
          if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

          const title = row[titleIdx] || '';
          const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx] : 'Uncategorized';
          const rawPrice = priceIdx !== -1 ? row[priceIdx] : '0';
          const price = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
          
          const rawCost = costIdx !== -1 ? row[costIdx] : '0';
          const cost = parseFloat(rawCost.replace(/[^0-9.]/g, '')) || 0;

          const rawOriginalPrice = originalPriceIdx !== -1 ? row[originalPriceIdx] : '';
          const originalPrice = rawOriginalPrice ? (parseFloat(rawOriginalPrice.replace(/[^0-9.]/g, '')) || undefined) : undefined;

          const rawQty = qtyIdx !== -1 ? row[qtyIdx] : '0';
          const inventoryQuantity = parseInt(rawQty.replace(/[^0-9]/g, ''), 10) || 0;

          const image = imageIdx !== -1 && row[imageIdx] ? row[imageIdx] : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60';
          const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : '';
          
          const sizes = sizesIdx !== -1 && row[sizesIdx] 
            ? row[sizesIdx].split(',').map((s: string) => s.trim()).filter(Boolean) 
            : [];
          const colors = colorsIdx !== -1 && row[colorsIdx] 
            ? row[colorsIdx].split(',').map((c: string) => c.trim()).filter(Boolean) 
            : [];

          const rowError: string[] = [];
          if (!title.trim()) {
            rowError.push("Missing Title");
          }
          if (isNaN(price) || price <= 0) {
            rowError.push("Invalid Selling Price");
          }

          if (rowError.length > 0) {
            errors.push(`Row ${i + 1}: ${rowError.join(', ')}`);
          }

          items.push({
            title: title.trim(),
            category: category.trim(),
            price,
            cost,
            originalPrice,
            inventoryQuantity,
            image: image.trim(),
            description: description.trim(),
            sizes,
            colors,
            active: true,
            spotlight: false,
            sale: originalPrice ? originalPrice > price : false,
            rowNum: i + 1,
            isValid: rowError.length === 0
          });
        }

        setParsedProducts(items);
        setImportErrors(errors);
        setImportStatus('preview');
      } catch (err: any) {
        setImportErrors([err.message || "An unexpected error occurred during parsing"]);
        setImportStatus('error');
      }
    };

    reader.onerror = () => {
      setImportErrors(["Failed to read file"]);
      setImportStatus('error');
    };

    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    const validItems = parsedProducts.filter(p => p.isValid);
    if (validItems.length === 0) return;

    setImportStatus('importing');
    setTotalImporting(validItems.length);
    setImportingProgress(0);

    const uniqueNewCategories = new Set<string>();

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      try {
        // Prepare product for insertion (remove temp attributes like rowNum, isValid)
        const productPayload: Omit<Product, 'id'> = {
          title: item.title,
          category: item.category,
          price: item.price,
          cost: item.cost,
          originalPrice: item.originalPrice,
          inventoryQuantity: item.inventoryQuantity,
          image: item.image,
          description: item.description,
          sizes: item.sizes,
          colors: item.colors,
          active: item.active,
          spotlight: item.spotlight,
          sale: item.sale
        };

        await addProduct(productPayload);
        
        // Track unique categories imported
        if (item.category && item.category !== 'Uncategorized') {
          uniqueNewCategories.add(item.category);
        }

        setImportingProgress(i + 1);
      } catch (err) {
        console.error(`Failed to import product on row ${item.rowNum}:`, err);
      }
    }

    // Register categories that do not exist in standard categories collection
    try {
      const currentCatNames = new Set(categories.map(c => c.name));
      for (const catName of uniqueNewCategories) {
        if (!currentCatNames.has(catName)) {
          await addCategory({ 
            name: catName, 
            image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60",
            active: true,
            productCount: 0,
            sortOrder: 0
          });
        }
      }
    } catch (e) {
      console.error("Error auto-creating category during bulk import:", e);
    }

    // Refresh everything
    await fetchCategoriesList();
    await fetchProductsAndOrders();

    setImportStatus('completed');
  };

  const addSize = () => {
    if (newSize.trim() !== '') {
      setNewProduct(prev => ({ ...prev, sizes: [...(prev.sizes || []), newSize.trim()] }));
      setNewSize('');
    }
  };

  const removeSize = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      sizes: (prev.sizes || []).filter((_, i) => i !== index)
    }));
  };

  const addColor = () => {
    if (newColor.trim() !== '') {
      setNewProduct(prev => ({ ...prev, colors: [...(prev.colors || []), newColor.trim()] }));
      setNewColor('');
    }
  };

  const totalExpectedRevenue = products.reduce((sum, p) => sum + ((p.price - (p.cost || 0)) * (p.inventoryQuantity || 0)), 0);

  const symbol = getCurrencySymbol(settings?.currency);

  const productStats = useMemo(() => {
    const stats: { [key: string]: { volume: number, orderCount: number, monthlyAvg: number } } = {};

    products.forEach(p => {
      if (p.id) {
        stats[p.id] = { volume: 0, orderCount: 0, monthlyAvg: 0 };
      }
    });

    let earliestDate = new Date();
    let hasOrders = false;

    orders.forEach(order => {
      if (order.createdAt) {
        const d = new Date(order.createdAt);
        if (d < earliestDate) {
          earliestDate = d;
        }
        hasOrders = true;
      }
    });

    const today = new Date();
    let storeAgeMonths = 1;
    if (hasOrders) {
      const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      storeAgeMonths = Math.max(1, diffDays / 30.41);
    }

    orders.forEach(order => {
      const productsInThisOrder = new Set<string>();

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const pId = item.productId || item.id;
          if (pId && stats[pId] !== undefined) {
            stats[pId].volume += (item.quantity || 1);
            productsInThisOrder.add(pId);
          } else if (item.title) {
            const matchedProd = products.find(p => p.title.toLowerCase() === item.title.toLowerCase());
            if (matchedProd && matchedProd.id) {
              stats[matchedProd.id].volume += (item.quantity || 1);
              productsInThisOrder.add(matchedProd.id);
            }
          }
        });
      }

      productsInThisOrder.forEach(pId => {
        if (stats[pId]) {
          stats[pId].orderCount += 1;
        }
      });
    });

    Object.keys(stats).forEach(pId => {
      stats[pId].monthlyAvg = stats[pId].orderCount / storeAgeMonths;
    });

    return stats;
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategoryFilter || p.category === selectedCategoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  const sortedProducts = useMemo(() => {
    if (!sortDirection) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      const volA = (a.id && productStats[a.id]?.volume) || 0;
      const volB = (b.id && productStats[b.id]?.volume) || 0;

      if (sortDirection === 'asc') {
        return volA - volB;
      } else {
        return volB - volA;
      }
    });
  }, [filteredProducts, sortDirection, productStats]);

  const removeColor = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== index)
    }));
  };

  const updateAngleImage = (index: number, val: string) => {
    const currentImages = [...(newProduct.images || [])];
    while (currentImages.length <= index) {
      currentImages.push('');
    }
    currentImages[index] = val;
    setNewProduct(prev => ({ ...prev, images: currentImages }));
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your store inventory. <span className="font-semibold text-green-600 ml-2">Total Expected Revenue (Profit): {symbol}{totalExpectedRevenue.toFixed(2)}</span></p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button 
            onClick={handleDownloadCSV}
            className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            title="Download CSV report of your inventory"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={handleDownloadXLS}
            className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            title="Download Excel report of your inventory"
          >
            <Download size={16} />
            Export Excel (XLS)
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => setIsManagingCategories(true)}
                className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Tag size={16} />
                Manage Categories
              </button>
              <button 
                onClick={() => {
                  setIsImporting(true);
                  setImportStatus('idle');
                  setParsedProducts([]);
                  setImportErrors([]);
                  setImportFileName('');
                }}
                className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                title="Bulk import products from CSV"
              >
                <Upload size={16} />
                Bulk Import
              </button>
              <button 
                onClick={() => {
                  setIsAdding(true);
                  setEditingId(null);
                  setNewProduct(initialProductState);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={20} />
                Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8 max-w-5xl">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Info</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Title *</label>
                <input required type="text" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-gray-900">Category *</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManagingCategories(true)} 
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={12} /> Manage Categories
                  </button>
                </div>
                <select 
                  required 
                  value={newProduct.category || ''} 
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="" disabled>Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {/* Append dynamic product categories just in case */}
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean)))
                    .filter(cat => !categories.some(c => c.name === cat))
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  }
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Price ({symbol}) *</label>
                  <input required type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Original Price ({symbol})</label>
                  <input type="number" step="0.01" min="0" value={newProduct.originalPrice || ''} onChange={e => setNewProduct({...newProduct, originalPrice: parseFloat(e.target.value) || undefined})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Cost ({symbol}) - Admin Only</label>
                  <input type="number" step="0.01" min="0" value={newProduct.cost || ''} onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value) || 0})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Inventory Quantity</label>
                  <input type="number" min="0" value={newProduct.inventoryQuantity ?? ''} onChange={e => setNewProduct({...newProduct, inventoryQuantity: parseInt(e.target.value) || 0})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. 100" />
                </div>
              </div>
              <div>
                <ImageUploader 
                  label="Primary Product Image *" 
                  required 
                  value={newProduct.image || ''} 
                  onChange={val => setNewProduct({...newProduct, image: val})} 
                />
              </div>
              <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
                <label className="block text-sm font-bold text-on-surface mb-3">
                  Additional Product Images (At least 3-5 images for different angles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div key={index} className="w-full aspect-square">
                      <ImageUploader 
                        label={`Angle ${index + 1}`} 
                        value={(newProduct.images || [])[index] || ''} 
                        onChange={val => updateAngleImage(index, val)} 
                        compact
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                  Display multiple views of your product (e.g. Front, Back, Side, Top, Detail). These will appear as clickable interactive thumbnails on the storefront!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Variants</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Sizes</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addSize(); } }} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. XL, 42, M" />
                  <button type="button" onClick={addSize} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">Add</button>
                </div>
                <div className="flex flex-col gap-2">
                  {(newProduct.sizes || []).map((size, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm shadow-sm w-full">
                      <span className="flex-1 font-medium">{size}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Price</span>
                        <input
                          type="number"
                          value={newProduct.variantPrices?.[size] || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setNewProduct(prev => {
                              const updatedPrices = { ...(prev.variantPrices || {}) };
                              if (val !== undefined) {
                                updatedPrices[size] = val;
                              } else {
                                delete updatedPrices[size];
                              }
                              return { ...prev, variantPrices: updatedPrices };
                            });
                          }}
                          placeholder={newProduct.price?.toString() || "Base Price"}
                          className="w-24 p-1 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-primary text-right"
                        />
                      </div>
                      <button type="button" onClick={() => removeSize(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(newProduct.sizes || []).length === 0 && <span className="text-sm text-gray-400 italic">No sizes added</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1 mt-4">Colors</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addColor(); } }} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Red, Blue, #FFFFFF" />
                  <button type="button" onClick={addColor} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">Add</button>
                </div>
                <div className="flex flex-col gap-2">
                  {(newProduct.colors || []).map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm shadow-sm w-full">
                      <div className="flex-1 flex items-center gap-2">
                        {color.startsWith('#') && <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }}></span>}
                        <span className="font-medium">{color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Price</span>
                        <input
                          type="number"
                          value={newProduct.variantPrices?.[color] || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setNewProduct(prev => {
                              const updatedPrices = { ...(prev.variantPrices || {}) };
                              if (val !== undefined) {
                                updatedPrices[color] = val;
                              } else {
                                delete updatedPrices[color];
                              }
                              return { ...prev, variantPrices: updatedPrices };
                            });
                          }}
                          placeholder={newProduct.price?.toString() || "Base Price"}
                          className="w-24 p-1 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-primary text-right"
                        />
                      </div>
                      <button type="button" onClick={() => removeColor(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(newProduct.colors || []).length === 0 && <span className="text-sm text-gray-400 italic">No colors added</span>}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Description & Details</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                <textarea value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" rows={3} placeholder="Full product specifications and details..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Key Specs (One per line)</label>
                  <textarea value={newProduct.keySpecs || ''} onChange={e => setNewProduct({...newProduct, keySpecs: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" rows={4} placeholder="Display: 6.7 OLED 144Hz&#10;Processor: A18 Quantum"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Features (One per line)</label>
                  <textarea value={newProduct.features || ''} onChange={e => setNewProduct({...newProduct, features: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" rows={4} placeholder="All-Day Power Mastery&#10;Ultra-Vision Camera System"></textarea>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-900">Active Status</h4>
                  <p className="text-sm text-gray-500">If inactive, the product will be hidden from the storefront.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={newProduct.active !== false} onChange={e => setNewProduct({...newProduct, active: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <div>
                  <h4 className="font-semibold text-amber-950">Spotlight of the Hour</h4>
                  <p className="text-sm text-amber-800/80">Highlight this item in the storefront spotlight section.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={!!newProduct.spotlight} onChange={e => setNewProduct({...newProduct, spotlight: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 mt-4 pt-4 border-t flex justify-end gap-3">
              <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-md">
                {editingId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        {/* Dynamic Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 pb-4 border-b border-gray-100 items-center justify-between">
          <div className="w-full md:w-1/2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search products by title, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="w-full md:w-auto flex flex-wrap gap-3 items-center justify-end">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <span>Category Filter:</span>
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Clear Filters Button if any filters are active */}
            {(searchQuery || selectedCategoryFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-2 border border-red-100 bg-red-50/50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filtering metadata info */}
        <div className="flex justify-between items-center mb-4 text-xs font-medium text-gray-400 font-mono">
          <span>
            {searchQuery || selectedCategoryFilter ? (
              <>
                Showing <span className="text-gray-800 font-bold">{sortedProducts.length}</span> of{' '}
                <span className="text-gray-600">{products.length}</span> total products
              </>
            ) : (
              <>
                Total Products: <span className="text-gray-800 font-bold">{products.length}</span>
              </>
            )}
          </span>
          {sortDirection && (
            <span>Sorted by Units Sold ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-sm font-medium text-gray-500">Image</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Title</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Category</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Cost</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Price</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Est. Revenue</th>
                <th className="pb-3 text-sm font-medium text-gray-500 select-none">
                  <button 
                    type="button"
                    onClick={() => {
                      if (sortDirection === null) setSortDirection('desc');
                      else if (sortDirection === 'desc') setSortDirection('asc');
                      else setSortDirection(null);
                    }}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors font-semibold group text-left"
                    title="Click to sort by Units Sold"
                  >
                    <span>Units Sold</span>
                    <span className="text-gray-400 group-hover:text-primary transition-colors flex items-center">
                      {sortDirection === 'desc' ? (
                        <ArrowDown size={14} className="text-primary" />
                      ) : sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary" />
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  </button>
                </th>
                <th className="pb-3 text-sm font-medium text-gray-500">Monthly Avg Orders</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Wishlisted</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Inventory</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Variants</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Spotlight</th>
                <th className="pb-3 text-sm font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="py-4 text-center">Loading products...</td></tr>
              ) : sortedProducts.length === 0 ? (
                <tr><td colSpan={14} className="py-4 text-center">No products found. Add one above!</td></tr>
              ) : (
                sortedProducts.map((p) => (
                  <tr key={p.id || p.title} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-4">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                     <td className="py-4 text-sm font-medium text-gray-900">{p.title}</td>
                    <td className="py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="py-4 text-sm text-gray-600">
                      {symbol}{(p.cost || 0).toFixed(2)}
                    </td>
                    <td className="py-4 text-sm font-medium text-gray-900">
                      {symbol}{p.price.toFixed(2)}
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="block text-xs text-gray-400 line-through">{symbol}{p.originalPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-4 text-sm font-medium text-green-600">
                      {symbol}{((p.price - (p.cost || 0)) * (p.inventoryQuantity || 0)).toFixed(2)}
                      <span className="block text-xs text-gray-400 font-normal">({symbol}{(p.price - (p.cost || 0)).toFixed(2)}/unit profit)</span>
                    </td>
                    <td className={`py-4 text-sm ${sortDirection ? 'bg-primary/5 font-bold text-primary px-2 rounded-lg' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900">
                          {p.id ? (productStats[p.id]?.volume || 0) : 0}
                        </span>
                        <span className="text-xs text-gray-400">units</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {p.id ? (productStats[p.id]?.monthlyAvg || 0).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight">orders/mo</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {p.id ? (wishlistStats[p.id] || 0) : 0}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight">saved</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      {p.inventoryQuantity !== undefined ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.inventoryQuantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {p.inventoryQuantity} in stock
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="py-4 text-xs text-gray-600">
                      <div><span className="font-semibold">Sizes:</span> {p.sizes?.length ? p.sizes.join(', ') : 'None'}</div>
                      <div><span className="font-semibold">Colors:</span> {p.colors?.length ? p.colors.join(', ') : 'None'}</div>
                    </td>
                    <td className="py-4">
                      <label className={`relative inline-flex items-center ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" disabled={!isAdmin} className="sr-only peer" checked={p.active !== false} onChange={async (e) => {
                          const isActive = e.target.checked;
                          if (p.id) {
                            await updateProduct(p.id, { active: isActive });
                            fetchProducts();
                          }
                        }} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td className="py-4">
                      <label className={`relative inline-flex items-center ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" disabled={!isAdmin} className="sr-only peer" checked={!!p.spotlight} onChange={async (e) => {
                          const isSpotlight = e.target.checked;
                          if (p.id) {
                            if (isSpotlight) {
                              // Reset all other spotlights
                              const otherSpotlights = products.filter(prod => prod.spotlight && prod.id !== p.id);
                              for (const prod of otherSpotlights) {
                                  if (prod.id) {
                                    await updateProduct(prod.id, { spotlight: false });
                                  }
                              }
                            }
                            await updateProduct(p.id, { spotlight: isSpotlight });
                            fetchProducts();
                          }
                        }} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => p.id && handleDeleteClick(p.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Admin only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action is permanent and cannot be undone."
        confirmText="Delete Product"
        type="danger"
      />

      {/* Manage Categories Modal */}
      {isManagingCategories && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Tag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage Store Categories</h2>
                  <p className="text-xs text-gray-500">Add, edit, or delete categories for your products</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsManagingCategories(false);
                  setEditingCatId(null);
                  setNewCatName('');
                  setNewCatImage('');
                }} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-150 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Create or Edit Category */}
              <div className="space-y-6">
                {editingCatId ? (
                  <form onSubmit={handleUpdateCategory} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider font-mono">Edit Category</h3>
                      <button 
                        type="button" 
                        onClick={() => { setEditingCatId(null); setEditingCatName(''); setEditingCatImage(''); }}
                        className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category Name *</label>
                      <input 
                        required 
                        type="text" 
                        value={editingCatName} 
                        onChange={e => setEditingCatName(e.target.value)} 
                        className="w-full p-3 border border-gray-300 bg-white rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Footwear"
                      />
                    </div>
                    <div>
                      <ImageUploader 
                        label="Category Image" 
                        value={editingCatImage} 
                        onChange={setEditingCatImage} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-md w-full"
                    >
                      Update Category
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddCategory} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider font-mono">Add New Category</h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category Name *</label>
                      <input 
                        required 
                        type="text" 
                        value={newCatName} 
                        onChange={e => setNewCatName(e.target.value)} 
                        className="w-full p-3 border border-gray-300 bg-white rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Summer Essentials"
                      />
                    </div>
                    <div>
                      <ImageUploader 
                        label="Category Image (Optional)" 
                        value={newCatImage} 
                        onChange={setNewCatImage} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Create Category
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Categories List */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider font-mono">Existing Categories ({categories.length})</h3>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id || cat.name} 
                      className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${editingCatId === cat.id ? 'border-primary bg-primary/5' : 'border-gray-150 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={cat.image || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&auto=format&fit=crop&q=60"} 
                          alt={cat.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-950">{cat.name}</p>
                          <p className="text-xs text-gray-500">
                            {products.filter(p => p.category === cat.name).length} products
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleEditCategoryClick(cat)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Category Name & Image"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => cat.id && handleDeleteCategory(cat.id, cat.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-8 text-gray-400 italic text-xs">
                      No categories added yet. Create one on the left!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => {
                  setIsManagingCategories(false);
                  setEditingCatId(null);
                  setNewCatName('');
                  setNewCatImage('');
                }} 
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors cursor-pointer text-sm"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl animate-pulse">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bulk Product Importer</h2>
                  <p className="text-xs text-gray-500">Add dozens or hundreds of products at once from CSV files</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImporting(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
                disabled={importStatus === 'importing'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {importStatus === 'idle' && (
                <div className="space-y-6">
                  {/* Instructions Banner */}
                  <div className="p-5 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-left space-y-3">
                    <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                      <span className="material-symbols-outlined text-base">info</span>
                      CSV Format Guidelines
                    </h3>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      Ensure your CSV file contains column headers in the first row. The importer intelligently maps columns, but for the best results, use standard headers like:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-amber-950 font-mono">
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Title *</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Category *</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Selling Price *</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Cost Price</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Original Price</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Inventory</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Image URL</div>
                      <div className="bg-amber-100/50 p-1.5 rounded-lg border border-amber-200 text-center">Description</div>
                    </div>
                  </div>

                  {/* Template download & upload panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Left Panel: Download template card */}
                    <div className="bg-gray-50/50 border border-gray-150 p-6 rounded-2xl flex flex-col justify-between text-left space-y-4 md:col-span-1">
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-gray-900 font-mono uppercase tracking-wider">Start with a template</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Download our customized CSV template configured with pre-mapped columns to guarantee a seamless upload.
                        </p>
                      </div>
                      <button 
                        onClick={handleDownloadSampleTemplate}
                        className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-800 hover:bg-gray-50 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">download_file</span>
                        Download Template
                      </button>
                    </div>

                    {/* Right Panel: Upload Box */}
                    <div className="md:col-span-2 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary/50 transition-colors p-8 flex flex-col items-center justify-center text-center relative bg-gray-50/30">
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleCSVFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <div className="p-4 bg-white rounded-full shadow-xs mb-4 text-primary border border-gray-100">
                        <Upload size={28} />
                      </div>
                      <p className="font-bold text-sm text-gray-900">Drag and drop your CSV file here</p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">or click to browse from your device</p>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-150">Supports: CSV format</span>
                    </div>

                  </div>
                </div>
              )}

              {importStatus === 'parsing' && (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <p className="font-bold text-gray-800 text-sm font-mono uppercase tracking-wider">Parsing file: {importFileName}</p>
                  <p className="text-xs text-gray-500">Checking column headers and validating product values...</p>
                </div>
              )}

              {importStatus === 'preview' && (
                <div className="space-y-6 text-left">
                  
                  {/* File info banner */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 border border-gray-200 rounded-2xl gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold font-mono">Uploaded File</p>
                      <p className="font-bold text-sm text-gray-900">{importFileName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-150">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {parsedProducts.filter(p => p.isValid).length} Valid Products
                      </div>
                      {parsedProducts.filter(p => !p.isValid).length > 0 && (
                        <div className="flex items-center gap-1 bg-red-50 text-red-800 text-xs font-bold px-3 py-1.5 rounded-full border border-red-150 animate-pulse">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          {parsedProducts.filter(p => !p.isValid).length} Invalid Rows
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning summary for invalid items */}
                  {importErrors.length > 0 && (
                    <div className="p-4 bg-red-50/50 border border-red-150 rounded-2xl space-y-1.5">
                      <p className="text-xs font-bold text-red-950 font-mono uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-red-600">error</span>
                        Validation Issues Detected ({importErrors.length})
                      </p>
                      <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1 scrollbar-none">
                        {importErrors.map((err, idx) => (
                          <p key={idx} className="text-xs font-medium text-red-800 leading-relaxed">• {err}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed products grid table preview */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs text-gray-900 uppercase tracking-widest font-mono">Product Catalog Preview ({parsedProducts.length})</h3>
                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50/80 sticky top-0 border-b border-gray-200">
                            <tr>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider w-14 text-center">Status</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider w-12 text-center">Row</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider">Product Title</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider">Category</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider text-right">Selling Price</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider text-right">Cost Price</th>
                              <th className="p-3 font-bold text-gray-700 uppercase tracking-wider text-center">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 bg-white">
                            {parsedProducts.map((p, idx) => (
                              <tr key={idx} className={`hover:bg-gray-50/50 ${!p.isValid ? 'bg-red-50/10' : ''}`}>
                                <td className="p-3 text-center">
                                  {p.isValid ? (
                                    <span className="material-symbols-outlined text-emerald-600 text-lg" title="Valid">check_circle</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-red-600 text-lg animate-bounce" title="Invalid Row">error</span>
                                  )}
                                </td>
                                <td className="p-3 text-center text-gray-400 font-mono font-medium">{p.rowNum}</td>
                                <td className="p-3 font-semibold text-gray-950 max-w-[200px] truncate">{p.title}</td>
                                <td className="p-3">
                                  <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase border border-gray-200">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-gray-900">{symbol}{p.price.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono font-medium text-gray-500">{symbol}{p.cost.toFixed(2)}</td>
                                <td className="p-3 text-center font-mono font-semibold text-gray-700">{p.inventoryQuantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {importStatus === 'importing' && (
                <div className="py-12 px-6 flex flex-col items-center justify-center space-y-6">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-primary animate-spin" />
                    <span className="absolute text-xs font-bold font-mono text-primary">
                      {Math.round((importingProgress / totalImporting) * 100)}%
                    </span>
                  </div>
                  <div className="space-y-2 text-center w-full max-w-md">
                    <p className="font-bold text-gray-800 text-base">Importing Catalog List...</p>
                    <p className="text-xs text-gray-500">Writing items to secure database: <span className="font-semibold text-gray-900">{importingProgress} / {totalImporting}</span> completed</p>
                    
                    {/* Visual progress bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4 border border-gray-200/50">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${(importingProgress / totalImporting) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {importStatus === 'completed' && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 flex items-center justify-center text-3xl shadow-sm">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-900">Import Complete!</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      All valid products have been imported, and any new product categories have been auto-registered in your store categories.
                    </p>
                  </div>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full border border-red-150 flex items-center justify-center text-3xl shadow-sm">
                    <span className="material-symbols-outlined text-4xl">warning</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-900">Import Failed</h3>
                    <p className="text-xs text-red-700 max-w-sm mx-auto">
                      {importErrors[0] || "We couldn't process your file. Please verify its formatting and column headers."}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setImportStatus('idle');
                      setParsedProducts([]);
                      setImportErrors([]);
                      setImportFileName('');
                    }}
                    className="bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center">
              <div>
                {importStatus === 'preview' && (
                  <button 
                    onClick={() => {
                      setImportStatus('idle');
                      setParsedProducts([]);
                      setImportErrors([]);
                      setImportFileName('');
                    }}
                    className="text-xs text-gray-500 font-bold hover:text-gray-900 hover:underline cursor-pointer"
                  >
                    Choose another file
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {importStatus === 'preview' && (
                  <>
                    <button 
                      onClick={() => setIsImporting(false)} 
                      className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeBulkImport}
                      disabled={parsedProducts.filter(p => p.isValid).length === 0}
                      className="btn btn-primary btn-sm"
                    >
                      <span className="material-symbols-outlined text-sm">cloud_upload</span>
                      Start Import ({parsedProducts.filter(p => p.isValid).length})
                    </button>
                  </>
                )}

                {importStatus === 'idle' && (
                  <button 
                    onClick={() => setIsImporting(false)} 
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-200/90 text-gray-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Close Importer
                  </button>
                )}

                {(importStatus === 'completed' || importStatus === 'error') && (
                  <button 
                    onClick={() => setIsImporting(false)} 
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
