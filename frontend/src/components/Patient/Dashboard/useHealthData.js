import { useState, useEffect, useCallback, useRef } from 'react';

const GOOGLE_FIT_CLIENT_ID = process.env.REACT_APP_GOOGLE_FIT_CLIENT_ID || '';
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read',
].join(' ');

const HEART_RATE_SERVICE = 0x180D;
const HEART_RATE_CHARACTERISTIC = 0x2A37;

const buildDemoHistory = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      steps: Math.floor(3000 + Math.random() * 7000),
      heartRate: Math.floor(62 + Math.random() * 25),
      calories: Math.floor(150 + Math.random() * 350),
    };
  });
};

export default function useHealthData() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [deviceName, setDeviceName] = useState('');
  const [heartRate, setHeartRate] = useState(null);
  const [steps, setSteps] = useState(null);
  const [calories, setCalories] = useState(null);
  const [history, setHistory] = useState(buildDemoHistory());
  const [error, setError] = useState('');

  const bleDeviceRef = useRef(null);
  const bleCharRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const historyIntervalRef = useRef(null);

  const startDemo = useCallback(() => {
    setConnectionStatus('demo');
    setDeviceName('Demo Mode');
    setSteps(4500);
    setHeartRate(72);
    setCalories(210);
    setHistory(buildDemoHistory());

    // Simulate live sensor ticks every 3 seconds
    demoIntervalRef.current = setInterval(() => {
      setHeartRate(prev => Math.min(120, Math.max(55, (prev || 72) + Math.floor(Math.random() * 7) - 3)));
      setSteps(prev => (prev || 4500) + Math.floor(Math.random() * 12));
      setCalories(prev => (prev || 210) + Math.floor(Math.random() * 3));
    }, 3000);

    // Update chart history every 30 seconds
    historyIntervalRef.current = setInterval(() => {
      setHistory(prev => {
        const today = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.date === today) {
          next[next.length - 1] = {
            ...last,
            steps: last.steps + 50,
            heartRate: Math.floor(62 + Math.random() * 25),
            calories: last.calories + 5,
          };
        }
        return next;
      });
    }, 30000);
  }, []);

  const stopDemo = useCallback(() => {
    clearInterval(demoIntervalRef.current);
    clearInterval(historyIntervalRef.current);
  }, []);

  // ── WEB BLUETOOTH ─────────────────────────────────────────────────────────────
  const connectBluetooth = useCallback(async () => {
    setError('');
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    try {
      setConnectionStatus('connecting');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [HEART_RATE_SERVICE],
      });
      bleDeviceRef.current = device;
      setDeviceName(device.name || 'BLE Device');

      device.addEventListener('gattserverdisconnected', () => {
        setConnectionStatus('disconnected');
        setHeartRate(null);
        setDeviceName('');
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      const char = await service.getCharacteristic(HEART_RATE_CHARACTERISTIC);
      bleCharRef.current = char;

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        // Heart rate value is in the second byte if the first bit of byte 0 is 0
        const hr = value.getUint8(0) & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
        setHeartRate(hr);
        // Record to history on each reading
        const now = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        setHistory(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last.date === now) {
            next[next.length - 1] = { ...last, heartRate: hr };
          }
          return next;
        });
      });

      setConnectionStatus('ble');
    } catch (err) {
      console.error('BLE connection error:', err);
      setError(err.message || 'Failed to connect to Bluetooth device.');
      setConnectionStatus('disconnected');
    }
  }, []);

  const disconnectBluetooth = useCallback(async () => {
    try {
      if (bleCharRef.current) {
        await bleCharRef.current.stopNotifications();
      }
      if (bleDeviceRef.current?.gatt?.connected) {
        bleDeviceRef.current.gatt.disconnect();
      }
    } catch (e) { /* ignore */ }
    setConnectionStatus('disconnected');
    setHeartRate(null);
    setDeviceName('');
  }, []);

  // ── GOOGLE FIT ────────────────────────────────────────────────────────────────
  const connectGoogleFit = useCallback(() => {
    setError('');
    if (!GOOGLE_FIT_CLIENT_ID || GOOGLE_FIT_CLIENT_ID === 'YOUR_GOOGLE_FIT_CLIENT_ID_HERE') {
      setError('Google Fit Client ID not set. Add REACT_APP_GOOGLE_FIT_CLIENT_ID to your .env file.');
      return;
    }

    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_FIT_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${encodeURIComponent(GOOGLE_FIT_SCOPES)}`;

    const popup = window.open(authUrl, 'googleFitAuth', 'width=500,height=600');

    const listener = async (event) => {
      if (event.origin !== window.location.origin) return;
      const { access_token } = event.data || {};
      if (!access_token) return;
      window.removeEventListener('message', listener);
      popup?.close();

      setConnectionStatus('connecting');
      setDeviceName('Google Fit');

      try {
        await fetchGoogleFitData(access_token);
        setConnectionStatus('gfit');
        // Refresh every 5 minutes
        setInterval(() => fetchGoogleFitData(access_token), 5 * 60 * 1000);
      } catch (e) {
        setError('Failed to fetch data from Google Fit.');
        setConnectionStatus('disconnected');
      }
    };
    window.addEventListener('message', listener);
  }, []);

  const fetchGoogleFitData = useCallback(async (token) => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const body = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.heart_rate.bpm' },
        { dataTypeName: 'com.google.calories.expended' },
      ],
      bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
      startTimeMillis: startOfDay.setDate(startOfDay.getDate() - 6),
      endTimeMillis: now,
    };

    const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    const buckets = data.bucket || [];
    const chartData = buckets.map(bucket => {
      const date = new Date(parseInt(bucket.startTimeMillis));
      const label = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      const getVal = (datasetIdx) => {
        const pts = bucket.dataset[datasetIdx]?.point || [];
        if (!pts.length) return 0;
        const v = pts[0].value[0];
        return Math.round(v.intVal || v.fpVal || 0);
      };

      return { date: label, steps: getVal(0), heartRate: getVal(1), calories: getVal(2) };
    });

    if (chartData.length) {
      setHistory(chartData);
      const latest = chartData[chartData.length - 1];
      setSteps(latest.steps);
      setHeartRate(latest.heartRate || null);
      setCalories(latest.calories);
    }
  }, []);

  // ── DISCONNECT ALL ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (connectionStatus === 'ble') disconnectBluetooth();
    else if (connectionStatus === 'demo') { stopDemo(); setConnectionStatus('disconnected'); setDeviceName(''); }
    else setConnectionStatus('disconnected');
    setSteps(null);
    setCalories(null);
    setHeartRate(null);
  }, [connectionStatus, disconnectBluetooth, stopDemo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(demoIntervalRef.current);
      clearInterval(historyIntervalRef.current);
    };
  }, []);

  return {
    connectionStatus,
    deviceName,
    heartRate,
    steps,
    calories,
    history,
    error,
    connectBluetooth,
    connectGoogleFit,
    startDemo,
    disconnect,
  };
}
