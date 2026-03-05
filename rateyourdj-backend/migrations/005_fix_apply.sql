-- Fix-up script for 005: update genre_group/sub_group on existing tags + insert missing ones
-- Uses INSERT IGNORE for idempotency

-- First, update ALL existing style tags with their genre_group/sub_group/sort_order

-- House - Classic
UPDATE preset_tags SET genre_group='House', sub_group='Classic', sort_order=10 WHERE category='style' AND tag_name='House';
UPDATE preset_tags SET genre_group='House', sub_group='Classic', sort_order=11 WHERE category='style' AND tag_name='Chicago House';
UPDATE preset_tags SET genre_group='House', sub_group='Classic', sort_order=12 WHERE category='style' AND tag_name='Acid House';
UPDATE preset_tags SET genre_group='House', sub_group='Classic', sort_order=13 WHERE category='style' AND tag_name='Disco House';

-- House - Deep & Melodic
UPDATE preset_tags SET genre_group='House', sub_group='Deep & Melodic', sort_order=20 WHERE category='style' AND tag_name='Deep House';
UPDATE preset_tags SET genre_group='House', sub_group='Deep & Melodic', sort_order=21 WHERE category='style' AND tag_name='Progressive House';
UPDATE preset_tags SET genre_group='House', sub_group='Deep & Melodic', sort_order=22 WHERE category='style' AND tag_name='Afro House';
UPDATE preset_tags SET genre_group='House', sub_group='Deep & Melodic', sort_order=23 WHERE category='style' AND tag_name='Tropical House';

-- House - Modern
UPDATE preset_tags SET genre_group='House', sub_group='Modern', sort_order=30 WHERE category='style' AND tag_name='Tech House';
UPDATE preset_tags SET genre_group='House', sub_group='Modern', sort_order=31 WHERE category='style' AND tag_name='Bass House';
UPDATE preset_tags SET genre_group='House', sub_group='Modern', sort_order=32 WHERE category='style' AND tag_name='Future House';
UPDATE preset_tags SET genre_group='House', sub_group='Modern', sort_order=33 WHERE category='style' AND tag_name='Slap House';

-- House - Niche
UPDATE preset_tags SET genre_group='House', sub_group='Niche', sort_order=34 WHERE category='style' AND tag_name='Micro House';
UPDATE preset_tags SET genre_group='House', sub_group='Niche', sort_order=35 WHERE category='style' AND tag_name='Ambient House';

-- Techno - Classic
UPDATE preset_tags SET genre_group='Techno', sub_group='Classic', sort_order=40 WHERE category='style' AND tag_name='Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Classic', sort_order=41 WHERE category='style' AND tag_name='Detroit Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Classic', sort_order=42 WHERE category='style' AND tag_name='Acid Techno';

-- Techno - Modern
UPDATE preset_tags SET genre_group='Techno', sub_group='Modern', sort_order=50 WHERE category='style' AND tag_name='Melodic Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Modern', sort_order=51 WHERE category='style' AND tag_name='Minimal Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Modern', sort_order=52 WHERE category='style' AND tag_name='Industrial Techno';

-- Techno - Hard
UPDATE preset_tags SET genre_group='Techno', sub_group='Hard', sort_order=55 WHERE category='style' AND tag_name='Hardcore Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Hard', sort_order=56 WHERE category='style' AND tag_name='Hard Techno';

-- Techno - Hypnotic
UPDATE preset_tags SET genre_group='Techno', sub_group='Hypnotic', sort_order=60 WHERE category='style' AND tag_name='Dub Techno';
UPDATE preset_tags SET genre_group='Techno', sub_group='Hypnotic', sort_order=61 WHERE category='style' AND tag_name='Ambient Techno';

-- Trance - Melodic
UPDATE preset_tags SET genre_group='Trance', sub_group='Melodic', sort_order=70 WHERE category='style' AND tag_name='Trance';
UPDATE preset_tags SET genre_group='Trance', sub_group='Melodic', sort_order=71 WHERE category='style' AND tag_name='Uplifting Trance';
UPDATE preset_tags SET genre_group='Trance', sub_group='Melodic', sort_order=72 WHERE category='style' AND tag_name='Progressive Trance';

-- Trance - Dark & Driving
UPDATE preset_tags SET genre_group='Trance', sub_group='Dark & Driving', sort_order=75 WHERE category='style' AND tag_name='Psytrance';
UPDATE preset_tags SET genre_group='Trance', sub_group='Dark & Driving', sort_order=76 WHERE category='style' AND tag_name='Tech Trance';

-- Bass Music - Dubstep
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Dubstep', sort_order=90 WHERE category='style' AND tag_name='Dubstep';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Dubstep', sort_order=91 WHERE category='style' AND tag_name='Riddim';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Dubstep', sort_order=92 WHERE category='style' AND tag_name='Melodic Dubstep';

-- Bass Music - Drum & Bass
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Drum & Bass', sort_order=95 WHERE category='style' AND tag_name='Drum & Bass';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Drum & Bass', sort_order=96 WHERE category='style' AND tag_name='Neurofunk';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='Drum & Bass', sort_order=97 WHERE category='style' AND tag_name='Jungle';

-- Bass Music - UK Bass
UPDATE preset_tags SET genre_group='Bass Music', sub_group='UK Bass', sort_order=100 WHERE category='style' AND tag_name='UK Garage';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='UK Bass', sort_order=101 WHERE category='style' AND tag_name='Grime';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='UK Bass', sort_order=102 WHERE category='style' AND tag_name='Bassline';
UPDATE preset_tags SET genre_group='Bass Music', sub_group='UK Bass', sort_order=103 WHERE category='style' AND tag_name='Future Garage';

-- EDM / Dance - Main Stage
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Main Stage', sort_order=119 WHERE category='style' AND tag_name='EDM';
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Main Stage', sort_order=120 WHERE category='style' AND tag_name='Big Room';
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Main Stage', sort_order=121 WHERE category='style' AND tag_name='Electro House';
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Main Stage', sort_order=122 WHERE category='style' AND tag_name='Hardstyle';

-- EDM / Dance - Future Pop
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Future Pop', sort_order=125 WHERE category='style' AND tag_name='Future Bass';
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Future Pop', sort_order=126 WHERE category='style' AND tag_name='Melbourne Bounce';
UPDATE preset_tags SET genre_group='EDM / Dance', sub_group='Future Pop', sort_order=127 WHERE category='style' AND tag_name='Moombahton';

-- Breaks & Beats - Breakbeat
UPDATE preset_tags SET genre_group='Breaks & Beats', sub_group='Breakbeat', sort_order=130 WHERE category='style' AND tag_name='Breakbeat';
UPDATE preset_tags SET genre_group='Breaks & Beats', sub_group='Breakbeat', sort_order=131 WHERE category='style' AND tag_name='Big Beat';
UPDATE preset_tags SET genre_group='Breaks & Beats', sub_group='Breakbeat', sort_order=132 WHERE category='style' AND tag_name='Electro Swing';

-- Breaks & Beats - Footwork
UPDATE preset_tags SET genre_group='Breaks & Beats', sub_group='Footwork', sort_order=135 WHERE category='style' AND tag_name='Footwork';
UPDATE preset_tags SET genre_group='Breaks & Beats', sub_group='Footwork', sort_order=136 WHERE category='style' AND tag_name='Jersey Club';

-- Downtempo & Experimental - Ambient & Chill
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Ambient & Chill', sort_order=140 WHERE category='style' AND tag_name='Ambient';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Ambient & Chill', sort_order=141 WHERE category='style' AND tag_name='Chillout';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Ambient & Chill', sort_order=142 WHERE category='style' AND tag_name='Downtempo';

-- Downtempo & Experimental - Experimental
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Experimental', sort_order=145 WHERE category='style' AND tag_name='IDM';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Experimental', sort_order=146 WHERE category='style' AND tag_name='Glitch Hop';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Experimental', sort_order=147 WHERE category='style' AND tag_name='Trip Hop';

-- Downtempo & Experimental - Internet Era
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Internet Era', sort_order=150 WHERE category='style' AND tag_name='Vaporwave';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Internet Era', sort_order=151 WHERE category='style' AND tag_name='Hyperpop';
UPDATE preset_tags SET genre_group='Downtempo & Experimental', sub_group='Internet Era', sort_order=152 WHERE category='style' AND tag_name='Wave';

-- Disco & Retro - Disco
UPDATE preset_tags SET genre_group='Disco & Retro', sub_group='Disco', sort_order=155 WHERE category='style' AND tag_name='Disco';
UPDATE preset_tags SET genre_group='Disco & Retro', sub_group='Disco', sort_order=156 WHERE category='style' AND tag_name='Nu-Disco';

-- Disco & Retro - Retro
UPDATE preset_tags SET genre_group='Disco & Retro', sub_group='Retro', sort_order=160 WHERE category='style' AND tag_name='Synthwave';
UPDATE preset_tags SET genre_group='Disco & Retro', sub_group='Retro', sort_order=161 WHERE category='style' AND tag_name='Chillwave';

-- Urban & Trap
UPDATE preset_tags SET genre_group='Urban & Trap', sub_group='Trap', sort_order=170 WHERE category='style' AND tag_name='Trap';
UPDATE preset_tags SET genre_group='Urban & Trap', sub_group='Trap', sort_order=171 WHERE category='style' AND tag_name='Phonk';
UPDATE preset_tags SET genre_group='Urban & Trap', sub_group='Hybrid', sort_order=175 WHERE category='style' AND tag_name='Hardwave';
UPDATE preset_tags SET genre_group='Urban & Trap', sub_group='Hybrid', sort_order=176 WHERE category='style' AND tag_name='UK Drill';

-- China & Asia
UPDATE preset_tags SET genre_group='China & Asia', sub_group='中国', sort_order=180 WHERE category='style' AND tag_name='国风电音';
UPDATE preset_tags SET genre_group='China & Asia', sub_group='Asia-Pacific', sort_order=185 WHERE category='style' AND tag_name='J-Core';
UPDATE preset_tags SET genre_group='China & Asia', sub_group='Asia-Pacific', sort_order=186 WHERE category='style' AND tag_name='K-House';
UPDATE preset_tags SET genre_group='China & Asia', sub_group='Asia-Pacific', sort_order=187 WHERE category='style' AND tag_name='Bounce';

-- Now INSERT IGNORE for tags that don't exist yet
INSERT IGNORE INTO preset_tags (category, tag_name, tag_name_en, genre_group, sub_group, sort_order) VALUES
('style', 'Chicago House',    'Chicago House',    'House', 'Classic', 11),
('style', 'Acid House',       'Acid House',       'House', 'Classic', 12),
('style', 'Tropical House',   'Tropical House',   'House', 'Deep & Melodic', 23),
('style', 'Ambient House',    'Ambient House',    'House', 'Niche', 35),
('style', 'Detroit Techno',   'Detroit Techno',   'Techno', 'Classic', 41),
('style', 'Hardcore Techno',  'Hardcore Techno',  'Techno', 'Hard', 55),
('style', 'Hard Techno',      'Hard Techno',      'Techno', 'Hard', 56),
('style', 'Dub Techno',       'Dub Techno',       'Techno', 'Hypnotic', 60),
('style', 'Ambient Techno',   'Ambient Techno',   'Techno', 'Hypnotic', 61),
('style', 'Melodic Dubstep',  'Melodic Dubstep',  'Bass Music', 'Dubstep', 92),
('style', 'Big Beat',         'Big Beat',         'Breaks & Beats', 'Breakbeat', 131),
('style', 'Chillout',         'Chillout',         'Downtempo & Experimental', 'Ambient & Chill', 141),
('style', 'Disco',            'Disco',            'Disco & Retro', 'Disco', 155),
('style', 'Nu-Disco',         'Nu-Disco',         'Disco & Retro', 'Disco', 156),
('style', 'Synthwave',        'Synthwave',        'Disco & Retro', 'Retro', 160),
('style', 'Chillwave',        'Chillwave',        'Disco & Retro', 'Retro', 161),
('style', '国风电音',          'Guofeng EDM',     'China & Asia', '中国', 180);

-- Remove obsolete tags that are not in the new taxonomy
DELETE FROM preset_tags WHERE category='style' AND tag_name IN ('Garage', 'Halftime', 'Breakcore', 'Hands Up');

-- Fix the Chinese tag encoding (id 86 shows as ????)
UPDATE preset_tags SET tag_name='国风电音', tag_name_en='Guofeng EDM', genre_group='China & Asia', sub_group='中国', sort_order=180 WHERE id=86 AND category='style';
