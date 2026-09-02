import React, { useState, useEffect, useMemo } from 'react';
import { Download, Trash2, Edit2, Plus, X, PlusCircle, MinusCircle, Printer, Search } from 'lucide-react';
import { getOrders, deleteOrder, updateOrder, addOrder, Order } from '../../services/orderService';
import { getProducts, Product } from '../../services/productService';
import { getStoreSettings, getGeneralSettings, StoreSettings, GeneralSettings } from '../../services/settingsService';
import { getCurrencySymbol } from '../../utils/currency';
import { useUserRole } from '../../hooks/useUserRole';
import { ConfirmModal } from '../../components/ConfirmModal';

export function Orders() {
  const { isAdmin } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Custom delete confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Bill & printing state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);


  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Selected Product Dropdown
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const storeData = await getStoreSettings();
      setStoreSettings(storeData);
      const genData = await getGeneralSettings();
      setGeneralSettings(genData);
    } catch (e) {
      console.error("Error loading store settings for print bills", e);
    }
  };

  const openPrintModal = (order: Order) => {
    setPrintingOrder(order);
    setIsPrintModalOpen(true);
  };


  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  const handleDownloadCSV = () => {
    if (orders.length === 0) return;
    
    const headers = ["Order ID", "Date", "Customer Name", "WhatsApp", "Items Count", "Total"];
    const csvContent = [
      headers.join(","),
      ...orders.map(o => `"${o.id}","${new Date(o.createdAt).toLocaleDateString()}","${o.customer.name}","${o.customer.whatsapp}","${o.items?.length || 0}","${o.total}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOrder(deleteId);
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateOrder(id, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerWhatsapp('');
    setCustomerAddress('');
    setCustomerCity('');
    setCustomerPincode('');
    setOrderStatus('pending');
    setSelectedItems([]);
    setSelectedProductId('');
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customer.name);
    setCustomerWhatsapp(order.customer.whatsapp);
    setCustomerAddress(order.customer.address);
    setCustomerCity(order.customer.city);
    setCustomerPincode(order.customer.pincode);
    setOrderStatus(order.status);
    setSelectedItems(order.items || []);
    setSelectedProductId('');
    setIsModalOpen(true);
  };

  const addProductToOrder = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItemIndex = selectedItems.findIndex(i => i.id === product.id);
    if (existingItemIndex >= 0) {
      const newItems = [...selectedItems];
      newItems[existingItemIndex].quantity += 1;
      setSelectedItems(newItems);
    } else {
      setSelectedItems([...selectedItems, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1
      }]);
    }
    setSelectedProductId('');
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const newItems = [...selectedItems];
    const newQuantity = newItems[index].quantity + delta;
    if (newQuantity <= 0) {
      newItems.splice(index, 1);
    } else {
      newItems[index].quantity = newQuantity;
    }
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchQuery.toLowerCase().trim();
      
      const matchesStatus = !selectedStatusFilter || o.status === selectedStatusFilter;
      if (!q) {
        return matchesStatus;
      }

      const name = o.customer?.name || '';
      const whatsapp = o.customer?.whatsapp || '';
      
      const matchesCustomer = name.toLowerCase().includes(q);
      const matchesContact = whatsapp.toLowerCase().includes(q);
      
      let matchesDate = false;
      if (o.createdAt) {
        try {
          const dateObj = new Date(o.createdAt);
          const localDateStr = dateObj.toLocaleDateString().toLowerCase();
          const isoDateStr = o.createdAt.toLowerCase();
          const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric', day: 'numeric' };
          const longDateStr = dateObj.toLocaleDateString(undefined, options).toLowerCase();
          
          matchesDate = localDateStr.includes(q) || isoDateStr.includes(q) || longDateStr.includes(q);
        } catch (e) {
          // Ignore
        }
      }

      const matchesId = (o.id || '').toLowerCase().includes(q);

      return matchesStatus && (matchesCustomer || matchesContact || matchesDate || matchesId);
    });
  }, [orders, searchQuery, selectedStatusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = calculateTotal();
      const orderData = {
        customer: {
          name: customerName,
          whatsapp: customerWhatsapp,
          address: customerAddress,
          city: customerCity,
          pincode: customerPincode
        },
        items: selectedItems,
        total: totalAmount,
        subtotal: totalAmount,
        tax: 0,
        discount: 0,
        status: orderStatus,
      };

      if (editingOrder && editingOrder.id) {
        await updateOrder(editingOrder.id, orderData);
      } else {
        await addOrder({
          ...orderData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error saving order", error);
      alert("There was an error saving the order.");
    }
  };

  const symbol = getCurrencySymbol(generalSettings?.currency);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">View and manage customer orders.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={openAddModal}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              Add Order
            </button>
          )}
          <button 
            onClick={handleDownloadCSV}
            className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export Orders CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        {/* Dynamic Search & Status Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 pb-4 border-b border-gray-100 items-center justify-between">
          <div className="w-full md:w-1/2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search orders by customer name, contact number, or date..."
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
              <span>Status Filter:</span>
            </div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Clear Filters Button if any filters are active */}
            {(searchQuery || selectedStatusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('');
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
            {searchQuery || selectedStatusFilter ? (
              <>
                Showing <span className="text-gray-800 font-bold">{filteredOrders.length}</span> of{' '}
                <span className="text-gray-600">{orders.length}</span> total orders
              </>
            ) : (
              <>
                Total Orders: <span className="text-gray-800 font-bold">{orders.length}</span>
              </>
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-sm font-medium text-gray-500">Order ID</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="pb-3 text-sm font-medium text-gray-500">WhatsApp</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Total Items</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Items Summary</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Total</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                <th className="pb-3 text-sm font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-4 text-center text-gray-500">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="py-4 text-center text-gray-500">No orders yet.</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="py-4 text-center text-gray-500">No matching orders found.</td></tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm font-mono text-gray-500">{(o.id || "").substring(0, 8)}</td>
                    <td className="py-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-sm font-medium text-gray-900">{o.customer.name}</td>
                    <td className="py-4 text-sm text-gray-600">{o.customer.whatsapp}</td>
                    <td className="py-4 text-sm font-bold text-gray-900 bg-gray-50 text-center">
                      {o.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      {o.items?.length > 0 ? (
                        <div className="max-w-[200px] truncate" title={o.items.map(i => `${i.quantity}x ${i.title}`).join(', ')}>
                          {o.items.map(i => `${i.quantity}x ${i.title}`).join(', ')}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No items</span>
                      )}
                    </td>
                    <td className="py-4 text-sm font-medium text-gray-900">{getCurrencySymbol(generalSettings?.currency)}{o.total.toFixed(2)}</td>
                     <td className="py-4">
                      {isAdmin ? (
                        <select 
                          value={o.status || 'pending'}
                          onChange={(e) => o.id && updateStatus(o.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none border border-transparent focus:border-gray-300 transition-colors cursor-pointer
                            ${(o.status === 'completed' || o.status === 'delivered') ? 'bg-green-100 text-green-700' : 
                              o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase
                          ${(o.status === 'completed' || o.status === 'delivered') ? 'bg-green-100 text-green-700' : 
                            o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'}`}
                        >
                          {o.status || 'pending'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => openPrintModal(o)} 
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                          title="Generate & Print Bill"
                        >
                          <Printer size={13} />
                          <span>Bill</span>
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEditModal(o)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Edit Order">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => o.id && handleDeleteClick(o.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete Order">
                              <Trash2 size={16} />
                            </button>
                          </>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Customer Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="text" value={customerWhatsapp} onChange={e => setCustomerWhatsapp(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={customerCity} onChange={e => setCustomerCity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input type="text" value={customerPincode} onChange={e => setCustomerPincode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Order Items</h3>
                
                <div className="flex gap-2 items-center">
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">-- Select a Product to Add --</option>
                    {products.map(p => (
                      <option key={p.id || p.title} value={p.id}>{p.title} - {symbol}{p.price}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={addProductToOrder}
                    disabled={!selectedProductId}
                    className="btn btn-primary btn-sm"
                  >
                    Add
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 min-h-[100px]">
                  {selectedItems.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm mt-4">No items added to this order.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                              {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500">{symbol}{item.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
                              <button type="button" onClick={() => updateItemQuantity(index, -1)} className="text-gray-500 hover:text-primary"><MinusCircle size={16} /></button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <button type="button" onClick={() => updateItemQuantity(index, 1)} className="text-gray-500 hover:text-primary"><PlusCircle size={16} /></button>
                            </div>
                            <button type="button" onClick={() => updateItemQuantity(index, -item.quantity)} className="text-gray-400 hover:text-red-500 p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="w-48 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{symbol}{calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                  {editingOrder ? 'Save Changes' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL GENERATION & PRINT MODAL */}
      {isPrintModalOpen && printingOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Printer className="text-emerald-600 w-5 h-5" />
                <h2 className="text-lg font-bold text-gray-900">Invoice & Bill Generator</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const style = document.createElement('style');
                    style.id = 'print-style';
                    style.innerHTML = `
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #printable-bill-area, #printable-bill-area * {
                          visibility: visible !important;
                        }
                        #printable-bill-area {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          padding: 20px !important;
                          margin: 0 !important;
                          border: none !important;
                          background: white !important;
                          color: black !important;
                        }
                      }
                    `;
                    document.head.appendChild(style);
                    window.print();
                    setTimeout(() => {
                      const el = document.getElementById('print-style');
                      if (el) el.remove();
                    }, 1000);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer size={16} />
                  Print Bill
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-50/50">
              <div id="printable-bill-area" className="bg-white p-8 rounded-xl shadow-xs border border-gray-200/60 max-w-2xl mx-auto text-gray-800 font-sans">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{storeSettings?.storeName || 'My Store'}</h3>
                    <p className="text-xs text-gray-500 mt-1">Official Invoice & Order Receipt</p>
                    {generalSettings?.whatsappNumber && (
                      <p className="text-xs text-gray-500 mt-0.5">Support WhatsApp: {generalSettings.whatsappNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      INVOICE
                    </span>
                    <h4 className="text-sm font-mono text-gray-600 mt-3">ID: {printingOrder.id}</h4>
                    <p className="text-xs text-gray-500 mt-1">Date: {new Date(printingOrder.createdAt).toLocaleDateString()} {new Date(printingOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className="font-bold uppercase text-xs">{printingOrder.status}</span>
                    </p>
                  </div>
                </div>

                {/* Billed To / Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Billed To (Customer)</h5>
                    <p className="text-sm font-bold text-gray-900">{printingOrder.customer.name}</p>
                    <p className="text-xs text-gray-600 mt-1">WhatsApp: {printingOrder.customer.whatsapp}</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Shipping Details</h5>
                    <p className="text-xs text-gray-700">{printingOrder.customer.address || 'N/A'}</p>
                    <p className="text-xs text-gray-700 mt-0.5">
                      {printingOrder.customer.city || 'N/A'} {printingOrder.customer.pincode ? `- ${printingOrder.customer.pincode}` : ''}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3 pl-2">#</th>
                        <th className="pb-3">Item Description</th>
                        <th className="pb-3 text-right">Price</th>
                        <th className="pb-3 text-center">Qty</th>
                        <th className="pb-3 pr-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {printingOrder.items?.map((item, idx) => (
                        <tr key={item.id || idx} className="text-sm text-gray-700">
                          <td className="py-3 pl-2 font-mono text-xs text-gray-400">{idx + 1}</td>
                          <td className="py-3 font-semibold text-gray-900">
                            {item.title}
                          </td>
                          <td className="py-3 text-right font-mono text-xs">
                            {getCurrencySymbol(generalSettings?.currency)}{Number(item.price).toFixed(2)}
                          </td>
                          <td className="py-3 text-center font-medium">
                            {item.quantity}
                          </td>
                          <td className="py-3 pr-2 text-right font-bold text-gray-900 font-mono text-xs">
                            {getCurrencySymbol(generalSettings?.currency)}{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary */}
                <div className="flex justify-end border-t border-gray-200 pt-6">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">{getCurrencySymbol(generalSettings?.currency)}{(printingOrder.subtotal || printingOrder.total).toFixed(2)}</span>
                    </div>
                    {printingOrder.discount > 0 && (
                      <div className="flex justify-between text-xs text-red-500">
                        <span>Discount:</span>
                        <span className="font-mono">-{getCurrencySymbol(generalSettings?.currency)}{printingOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {printingOrder.tax > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Tax:</span>
                        <span className="font-mono">+{getCurrencySymbol(generalSettings?.currency)}{printingOrder.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-2">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-600 text-base">{getCurrencySymbol(generalSettings?.currency)}{printingOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="border-t border-gray-200 mt-12 pt-6 text-center">
                  <p className="text-xs font-semibold text-gray-600">Thank you for your order!</p>
                  <p className="text-[10px] text-gray-400 mt-1">If you have any questions about this invoice, please reach out to us on WhatsApp.</p>
                  <div className="mt-4 flex justify-center items-center gap-1.5 text-[9px] text-gray-300 font-mono uppercase tracking-widest">
                    <span>Powered by</span>
                    <span className="font-bold text-gray-400">{storeSettings?.storeName || 'My Store'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action is permanent and cannot be undone."
        confirmText="Delete Order"
        type="danger"
      />
    </div>
  );
}
