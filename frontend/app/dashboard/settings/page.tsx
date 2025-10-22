'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api, ApiError } from '@/components/lib/api';

// Define the Practice type on the frontend as well
interface Practice {
  id: string;
  name: string | null;
  phone: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  logo_url: string | null;
  branding_colors: {
    primary?: string;
    secondary?: string;
  } | null;
  email: string | null;
  website_url: string | null;
  isonboarded: boolean | null;
}

type PracticeUpdateData = Omit<Practice, 'id'>;

const API_ENDPOINT = '/settings'; // Centralize the API endpoint URL

export default function SettingsPage() {
  const [settings, setSettings] = useState<PracticeUpdateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // Use the centralized API helper to fetch data
        const data = await api.get<Practice>(API_ENDPOINT);
        const { id, ...updatableData } = data;
        setSettings(updatableData);
      } catch (err) {
        // Handle specific API errors or generic errors
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSuccessMessage(null);
    setError(null);

    try {
      // Use the centralized API helper to send data
      const updatedData = await api.put<Practice>(API_ENDPOINT, settings);
      const { id, ...updatableData } = updatedData;
      setSettings(updatableData);
      setSuccessMessage('Settings updated successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    }
  };

  if (isLoading) return <div>Loading settings...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!settings) return <div>No settings found.</div>;

  return (
    <div>
      <h1>Practice Settings</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Practice Name</label>
          <input type="text" id="name" name="name" value={settings.name || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="email">Contact Email</label>
          <input type="email" id="email" name="email" value={settings.email || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" value={settings.phone || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="website_url">Website URL</label>
          <input type="url" id="website_url" name="website_url" value={settings.website_url || ''} onChange={handleInputChange} />
        </div>
        {/* Add more fields for address, logo_url, branding_colors as needed */}
        {/* For JSONB fields like address, you might want separate inputs */}
        
        <button type="submit">Save Changes</button>
      </form>
      {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
    </div>
  );
}