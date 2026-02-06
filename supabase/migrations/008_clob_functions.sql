-- Function to atomically update filled amount and status
CREATE OR REPLACE FUNCTION increment_filled(p_order_id UUID, p_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_size DECIMAL;
  v_filled DECIMAL;
  v_new_filled DECIMAL;
BEGIN
  -- Lock the row
  SELECT size, filled INTO v_size, v_filled
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE;

  v_new_filled := v_filled + p_amount;

  UPDATE order_book
  SET 
    filled = v_new_filled,
    updated_at = NOW(),
    status = CASE 
      WHEN v_new_filled >= v_size THEN 'FILLED'
      ELSE 'PARTIAL'
    END
  WHERE id = p_order_id;
END;
$$;
