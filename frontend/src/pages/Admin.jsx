import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign, TrendingUp,
  AlertTriangle, Users, Eye, ChevronDown, RefreshCw, Edit2, Save, X
} from 'lucide-react';
import { adminApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const { data } = await adminApi.getDashboard();
        setDashboard(data);
      } else if (activeTab === 'orders') {
        const { data } = await adminApi.getOrders({});
        setOrders(data.orders);
      } else if (activeTab === 'products') {
        const { data } = await adminApi.getProducts();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${orderId} updated to ${newStatus}`);
      setEditingOrder(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      await adminApi.updateProduct(id, updates);
      toast.success('Product updated!');
      setEditingProduct(null);
      fetchData();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary-600" /> Admin Panel
            </h1>
            <button onClick={fetchData} className="btn-outline text-sm py-2 px-3">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? <LoadingSpinner text="Loading..." /> : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && dashboard && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Revenue', value: `$${dashboard.stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                    { label: 'Total Orders', value: dashboard.stats.totalOrders, icon: ShoppingCart, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
                    { label: 'Products', value: dashboard.stats.totalProducts, icon: Package, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/20' },
                    { label: 'Low Stock', value: dashboard.stats.lowStockProducts, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Products</h3>
                    {dashboard.topProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No sales yet</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.topProducts.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{p.sold} sold</p>
                            </div>
                            <span className="text-sm font-bold">${p.revenue.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Recent Orders</h3>
                    {dashboard.recentOrders.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No orders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.recentOrders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div>
                              <p className="text-sm font-medium">{order.id}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">${order.total.toFixed(2)}</p>
                              <span className={`text-xs font-medium ${
                                order.status === 'confirmed' ? 'text-green-600' : order.status === 'pending' ? 'text-amber-600' : 'text-primary-600'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {orders.length === 0 ? (
                  <div className="card p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-1">No orders yet</p>
                    <p className="text-gray-500 dark:text-gray-400">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-bold">{order.id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer.name} &middot; {order.customer.email}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                            {editingOrder === order.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  defaultValue={order.status}
                                  onChange={e => updateOrderStatus(order.id, e.target.value)}
                                  className="input-field text-sm py-1.5 w-auto"
                                >
                                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <button onClick={() => setEditingOrder(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setEditingOrder(order.id)} className="flex items-center gap-1.5">
                                <span className={`badge px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                  order.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                }`}>
                                  {order.status}
                                </span>
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map(item => (
                            <div key={item.productId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                              <img src={item.image} alt="" className="w-6 h-6 rounded object-cover" />
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-400">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid gap-4">
                  {products.map(product => (
                    <div key={product.id} className="card p-5">
                      <div className="flex gap-4">
                        <img src={product.images[0]} alt={product.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold">{product.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{product.category} / {product.subcategory}</p>
                            </div>
                            <button
                              onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                            <span className="font-bold text-lg">${product.price}</span>
                            <span className={`badge px-2 py-1 rounded-lg ${product.stock < 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                              Stock: {product.stock}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">Sold: {product.totalSold}</span>
                            <span className="text-gray-500 dark:text-gray-400">Rating: {product.rating} ({product.reviewCount})</span>
                            {product.featured && <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-1 rounded-lg">Featured</span>}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {editingProduct === product.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                          >
                            <ProductEditForm
                              product={product}
                              onSave={updateProduct}
                              onCancel={() => setEditingProduct(null)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ProductEditForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    price: product.price,
    stock: product.stock,
    featured: product.featured
  });

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          className="input-field text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Stock</label>
        <input
          type="number"
          value={form.stock}
          onChange={e => setForm({ ...form, stock: e.target.value })}
          className="input-field text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Featured</label>
        <select
          value={form.featured}
          onChange={e => setForm({ ...form, featured: e.target.value === 'true' })}
          className="input-field text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div className="sm:col-span-3 flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Cancel</button>
        <button onClick={() => onSave(product.id, form)} className="btn-primary text-sm py-2 px-4">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}
