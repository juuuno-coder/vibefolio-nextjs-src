
-- Add location columns to Comment table for image annotation
-- We use FLOAT or NUMERIC to store percentage coordinates (0-100)
ALTER TABLE "Comment"
ADD COLUMN location_x NUMERIC(5, 2), -- X coordinate in %
ADD COLUMN location_y NUMERIC(5, 2); -- Y coordinate in %

-- Add index for potential filtering
CREATE INDEX idx_comment_location ON "Comment"(location_x, location_y);
