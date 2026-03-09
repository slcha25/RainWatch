import React, { useState } from 'react';
import { MapPin, AlertTriangle, Droplets, Waves, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function ReportForm({ isOpen, onClose, onSubmit }: ReportFormProps) {
  const [formData, setFormData] = useState({
    address: '',
    type: 'Water Pooling',
    description: '',
    phone: '',
    lat: 39.0458, // Default Montgomery area
    lng: -77.1975
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate getting coordinates from address
    const randomOffset = () => (Math.random() - 0.5) * 0.05;
    onSubmit({
      ...formData,
      lat: 39.0458 + randomOffset(),
      lng: -77.1975 + randomOffset()
    });
    setFormData({ address: '', type: 'Water Pooling', description: '', phone: '', lat: 39.0458, lng: -77.1975 });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-black/5"
          >
            <div className="p-6 border-bottom border-black/5 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-orange-500 w-5 h-5" />
                Report Water Issue
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. 123 Main St, Montgomery"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Water Pooling', icon: Droplets },
                    { id: 'Runoff', icon: Waves },
                    { id: 'Drainage', icon: AlertTriangle }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: item.id })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        formData.type === item.id 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold uppercase">{item.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the flooding or runoff behavior..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone (for update notices)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                Submit Report
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
