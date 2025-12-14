-- Secret Santa Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- 1. Create Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Participants Table
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_code VARCHAR(6) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_ready BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Drawings Table (to track who drew whom)
CREATE TABLE IF NOT EXISTS drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_code VARCHAR(6) NOT NULL,
    drawer_name VARCHAR(255) NOT NULL,
    drawn_name VARCHAR(255) NOT NULL,
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_code, drawer_name) -- Each person can only draw once per group
);

-- 4. Add Foreign Key Constraints (drop first if they exist)
ALTER TABLE participants 
DROP CONSTRAINT IF EXISTS fk_participants_group;

ALTER TABLE participants 
ADD CONSTRAINT fk_participants_group 
FOREIGN KEY (group_code) REFERENCES groups(group_code) ON DELETE CASCADE;

ALTER TABLE drawings 
DROP CONSTRAINT IF EXISTS fk_drawings_group;

ALTER TABLE drawings 
ADD CONSTRAINT fk_drawings_group 
FOREIGN KEY (group_code) REFERENCES groups(group_code) ON DELETE CASCADE;

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_participants_group_code ON participants(group_code);
CREATE INDEX IF NOT EXISTS idx_participants_group_code_name ON participants(group_code, LOWER(name));

-- Create unique index for case-insensitive name constraint (prevents duplicate names in same group)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_name 
ON participants(group_code, LOWER(name));

CREATE INDEX IF NOT EXISTS idx_drawings_group_code ON drawings(group_code);
CREATE INDEX IF NOT EXISTS idx_drawings_drawer ON drawings(group_code, drawer_name);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies (Allow public read/write for this app)
-- Note: For production, you might want to add authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read groups" ON groups;
DROP POLICY IF EXISTS "Allow public insert groups" ON groups;
DROP POLICY IF EXISTS "Allow public read participants" ON participants;
DROP POLICY IF EXISTS "Allow public insert participants" ON participants;
DROP POLICY IF EXISTS "Allow public update participants" ON participants;
DROP POLICY IF EXISTS "Allow public read drawings" ON drawings;
DROP POLICY IF EXISTS "Allow public insert drawings" ON drawings;

-- Groups: Allow anyone to read and insert
CREATE POLICY "Allow public read groups" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert groups" ON groups
    FOR INSERT WITH CHECK (true);

-- Participants: Allow anyone to read and insert
CREATE POLICY "Allow public read participants" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert participants" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update participants" ON participants
    FOR UPDATE USING (true);

-- Drawings: Allow anyone to read and insert
CREATE POLICY "Allow public read drawings" ON drawings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert drawings" ON drawings
    FOR INSERT WITH CHECK (true);

-- 8. Create Function to Update Updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create Trigger for Groups Table
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create Function to Get Participant Count
CREATE OR REPLACE FUNCTION get_participant_count(p_group_code VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM participants WHERE group_code = p_group_code);
END;
$$ LANGUAGE plpgsql;

-- 11. Create Function to Get Ready Count
CREATE OR REPLACE FUNCTION get_ready_count(p_group_code VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM participants WHERE group_code = p_group_code AND is_ready = true);
END;
$$ LANGUAGE plpgsql;

-- 12. Create View for Group Status
CREATE OR REPLACE VIEW group_status AS
SELECT 
    g.group_code,
    g.created_at,
    COUNT(DISTINCT p.id) as total_participants,
    COUNT(DISTINCT CASE WHEN p.is_ready THEN p.id END) as ready_participants,
    COUNT(DISTINCT d.id) as total_drawings
FROM groups g
LEFT JOIN participants p ON g.group_code = p.group_code
LEFT JOIN drawings d ON g.group_code = d.group_code
GROUP BY g.group_code, g.created_at;

-- Optional: Add some helpful comments
COMMENT ON TABLE groups IS 'Stores Secret Santa groups';
COMMENT ON TABLE participants IS 'Stores participants in each group';
COMMENT ON TABLE drawings IS 'Stores who drew whom in each group';
COMMENT ON COLUMN participants.is_ready IS 'True when participant has entered their name and is ready to draw';

