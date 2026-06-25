ALTER TABLE reservations
  ADD COLUMN comprobante_url text,
  ADD COLUMN comprobante_uploaded_at timestamptz;
