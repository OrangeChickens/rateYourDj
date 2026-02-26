-- Migration 005: Expand style tags with genre_group / sub_group two-level hierarchy
-- Safe: additive only (new columns + new rows). Existing tag_name values unchanged.

-- Step 1: Add new columns
ALTER TABLE preset_tags
  ADD COLUMN genre_group VARCHAR(50) DEFAULT NULL,
  ADD COLUMN sub_group VARCHAR(50) DEFAULT NULL,
  ADD COLUMN sort_order INT DEFAULT 0;

-- Step 2: Update existing 10 style tags with genre/subgroup info
UPDATE preset_tags SET genre_group = 'House',   sub_group = 'Modern',          sort_order = 31  WHERE category = 'style' AND tag_name = 'Bass House';
UPDATE preset_tags SET genre_group = 'House',   sub_group = 'Deep & Melodic',  sort_order = 20  WHERE category = 'style' AND tag_name = 'Deep House';
UPDATE preset_tags SET genre_group = 'House',   sub_group = 'Deep & Melodic',  sort_order = 21  WHERE category = 'style' AND tag_name = 'Progressive House';
UPDATE preset_tags SET genre_group = 'House',   sub_group = 'Classic',         sort_order = 10  WHERE category = 'style' AND tag_name = 'House';
UPDATE preset_tags SET genre_group = 'Techno',  sub_group = 'Classic',         sort_order = 40  WHERE category = 'style' AND tag_name = 'Techno';
UPDATE preset_tags SET genre_group = 'Techno',  sub_group = 'Modern',          sort_order = 50  WHERE category = 'style' AND tag_name = 'Melodic Techno';
UPDATE preset_tags SET genre_group = 'Trance',  sub_group = 'Melodic',         sort_order = 70  WHERE category = 'style' AND tag_name = 'Trance';
UPDATE preset_tags SET genre_group = 'Bass Music', sub_group = 'Dubstep',      sort_order = 90  WHERE category = 'style' AND tag_name = 'Dubstep';
UPDATE preset_tags SET genre_group = 'EDM / Dance', sub_group = 'Main Stage',  sort_order = 120 WHERE category = 'style' AND tag_name = 'Big Room';
UPDATE preset_tags SET genre_group = 'Urban & Trap', sub_group = 'Trap',       sort_order = 170 WHERE category = 'style' AND tag_name = 'Trap';

-- Step 3: Insert new style tags (~61 new tags)

-- House - Classic
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Chicago House',    'Chicago House',    'House', 'Classic', 11),
('style', 'Acid House',       'Acid House',       'House', 'Classic', 12),
('style', 'Disco House',      'Disco House',      'House', 'Classic', 13);

-- House - Deep & Melodic
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Afro House',       'Afro House',       'House', 'Deep & Melodic', 22),
('style', 'Tropical House',   'Tropical House',   'House', 'Deep & Melodic', 23);

-- House - Modern
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Tech House',       'Tech House',       'House', 'Modern', 30),
('style', 'Future House',     'Future House',     'House', 'Modern', 32),
('style', 'Slap House',       'Slap House',       'House', 'Modern', 33);

-- House - Niche
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Micro House',      'Micro House',      'House', 'Niche', 34),
('style', 'Ambient House',    'Ambient House',    'House', 'Niche', 35);

-- Techno - Classic
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Detroit Techno',   'Detroit Techno',   'Techno', 'Classic', 41),
('style', 'Acid Techno',      'Acid Techno',      'Techno', 'Classic', 42);

-- Techno - Modern
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Minimal Techno',   'Minimal Techno',   'Techno', 'Modern', 51),
('style', 'Industrial Techno','Industrial Techno','Techno', 'Modern', 52);

-- Techno - Hard
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Hardcore Techno',  'Hardcore Techno',  'Techno', 'Hard', 55),
('style', 'Hard Techno',      'Hard Techno',      'Techno', 'Hard', 56);

-- Techno - Hypnotic
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Dub Techno',       'Dub Techno',       'Techno', 'Hypnotic', 60),
('style', 'Ambient Techno',   'Ambient Techno',   'Techno', 'Hypnotic', 61);

-- Trance - Melodic
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Uplifting Trance', 'Uplifting Trance', 'Trance', 'Melodic', 71),
('style', 'Progressive Trance','Progressive Trance','Trance','Melodic', 72);

-- Trance - Dark & Driving
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Psytrance',        'Psytrance',        'Trance', 'Dark & Driving', 75),
('style', 'Tech Trance',      'Tech Trance',      'Trance', 'Dark & Driving', 76);

-- Bass Music - Dubstep
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Riddim',           'Riddim',           'Bass Music', 'Dubstep', 91),
('style', 'Melodic Dubstep',  'Melodic Dubstep',  'Bass Music', 'Dubstep', 92);

-- Bass Music - Drum & Bass
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Drum & Bass',      'Drum & Bass',      'Bass Music', 'Drum & Bass', 95),
('style', 'Neurofunk',        'Neurofunk',        'Bass Music', 'Drum & Bass', 96),
('style', 'Jungle',           'Jungle',           'Bass Music', 'Drum & Bass', 97);

-- Bass Music - UK Bass
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'UK Garage',        'UK Garage',        'Bass Music', 'UK Bass', 100),
('style', 'Grime',            'Grime',            'Bass Music', 'UK Bass', 101),
('style', 'Bassline',         'Bassline',         'Bass Music', 'UK Bass', 102),
('style', 'Future Garage',    'Future Garage',    'Bass Music', 'UK Bass', 103);

-- EDM / Dance - Main Stage
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'EDM',              'EDM',              'EDM / Dance', 'Main Stage', 119),
('style', 'Electro House',    'Electro House',    'EDM / Dance', 'Main Stage', 121),
('style', 'Hardstyle',        'Hardstyle',        'EDM / Dance', 'Main Stage', 122);

-- EDM / Dance - Future Pop
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Future Bass',      'Future Bass',      'EDM / Dance', 'Future Pop', 125),
('style', 'Melbourne Bounce', 'Melbourne Bounce', 'EDM / Dance', 'Future Pop', 126),
('style', 'Moombahton',       'Moombahton',       'EDM / Dance', 'Future Pop', 127);

-- Breaks & Beats - Breakbeat
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Breakbeat',        'Breakbeat',        'Breaks & Beats', 'Breakbeat', 130),
('style', 'Big Beat',         'Big Beat',         'Breaks & Beats', 'Breakbeat', 131),
('style', 'Electro Swing',    'Electro Swing',    'Breaks & Beats', 'Breakbeat', 132);

-- Breaks & Beats - Footwork
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Footwork',         'Footwork',         'Breaks & Beats', 'Footwork', 135),
('style', 'Jersey Club',      'Jersey Club',      'Breaks & Beats', 'Footwork', 136);

-- Downtempo & Experimental - Ambient & Chill
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Ambient',          'Ambient',          'Downtempo & Experimental', 'Ambient & Chill', 140),
('style', 'Chillout',         'Chillout',         'Downtempo & Experimental', 'Ambient & Chill', 141),
('style', 'Downtempo',        'Downtempo',        'Downtempo & Experimental', 'Ambient & Chill', 142);

-- Downtempo & Experimental - Experimental
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'IDM',              'IDM',              'Downtempo & Experimental', 'Experimental', 145),
('style', 'Glitch Hop',       'Glitch Hop',       'Downtempo & Experimental', 'Experimental', 146),
('style', 'Trip Hop',         'Trip Hop',         'Downtempo & Experimental', 'Experimental', 147);

-- Downtempo & Experimental - Internet Era
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Vaporwave',        'Vaporwave',        'Downtempo & Experimental', 'Internet Era', 150),
('style', 'Hyperpop',         'Hyperpop',         'Downtempo & Experimental', 'Internet Era', 151),
('style', 'Wave',             'Wave',             'Downtempo & Experimental', 'Internet Era', 152);

-- Disco & Retro - Disco
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Disco',            'Disco',            'Disco & Retro', 'Disco', 155),
('style', 'Nu-Disco',         'Nu-Disco',         'Disco & Retro', 'Disco', 156);

-- Disco & Retro - Retro
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Synthwave',        'Synthwave',        'Disco & Retro', 'Retro', 160),
('style', 'Chillwave',        'Chillwave',        'Disco & Retro', 'Retro', 161);

-- Urban & Trap - Trap (Trap already exists, just add Phonk)
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Phonk',            'Phonk',            'Urban & Trap', 'Trap', 171);

-- Urban & Trap - Hybrid
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Hardwave',         'Hardwave',         'Urban & Trap', 'Hybrid', 175),
('style', 'UK Drill',         'UK Drill',         'Urban & Trap', 'Hybrid', 176);

-- China & Asia - 中国
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', '国风电音',          'Guofeng EDM',     'China & Asia', '中国', 180);

-- China & Asia - Asia-Pacific
INSERT INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'J-Core',           'J-Core',           'China & Asia', 'Asia-Pacific', 185),
('style', 'K-House',          'K-House',          'China & Asia', 'Asia-Pacific', 186),
('style', 'Bounce',           'Bounce',           'China & Asia', 'Asia-Pacific', 187);

-- Verification query (run after migration):
-- SELECT genre_group, sub_group, COUNT(*) as cnt
-- FROM preset_tags
-- WHERE category = 'style'
-- GROUP BY genre_group, sub_group
-- ORDER BY MIN(sort_order);
