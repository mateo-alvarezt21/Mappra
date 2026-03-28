import type { ReactNode } from 'react';

export type AppointmentStatus = 'Confirmada' | 'Pendiente' | 'Cancelada' | 'En consulta';

export interface Appointment {
  id: string;
  time: string;
  ampm: string;
  patientName: string;
  specialty: string;
  doctor: string;
  status: AppointmentStatus;
  date: string; // ISO date string YYYY-MM-DD
  color?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: ReactNode;
  color: string;
}

export interface ValidationRecord {
  id: string;
  patientName: string;
  document: string;
  eps: string;
  status: 'Activa' | 'Pendiente' | 'Sin cobertura';
  date: string;
}
