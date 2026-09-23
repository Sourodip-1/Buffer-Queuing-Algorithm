import React, { createContext, useContext, useState } from 'react';

export interface Alert {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  isRead: boolean;
  type: 'queue';
  details?: string;
}

const MOCK_ALERTS: Alert[] = [
  { 
    id: '1', 
    title: "It's almost your turn!", 
    subtitle: 'You are next at Blue Bean Cafe.', 
    time: 'Just now', 
    isRead: false, 
    type: 'queue',
    details: 'Please head towards the pickup counter. Your order #492 is being prepared and will be ready in approximately 2 minutes.'
  },
  { 
    id: '2', 
    title: 'Queue Update', 
    subtitle: 'Wait time increased by 5 mins at DMV.', 
    time: '10m ago', 
    isRead: true, 
    type: 'queue',
    details: 'Due to higher than expected volume, the wait time has been adjusted. Your current estimated wait time is 45 minutes.'
  },
  { 
    id: '3', 
    title: 'Ticket Expiring Soon', 
    subtitle: 'Your ticket for Tech Conference will expire in 10 minutes.', 
    time: '2h ago', 
    isRead: false, 
    type: 'queue',
    details: 'If you are not present when your number is called, your ticket will be forfeited.'
  },
];

interface NotificationContextType {
  alerts: Alert[];
  unreadCount: number;
  markAllAsRead: () => void;
  deleteAlert: (id: string) => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ alerts, unreadCount, markAllAsRead, deleteAlert, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
