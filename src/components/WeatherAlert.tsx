import { CloudRain, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherAlertProps {
  weather: any;
}

export default function WeatherAlert({ weather }: WeatherAlertProps) {
  if (!weather) return null;

  const isStormy = weather.current_weather.weathercode > 50; // Simple threshold
  const precipitation = weather.hourly.precipitation[0];

  return (
    <AnimatePresence>
      {isStormy && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">Storm Prediction Active</h4>
              <p className="text-xs opacity-90">Expected rainfall: {precipitation}mm. High runoff risk detected.</p>
            </div>
          </div>
          <button className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-50 transition-colors whitespace-nowrap">
            View Risk Map
            <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
