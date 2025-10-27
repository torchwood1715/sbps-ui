import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

interface Device {
  id: number;
  name: string;
  mqttPrefix: string;
  deviceType: 'POWER_MONITOR' | 'SWITCHABLE_APPLIANCE';
  priority: number;
  wattage: number;
}

export const DashboardPage = () => {
  const { logout } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Fetch devices when the component mounts
  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      setDeviceError(null);
      try {
        const response = await apiClient.get<Device[]>('/devices');
        setDevices(response.data);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
        setDeviceError('Failed to load devices.');
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <h1>Dashboard (Protected)</h1>
      <button onClick={logout}>Logout</button>

      <hr />

      <h2>My Devices</h2>
      {loadingDevices && <p>Loading devices...</p>}
      {deviceError && <p style={{ color: 'red' }}>{deviceError}</p>}
      <ul>
        {devices.map((device) => (
          <li key={device.id}>
            {device.name} ({device.deviceType})
            {/* TODO: Add toggle button here */}
          </li>
        ))}
      </ul>
    </div>
  );
};