'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '@/utils/supabase';

interface UserData {
  name: string;
  nickname: string;
  phone_number: string | null;
  birthdate: string | null;
  address: string | null;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function SettingsPage() {
  const { user, isLoading } = useUser();
  const [userData, setUserData] = useState<UserData>({
    name: '',
    nickname: '',
    phone_number: null,
    birthdate: null,
    address: null,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, nickname, phone_number, birthdate, address')
        .eq('auth0_id', user?.sub)
        .single();
      if (error) throw error;
      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const validateField = async (name: string, value: string | null): Promise<string> => {
    switch (name) {
      case 'name':
        return value && value.trim().length < 2 ? 'Name must be at least 2 characters long' : '';
      case 'nickname':
        if (!value || !/^[a-zA-Z0-9_-]{2,20}$/.test(value)) {
          return 'Nickname must be 2-20 characters and can only contain letters, numbers, underscores, and hyphens';
        }
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('id')
          .eq('nickname', value)
          .neq('auth0_id', user?.sub)
          .single();
        if (existingUserError && existingUserError.code !== 'PGRST116') {
          throw existingUserError;
        }
        return existingUser ? 'Nickname already exists' : '';
      case 'phone_number':
        return value && !/^\+?[1-9]\d{1,14}$/.test(value) ? 'Please enter a valid phone number' : '';
      case 'birthdate':
        if (value) {
          const date = new Date(value);
          const now = new Date();
          return date > now ? 'Birthdate cannot be in the future' : '';
        }
        return '';
      case 'address':
        return value && value.trim().length < 5 ? 'Please enter a valid address' : '';
      default:
        return '';
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    const error = await validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};
    for (const [key, value] of Object.entries(userData)) {
      const error = await validateField(key, value);
      if (error) newErrors[key] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);
    setMessage('');
    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to access settings.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        {Object.entries(userData).map(([key, value]) => (
          <div key={key} className="mb-4">
            <label htmlFor={key} className="block text-sm font-medium mb-1">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            <input
              type={key === 'birthdate' ? 'date' : key === 'phone_number' ? 'tel' : 'text'}
              id={key}
              name={key}
              value={value || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${errors[key] ? 'border-red-500' : ''}`}
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
          </div>
        ))}
        <button
          type="submit"
          disabled={isUpdating || Object.keys(errors).some(key => !!errors[key])}
          className="btn btn-primary"
        >
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </button>
        {message && <p className="mt-4 text-sm">{message}</p>}
      </form>
    </div>
  );
}