import { useEffect, useState, useCallback } from 'react';

export interface Complaint {
  id: number;
  address: string;
  lat: number;
  lng: number;
  type: string;
  description: string;
  timestamp: string;
}

export interface Recommendation {
  id: number;
  lat: number;
  lng: number;
  zone_name: string;
  type: string;
  priority: string;
  reason: string;
}

export interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  hourly: {
    precipitation: number[];
  };
}

export const useRainWatchData = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [userHistory, setUserHistory] = useState<{ reports: Complaint[], logins: { timestamp: string }[] } | null>(null);

  // Use useCallback so fetchUserHistory has a stable reference and can be
  // safely called from anywhere (submitComplaint, WebSocket handlers, App.tsx)
  const fetchUserHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/user/history');
      if (res.ok) {
        const data = await res.json();
        setUserHistory(data);
      }
    } catch (err) {
      console.error("Error fetching user history:", err);
    }
  }, []);

  // Fetch the full complaints list from the server
  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        setComplaints(await res.json());
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  }, []);

  // Fetch the full recommendations list from the server
  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        setRecommendations(await res.json());
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000;

    const fetchData = async () => {
      try {
        const [compRes, recRes, weatherRes] = await Promise.all([
          fetch('/api/complaints'),
          fetch('/api/recommendations'),
          fetch('/api/weather')
        ]);

        if (!compRes.ok || !recRes.ok || !weatherRes.ok) {
          throw new Error(`One or more API calls failed: ${compRes.status}, ${recRes.status}, ${weatherRes.status}`);
        }

        setComplaints(await compRes.json());
        setRecommendations(await recRes.json());
        setWeather(await weatherRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying fetch (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
          setTimeout(fetchData, retryDelay);
        }
      }
    };

    fetchData();
    fetchUserHistory();

    // WebSocket for real-time updates
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}`);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NEW_COMPLAINT') {
            // Add new complaint to map immediately via WebSocket push
            setComplaints(prev => {
              if (prev.some(c => c.id === message.data.id)) return prev;
              return [message.data, ...prev];
            });
            // Refresh user history so the history panel updates too
            fetchUserHistory();
          } else if (message.type === 'NEW_RECOMMENDATION') {
            setRecommendations(prev => {
              if (prev.some(r => r.id === message.data.id)) return prev;
              return [message.data, ...prev];
            });
          } else if (message.type === 'NEW_LOGIN') {
            // Refresh login history when a new login is recorded
            fetchUserHistory();
          }
        } catch (err) {
          console.error("WebSocket message error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting...");
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws?.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [fetchUserHistory]);

  const submitComplaint = useCallback(async (complaint: Omit<Complaint, 'id' | 'timestamp'>) => {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint)
    });
    const data = await res.json();

    // Immediately add the new complaint to state so the map updates without
    // waiting for the WebSocket echo (handles slow/disconnected WS gracefully)
    if (data && data.id) {
      setComplaints(prev => {
        if (prev.some(c => c.id === data.id)) return prev;
        return [data, ...prev];
      });
    }

    // Refresh full complaints list and user history to ensure everything is in sync
    await Promise.all([
      fetchComplaints(),
      fetchUserHistory(),
    ]);

    return data;
  }, [fetchComplaints, fetchUserHistory]);

  return {
    complaints,
    recommendations,
    weather,
    submitComplaint,
    userHistory,
    fetchUserHistory,
    fetchComplaints,
    fetchRecommendations,
  };
};
