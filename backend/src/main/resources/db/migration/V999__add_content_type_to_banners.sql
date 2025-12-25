-- Add contentType column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS content_type VARCHAR(50);

-- Update existing banners to have default contentType 'banner'
UPDATE banners SET content_type = 'banner' WHERE content_type IS NULL;

