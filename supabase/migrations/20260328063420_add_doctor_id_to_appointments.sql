-- Add doctor_id to appointments if it doesn't exist
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Unique constraint: one appointment per doctor per time slot (excluding cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_time
  ON appointments (doctor_id, scheduled_date, scheduled_time)
  WHERE status <> 'Cancelada';