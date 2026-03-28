// Domain types shared between apps/web and apps/api

export type AppointmentStatus =
  | 'Confirmada'
  | 'Pendiente'
  | 'Cancelada'
  | 'En consulta';

export interface Appointment {
  id: string;
  time: string;
  ampm: string;
  patientName: string;
  specialty: string;
  doctor: string;
  status: AppointmentStatus;
  date: string; // ISO date YYYY-MM-DD
  color?: string;
}

export interface ValidationRecord {
  id: string;
  patientName: string;
  document: string;
  eps: string;
  status: 'Activa' | 'Pendiente' | 'Sin cobertura';
  date: string;
}

export interface Patient {
  id: string;
  name: string;
  document: string;
  eps: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
