-- Add Bangladeshi Markets
INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
VALUES 
    ('Will Bangladesh win the ODI Series vs Zimbabwe (2026)?', 'Winner prediction for the upcoming 3-match ODI series against Zimbabwe.', 'Sports', NOW() + INTERVAL '30 days', NOW() + INTERVAL '45 days', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'),
    ('Will Dhaka Metro Rail daily ridership cross 500k by Dec 2026?', 'Prediction on average daily passenger count for MRT Line 6.', 'Infrastructure', NOW() + INTERVAL '300 days', NOW() + INTERVAL '330 days', 'https://images.unsplash.com/photo-1555883038-73599d14a51e?w=400'),
    ('Will ''Toofan 2'' movie gross over 50 Crore BDT?', 'Box office prediction for the sequel of the hit movie Toofan.', 'Entertainment', NOW() + INTERVAL '120 days', NOW() + INTERVAL '150 days', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'),
    ('Will Bangladesh Forex Reserves exceed $25B by Dec 2026?', 'Economic indicator prediction based on Bangladesh Bank data.', 'Economy', NOW() + INTERVAL '200 days', NOW() + INTERVAL '300 days', 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=400'),
    ('Who will win the next DNCC Mayoral Election?', 'Prediction for Dhaka North City Corporation mayoral race.', 'Politics', NOW() + INTERVAL '60 days', NOW() + INTERVAL '90 days', 'https://images.unsplash.com/photo-1540910419868-474947cebac4?w=400')
ON CONFLICT DO NOTHING;
