import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Recommendation, Complaint } from '../services/api';
import { Droplets, MapPin, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  recommendations: Recommendation[];
  complaints: Complaint[];
}

export default function Dashboard({ recommendations, complaints }: DashboardProps) {
  const chartData = [
    { name: 'Pooling', count: complaints.filter(c => c.type === 'Water Pooling').length },
    { name: 'Runoff', count: complaints.filter(c => c.type === 'Runoff').length },
    { name: 'Drainage', count: complaints.filter(c => c.type === 'Drainage').length },
  ];

  const totalCaptured = recommendations.length * 400; // Mock calculation

  return (
    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Droplets className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. Capture</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalCaptured.toLocaleString()} <span className="text-sm font-medium opacity-60">gal</span></div>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Recs</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{recommendations.length} <span className="text-sm font-medium opacity-60">sites</span></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          Complaint Distribution
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#f97316', '#ef4444'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
          Smart Barrel Sites
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Predictive</span>
        </h3>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-medium">No recommendations yet.<br/>Submit reports to trigger analysis.</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={rec.id}
              className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:border-green-200 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                    {rec.zone_name.split(' ')[1]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rec.type}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {rec.lat.toFixed(4)}, {rec.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">
                "{rec.reason}"
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
