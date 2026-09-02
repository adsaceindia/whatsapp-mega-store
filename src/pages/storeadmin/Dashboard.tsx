import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Package, Eye, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, BarChart2, Zap, Users, Calendar, Heart } from 'lucide-react';
import { getProducts, Product } from '../../services/productService';
import { getOrders, Order } from '../../services/orderService';
import { getTeamMembers, TeamMember } from '../../services/teamService';
import { Link } from 'react-router';
import { getGeneralSettings, GeneralSettings } from '../../services/settingsService';
import { getCurrencySymbol } from '../../utils/currency';
import { getWishlistStats } from '../../services/wishlistService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6', '#f43f5e', '#64748b'];

export function StoreAdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [wishlistStats, setWishlistStats] = useState<{ [productId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');
  const [activeChartTab, setActiveChartTab] = useState<'sales' | 'categories_over_time' | 'category_split'>('sales');

  const getOrderDate = (createdAt: any): Date => {
    if (!createdAt) return new Date();
    if (createdAt instanceof Date) return createdAt;
    if (typeof createdAt === 'object' && createdAt.seconds) {
      return new Date(createdAt.seconds * 1000);
    }
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const getSalesTrendData = () => {
    const data: { date: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    
    if (timeRange !== 'all') {
      const days = parseInt(timeRange, 10);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        data.push({
          date: dateStr,
          revenue: 0,
          orders: 0
        });
      }

      orders.forEach(o => {
        const orderDate = getOrderDate(o.createdAt);
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < days) {
          const dateStr = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const entry = data.find(item => item.date === dateStr);
          if (entry) {
            entry.revenue += o.total || 0;
            entry.orders += 1;
          }
        }
      });
    } else {
      const dataMap: { [month: string]: { revenue: number; orders: number; sortKey: string } } = {};
      orders.forEach(o => {
        const orderDate = getOrderDate(o.createdAt);
        const monthStr = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
        const sortKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!dataMap[monthStr]) {
          dataMap[monthStr] = { revenue: 0, orders: 0, sortKey };
        }
        dataMap[monthStr].revenue += o.total || 0;
        dataMap[monthStr].orders += 1;
      });

      return Object.entries(dataMap)
        .map(([month, val]) => ({ date: month, revenue: val.revenue, orders: val.orders, sortKey: val.sortKey }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }
    return data;
  };

  const getCategorySalesData = () => {
    const prodToCat: { [id: string]: string } = {};
    products.forEach(p => {
      prodToCat[p.id] = p.category || 'Uncategorized';
    });

    const catMap: { [cat: string]: { revenue: number; quantity: number } } = {};
    const now = new Date();

    orders.forEach(o => {
      const orderDate = getOrderDate(o.createdAt);
      let inRange = true;
      if (timeRange !== 'all') {
        const days = parseInt(timeRange, 10);
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        inRange = diffDays >= 0 && diffDays < days;
      }

      if (inRange) {
        o.items?.forEach(item => {
          const category = prodToCat[item.productId] || 'Uncategorized';
          if (!catMap[category]) {
            catMap[category] = { revenue: 0, quantity: 0 };
          }
          catMap[category].revenue += (item.price || 0) * (item.quantity || 1);
          catMap[category].quantity += item.quantity || 1;
        });
      }
    });

    return Object.entries(catMap).map(([category, val]) => ({
      category,
      revenue: Math.round(val.revenue * 100) / 100,
      quantity: val.quantity
    })).sort((a, b) => b.revenue - a.revenue);
  };

  const getCategorySalesOverTimeData = () => {
    const prodToCat: { [id: string]: string } = {};
    const categoriesSet = new Set<string>();
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      prodToCat[p.id] = cat;
      categoriesSet.add(cat);
    });
    const categoriesList = Array.from(categoriesSet);

    const now = new Date();
    
    if (timeRange !== 'all') {
      const days = parseInt(timeRange, 10);
      const data: { [dateStr: string]: { [category: string]: number } } = {};
      const datesList: string[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        datesList.push(dateStr);
        data[dateStr] = {};
        categoriesList.forEach(cat => {
          data[dateStr][cat] = 0;
        });
      }

      orders.forEach(o => {
        const orderDate = getOrderDate(o.createdAt);
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < days) {
          const dateStr = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (data[dateStr]) {
            o.items?.forEach(item => {
              const cat = prodToCat[item.productId] || 'Uncategorized';
              data[dateStr][cat] = (data[dateStr][cat] || 0) + (item.price || 0) * (item.quantity || 1);
            });
          }
        }
      });

      return datesList.map(date => ({
        date,
        ...data[date]
      }));
    } else {
      const data: { [monthStr: string]: any } = {};
      
      orders.forEach(o => {
        const orderDate = getOrderDate(o.createdAt);
        const monthStr = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
        const sortKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!data[monthStr]) {
          data[monthStr] = { sortKey };
          categoriesList.forEach(cat => {
            data[monthStr][cat as string] = 0;
          });
        }
        
        o.items?.forEach(item => {
          const cat = prodToCat[item.productId] || 'Uncategorized';
          data[monthStr][cat] = (data[monthStr][cat] || 0) + (item.price || 0) * (item.quantity || 1);
        });
      });

      return Object.entries(data)
        .map(([month, val]) => ({
          date: month,
          sortKey: val.sortKey,
          ...val
        }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }
  };

  const categoriesList = Array.from(new Set(products.map(p => (p.category as string) || 'Uncategorized')));

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchTeamMembers();
    getGeneralSettings().then(setGeneralSettings).catch(console.error);
    getWishlistStats().then(setWishlistStats).catch(console.error);
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error("Error fetching team members", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  };

  const totalTeamMembers = teamMembers.length;
  const activeTeamMembers = teamMembers.filter(m => m.status === 'Active').length;
  
  const totalSalaryDistributed = teamMembers.reduce((sum, m) => {
    // Basic calculation based on current salary if available and number of months
    if (!m.currentSalary || isNaN(parseFloat(m.currentSalary)) || !m.dateOfJoining) return sum;
    
    const salary = parseFloat(m.currentSalary);
    const joinDate = new Date(m.dateOfJoining);
    const endDate = m.relievingDate ? new Date(m.relievingDate) : new Date();
    
    // Calculate months between dates
    const months = (endDate.getFullYear() - joinDate.getFullYear()) * 12 + (endDate.getMonth() - joinDate.getMonth());
    const validMonths = Math.max(0, months);
    
    return sum + (salary * validMonths);
  }, 0);
  
  // Financial Metrics
  const totalInventoryCost = products.reduce((sum, p) => sum + ((p.cost || 0) * (p.inventoryQuantity || 0)), 0);
  const totalExpectedRevenue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.inventoryQuantity || 0)), 0);
  const totalExpectedProfit = totalExpectedRevenue - totalInventoryCost;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalPendingPayment = orders.filter(o => o.status === 'pending' || o.status === 'processing').reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Average Monthly Orders Calculation
  const getAverageMonthlyOrders = () => {
    if (orders.length === 0) return 0;
    const orderDates = orders.map(o => new Date(o.createdAt).getTime());
    const minDate = new Date(Math.min(...orderDates));
    const maxDate = new Date();
    const yearDiff = maxDate.getFullYear() - minDate.getFullYear();
    const monthDiff = maxDate.getMonth() - minDate.getMonth();
    const totalMonths = (yearDiff * 12) + monthDiff + 1;
    const validMonths = Math.max(1, totalMonths);
    return orders.length / validMonths;
  };
  const avgMonthlyOrders = getAverageMonthlyOrders();

  const symbol = getCurrencySymbol(generalSettings?.currency);

  // Order Metrics
  const totalOrders = orders.length;
  const newReceivedOrders = orders.filter(o => o.status === 'pending').length;
  const pendingOrders = orders.filter(o => o.status === 'processing').length;
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'shipped').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const returnedOrders = orders.filter(o => o.status === 'returned').length;

  // Product Metrics
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => (p.inventoryQuantity || 0) === 0).length;
  const activeProducts = products.filter(p => p.active !== false).length;
  const lowInventoryProducts = products.filter(p => (p.inventoryQuantity || 0) > 0 && (p.inventoryQuantity || 0) < 5).length;

  // Wishlist Metrics
  const totalWishlistSaves = (Object.values(wishlistStats) as number[]).reduce((sum, val) => sum + val, 0);
  const uniqueWishlistedProducts = Object.keys(wishlistStats).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your store's performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions & Team */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-100">
              <Users size={16} />
              <span>{activeTeamMembers} Active Team Members</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <Link to="/admin/products" className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container transition-colors gap-2 text-primary font-medium">
              <Package size={28} />
              Manage Products
            </Link>
            <Link to="/admin/storefront/branding" className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container transition-colors gap-2 text-primary font-medium">
              <Eye size={28} />
              Edit Storefront
            </Link>
          </div>
        </div>

        {/* Recent Orders Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:text-primary/80">View All</Link>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 3).map(o => (
              <div key={o.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">{o.customer.name}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{symbol}{o.total.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${(o.status === 'completed' || o.status === 'delivered') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status || 'pending'}</span>
                </div>
              </div>
            ))}
            {orders.length > 3 && (
              <div className="pt-2 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  + {orders.length - 3} more order{orders.length - 3 > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {orders.length === 0 && <p className="text-gray-500 text-center py-4 text-sm">No orders yet.</p>}
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="text-primary animate-pulse" size={20} />
              Store Analytics & Insights
            </h2>
            <p className="text-xs text-gray-500 font-light">Interactive sales trends and dynamic category distributions compiled directly from your sales database.</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-xs font-bold font-space text-gray-400 uppercase tracking-wide">Timeframe:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200/50">
              <button
                type="button"
                onClick={() => setTimeRange('7')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === '7' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === '30' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-gray-100 pb-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveChartTab('sales')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeChartTab === 'sales' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
          >
            <span className="material-symbols-outlined text-[16px]">show_chart</span>
            Sales Trends (Revenue & Orders)
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('categories_over_time')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeChartTab === 'categories_over_time' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
          >
            <span className="material-symbols-outlined text-[16px]">timeline</span>
            Popular Categories over Time
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('category_split')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeChartTab === 'category_split' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-800'}`}
          >
            <span className="material-symbols-outlined text-[16px]">pie_chart</span>
            Category Share Breakdown
          </button>
        </div>

        {/* Chart Viewport */}
        <div className="h-[350px] w-full min-h-[300px]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></span>
              <span className="text-xs font-bold font-space uppercase">Loading data charts...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <BarChart2 size={40} className="text-gray-300" />
              <p className="text-sm font-semibold">No sales data available yet</p>
              <p className="text-xs">Once orders are placed, beautiful analytics will populate here.</p>
            </div>
          ) : (
            <>
              {activeChartTab === 'sales' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSalesTrendData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 'bold' }} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#10b981', fontWeight: 'bold' }} tickFormatter={(val) => `${symbol}${val}`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} 
                      labelStyle={{ fontWeight: 'bold', color: '#111827', fontSize: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Area yAxisId="left" type="monotone" name="Revenue" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area yAxisId="right" type="monotone" name="Orders Count" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'categories_over_time' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getCategorySalesOverTimeData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 'bold' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 'bold' }} tickFormatter={(val) => `${symbol}${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} 
                      labelStyle={{ fontWeight: 'bold', color: '#111827', fontSize: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'semibold' }}
                      formatter={(val: any) => [`${symbol}${parseFloat(val).toFixed(2)}`, 'Sales']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    {categoriesList.map((category: any, index) => (
                      <Area 
                        key={category} 
                        type="monotone" 
                        dataKey={category} 
                        stackId="1" 
                        stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        fillOpacity={0.65}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'category_split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCategorySalesData()} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} tickFormatter={(val) => `${symbol}${val}`} />
                        <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 'bold', width: 90 }} width={90} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(val: any) => [`${symbol}${parseFloat(val).toFixed(2)}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                          {getCategorySalesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto pr-2 flex flex-col gap-2">
                    <span className="text-[11px] font-extrabold font-space text-gray-400 uppercase tracking-widest mb-1">Revenue Share Details</span>
                    {getCategorySalesData().map((item, index) => {
                      const totalRev = getCategorySalesData().reduce((sum, current) => sum + current.revenue, 0);
                      const pct = totalRev > 0 ? (item.revenue / totalRev) * 100 : 0;
                      return (
                        <div key={item.category} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-none">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                            <span className="font-bold text-gray-700">{item.category}</span>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="font-mono text-[11px] text-gray-400">{item.quantity} sold</span>
                            <span className="font-extrabold text-gray-900">{symbol}{item.revenue.toFixed(2)}</span>
                            <span className="font-extrabold font-space text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] min-w-[40px] text-center">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          <StatCard title="Total Salary Paid" value={`${symbol}${totalSalaryDistributed.toFixed(2)}`} change="Est. based on tenure" icon={<Users className="text-purple-500" />} />
          <StatCard title="Total Inventory Cost" value={`${symbol}${totalInventoryCost.toFixed(2)}`} change="Cost of current stock" icon={<DollarSign className="text-red-500" />} />
          <StatCard title="Expected Revenue" value={`${symbol}${totalExpectedRevenue.toFixed(2)}`} change={`Est Profit: ${symbol}${totalExpectedProfit.toFixed(2)}`} icon={<BarChart2 className="text-emerald-500" />} />
          <StatCard title="Total Revenue" value={`${symbol}${totalRevenue.toFixed(2)}`} change="From all orders" icon={<DollarSign className="text-blue-500" />} />
          <StatCard title="Pending Payments" value={`${symbol}${totalPendingPayment.toFixed(2)}`} change="Unpaid orders" icon={<Clock className="text-amber-500" />} />
          <StatCard title="Avg Order Value" value={`${symbol}${avgOrderValue.toFixed(2)}`} change="Per order" icon={<DollarSign className="text-indigo-500" />} />
          <StatCard title="Avg Monthly Orders" value={avgMonthlyOrders.toFixed(1)} change="Orders per month" icon={<Calendar className="text-teal-500" />} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Order Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <MiniStat title="Total Orders" value={totalOrders} icon={<ShoppingCart size={16} />} color="bg-blue-50 text-blue-600" />
          <MiniStat title="New Received" value={newReceivedOrders} icon={<Zap size={16} />} color="bg-purple-50 text-purple-600" />
          <MiniStat title="Pending" value={pendingOrders} icon={<Clock size={16} />} color="bg-yellow-50 text-yellow-600" />
          <MiniStat title="Completed" value={completedOrders} icon={<CheckCircle size={16} />} color="bg-green-50 text-green-600" />
          <MiniStat title="Cancelled" value={cancelledOrders} icon={<XCircle size={16} />} color="bg-red-50 text-red-600" />
          <MiniStat title="Returned" value={returnedOrders} icon={<RefreshCw size={16} />} color="bg-orange-50 text-orange-600" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Product Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard title="Total Products" value={totalProducts.toString()} change="In database" icon={<Package className="text-primary" />} />
          <StatCard title="Active Products" value={activeProducts.toString()} change="Visible to customers" icon={<Eye className="text-blue-500" />} />
          <StatCard title="Out of Stock" value={outOfStockProducts.toString()} change="Requires restock" icon={<AlertTriangle className="text-red-500" />} />
          <StatCard title="Low Inventory (<5)" value={lowInventoryProducts.toString()} change="Running low" icon={<Clock className="text-orange-500" />} />
          <StatCard title="Products in Wishlist" value={totalWishlistSaves.toString()} change={`${uniqueWishlistedProducts} unique items`} icon={<Heart className="text-rose-500" />} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500">{change}</p>
    </div>
  );
}

function MiniStat({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 leading-tight">{title}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}
