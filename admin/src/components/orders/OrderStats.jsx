import React from 'react';

const OrderStats = ({ orders }) => {
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Ordered').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    revenue: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Orders"
        value={stats.total}
        icon="📦"
        color="blue"
      />
      <StatCard
        label="Pending"
        value={stats.pending}
        icon="⏳"
        color="yellow"
      />
      <StatCard
        label="Delivered"
        value={stats.delivered}
        icon="✅"
        color="green"
      />
      <StatCard
        label="Total Revenue"
        value={`₹${stats.revenue.toFixed(2)}`}
        icon="💰"
        color="indigo"
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-70">{icon}</div>
      </div>
    </div>
  );
};

export default OrderStats;
