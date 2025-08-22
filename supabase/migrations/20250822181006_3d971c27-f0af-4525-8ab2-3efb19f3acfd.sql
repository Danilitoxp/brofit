-- Upload Brofit logo to public storage bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('exercise-images', 'brofit-logo.png', auth.uid(), '{"size": 50000, "mimetype": "image/png"}')
ON CONFLICT (bucket_id, name) DO NOTHING;