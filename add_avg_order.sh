sed -i 's/const totalPendingPayment = orders.filter(o => o.status === '"'"'pending'"'"' || o.status === '"'"'processing'"'"').reduce((sum, o) => sum + o.total, 0);/const totalPendingPayment = orders.filter(o => o.status === '"'"'pending'"'"' || o.status === '"'"'processing'"'"').reduce((sum, o) => sum + o.total, 0);\n  const avgOrderValue = orders.length > 0 ? totalRevenue \/ orders.length : 0;/g' src/pages/storeadmin/Dashboard.tsx

sed -i 's/lg:grid-cols-4/lg:grid-cols-5/g' src/pages/storeadmin/Dashboard.tsx

sed -i '/<StatCard title="Pending Payments"/a\
          <StatCard title="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} change="Per order" icon={<DollarSign className="text-indigo-500" />} />
' src/pages/storeadmin/Dashboard.tsx
