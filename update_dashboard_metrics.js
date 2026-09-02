const fs = require('fs');
const file = 'src/pages/storeadmin/Dashboard.tsx';

let content = fs.readFileSync(file, 'utf8');

// Update MiniStat value type to string | number
content = content.replace(
  'function MiniStat({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string })',
  'function MiniStat({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string })'
);

// Add avgOrderValue calculation
content = content.replace(
  'const returnedOrders = orders.filter(o => o.status === \'returned\').length;',
  'const returnedOrders = orders.filter(o => o.status === \'returned\').length;\n  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;'
);

// Update grid and add Avg Order Value
const oldGrid = `<div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <MiniStat title="Total Orders" value={totalOrders} icon={<ShoppingCart size={16} />} color="bg-blue-50 text-blue-600" />
          <MiniStat title="New Received" value={newReceivedOrders} icon={<Zap size={16} />} color="bg-purple-50 text-purple-600" />
          <MiniStat title="Pending" value={pendingOrders} icon={<Clock size={16} />} color="bg-yellow-50 text-yellow-600" />
          <MiniStat title="Completed" value={completedOrders} icon={<CheckCircle size={16} />} color="bg-green-50 text-green-600" />
          <MiniStat title="Cancelled" value={cancelledOrders} icon={<XCircle size={16} />} color="bg-red-50 text-red-600" />
          <MiniStat title="Returned" value={returnedOrders} icon={<RefreshCw size={16} />} color="bg-orange-50 text-orange-600" />
        </div>`;

const newGrid = `<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat title="Total Orders" value={totalOrders} icon={<ShoppingCart size={16} />} color="bg-blue-50 text-blue-600" />
          <MiniStat title="New Received" value={newReceivedOrders} icon={<Zap size={16} />} color="bg-purple-50 text-purple-600" />
          <MiniStat title="Pending" value={pendingOrders} icon={<Clock size={16} />} color="bg-yellow-50 text-yellow-600" />
          <MiniStat title="Completed" value={completedOrders} icon={<CheckCircle size={16} />} color="bg-green-50 text-green-600" />
          <MiniStat title="Cancelled" value={cancelledOrders} icon={<XCircle size={16} />} color="bg-red-50 text-red-600" />
          <MiniStat title="Returned" value={returnedOrders} icon={<RefreshCw size={16} />} color="bg-orange-50 text-orange-600" />
          <MiniStat title="Avg Order Value" value={\`$\${avgOrderValue.toFixed(2)}\`} icon={<DollarSign size={16} />} color="bg-emerald-50 text-emerald-600" />
        </div>`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync(file, content);
