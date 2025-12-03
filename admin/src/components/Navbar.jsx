import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { getOrders } from '../lib/orderApi';

const pathNameMap = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/inventory": "Inventory",
  "/management": "Management",
  "/customers": "Customers",
  "/delivery-status": "Delivery Status",
  "/blogs": "Blogs",
  "/payment": "Payment",
  "/product-management": "Product Managment"
};

const SEEN_STORAGE_KEY = 'admin_seen_order_ids';

const Navbar = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pathNameMap[location.pathname] || "Dashboard";
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenOrderIds, setSeenOrderIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const orders = await getOrders();
      const sorted = [...orders].sort((a, b) => {
        const aDate = new Date(a.order_date || a.date || a.created_at || a.createdAt || 0);
        const bDate = new Date(b.order_date || b.date || b.created_at || b.createdAt || 0);
        return bDate - aDate;
      });
      const storedSeen = (() => {
        try {
          return JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY)) || [];
        } catch {
          return [];
        }
      })();
      const newOrders = sorted.filter(order => !storedSeen.includes(order.id));
      setNotifications(sorted.slice(0, 5));
      setUnreadCount(newOrders.length);
      setSeenOrderIds(storedSeen);
    } catch (error) {
      console.error('Failed to load order notifications', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchNotifications();
    };
    init();
    const interval = setInterval(() => {
      if (isMounted) fetchNotifications();
    }, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const persistSeen = (ids) => {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids));
    setSeenOrderIds(ids);
  };

  const markAllRead = () => {
    const combined = Array.from(new Set([...seenOrderIds, ...notifications.map(n => n.id)]));
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(combined));
    setSeenOrderIds(combined);
    setUnreadCount(0);
  };

  const markSingleRead = (orderId) => {
    if (seenOrderIds.includes(orderId)) return;
    const updated = [...seenOrderIds, orderId];
    persistSeen(updated);
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  };

  const handleNotificationClick = (order) => {
    markSingleRead(order.id);
    setDropdownOpen(false);
    navigate('/orders', { state: { focusOrderId: order.id } });
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("http://localhost:3001/api/login/logout", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onLogout) onLogout();
    navigate("/");
  };

  return (
    <header className="w-full bg-white shadow px-6 py-4 flex justify-between items-center ml-2">
      <div className="text-lg font-semibold">{title}</div>
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 00-2.311 6.022c1.766.68 3.56 1.18 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No recent orders</div>
                ) : (
                  notifications.map(order => {
                    const isNew = !seenOrderIds.includes(order.id);
                    const orderDate = new Date(order.order_date || order.date || order.created_at || order.createdAt || Date.now());
                    return (
                      <button
                        type="button"
                        key={order.id}
                        onClick={() => handleNotificationClick(order)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${isNew ? 'bg-blue-50' : ''}`}
                      >
                        <p className="font-semibold text-gray-800 flex items-center justify-between">
                          <span>Order #{order.id}</span>
                          {isNew && <span className="text-xs text-blue-600">New</span>}
                        </p>
                        <p className="text-gray-600 text-xs">{order.customer_name || 'Customer'} • {order.items?.length ? `${order.items.length} item(s)` : 'Order placed'}</p>
                        <p className="text-gray-500 text-xs mt-1">{orderDate.toLocaleString()}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        {user.username && (
          <span className="text-gray-700 font-medium">{user.username}</span>
        )}
        <button 
          onClick={handleLogout} 
          className="bg-red-500 text-white p-2 rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
