-- FICOFI Employee Data Import
-- Based on the provided employee spreadsheet

-- Clear existing data (for development)
DELETE FROM schedules;
DELETE FROM users;

-- Insert all FICOFI employees
INSERT OR REPLACE INTO users (display_name, email, site, department, manager_email, second_level_manager_email, admin_access) VALUES 
-- EO Department
('Philippe CAPDOUZE', 'pcapdouze@ficofi.com', 'Singapore', 'EO', NULL, NULL, 2),
('Matthieu DESTOT', 'mdestot@ficofi.com', 'Singapore', 'EO', 'pcapdouze@ficofi.com', NULL, 2),
('Marie CAPDOUZE', 'mcapdouze@ficofi.com', 'Singapore', 'EO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 0),
('Deepak RAO', 'drao@ficofi.com', 'Singapore', 'EO', NULL, NULL, 1),

-- Business Transformation
('Catherine TOBLER', 'ctobler@ficofi.com', 'Pessac', 'Business Transformation', 'asaccazes@ficofi.com', 'mdestot@ficofi.com', 0),

-- Estates Department
('Francis YUNG', 'fyung@ficofi.com', 'Hong Kong', 'Estates', 'qdelaclos@ficofi.com', 'drao@ficofi.com', 0),
('Charles-Erwan SAVARY', 'csavary@ficofi.com', 'Paris', 'Estates', 'drao@ficofi.com', NULL, 0),
('Mathieu GILLET', 'mgillet@ficofi.com', 'Paris', 'Estates', 'drao@ficofi.com', NULL, 0),
('Pauline BURSON', 'pburson@ficofi.com', 'Paris', 'Estates', 'drao@ficofi.com', NULL, 0),
('Joseph PINON', 'jpinon@ficofi.com', 'Pessac', 'Estates', 'drao@ficofi.com', NULL, 0),
('Aymeric MOREAU', 'amoreau@ficofi.com', 'Singapore', 'Estates', 'qdelaclos@ficofi.com', 'drao@ficofi.com', 0),
('Clement LIM', 'clim@ficofi.com', 'Singapore', 'Estates', 'qdelaclos@ficofi.com', 'drao@ficofi.com', 0),
('Marina Chloe BURCELIN', 'mburcelin@ficofi.com', 'Singapore', 'Estates', 'qdelaclos@ficofi.com', 'drao@ficofi.com', 0),
('Quentin de LACLOS', 'qdelaclos@ficofi.com', 'Singapore', 'Estates', 'drao@ficofi.com', NULL, 1),

-- Finance Department
('Delphine ISAUTIER', 'disautier@ficofi.com', 'Singapore', 'Finance', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Hector BECHEMILH', 'hbechemilh@ficofi.com', 'Pessac', 'Finance', 'disautier@ficofi.com', 'mdestot@ficofi.com', 1),
('Laurence VADROT', 'lvadrot@ficofi.com', 'Pessac', 'Finance', 'disautier@ficofi.com', 'mdestot@ficofi.com', 0),
('Gisele DO CHI NAM', 'gdochinam@ficofi.com', 'Pessac', 'Finance', 'hbechemilh@ficofi.com', 'disautier@ficofi.com', 0),
('Marie-Chantal JANOTS-BEINAT', 'mjanots@ficofi.com', 'Pessac', 'Finance', 'hbechemilh@ficofi.com', 'disautier@ficofi.com', 0),
('Pierre-Edouard TALINEAU', 'ptalineau@ficofi.com', 'Singapore', 'Finance', 'disautier@ficofi.com', 'mdestot@ficofi.com', 1),
('Sandra PARODI', 'sparodi@ficofi.com', 'Singapore', 'Finance', 'disautier@ficofi.com', 'mdestot@ficofi.com', 1),
('Terence CHEW', 'tchew@ficofi.com', 'Singapore', 'Finance', 'disautier@ficofi.com', 'mdestot@ficofi.com', 1),
('Jerold WONG', 'jewong@ficofi.com', 'Singapore', 'Finance', 'sparodi@ficofi.com', 'disautier@ficofi.com', 0),
('Kelly LEONG', 'kleong@ficofi.com', 'Singapore', 'Finance', 'sparodi@ficofi.com', 'disautier@ficofi.com', 0),
('LOW Chee Yi', 'clow@ficofi.com', 'Singapore', 'Finance', 'ptalineau@ficofi.com', 'disautier@ficofi.com', 0),
('Sharon HU', 'shu@ficofi.com', 'Singapore', 'Finance', 'sparodi@ficofi.com', 'disautier@ficofi.com', 0),
('Sherlyn LEE', 'shlee@ficofi.com', 'Singapore', 'Finance', 'tchew@ficofi.com', 'disautier@ficofi.com', 0),
('Sivapakkiam PALAYAN', 'spalayan@ficofi.com', 'Singapore', 'Finance', 'sparodi@ficofi.com', 'disautier@ficofi.com', 0),
('Tracy WONG', 'twong@ficofi.com', 'Singapore', 'Finance', 'sparodi@ficofi.com', 'disautier@ficofi.com', 0),

-- Human Resources
('Sidonie GRAND', 'sgrand@ficofi.com', 'Paris', 'Human Resources', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 2),
('Jackie LEUNG', 'jleung@ficofi.com', 'Hong Kong', 'Human Resources', 'sgrand@ficofi.com', 'mdestot@ficofi.com', 2),
('Leïla AIT DJOUDI', 'ldjoudi@ficofi.com', 'Pessac', 'Human Resources', 'sgrand@ficofi.com', 'mdestot@ficofi.com', 0),
('Sara LE BESCOT', 'slebescot@ficofi.com', 'Pessac', 'Human Resources', 'sgrand@ficofi.com', 'mdestot@ficofi.com', 2),
('Benjamin LIEW', 'bliew@ficofi.com', 'Singapore', 'Human Resources', 'sgrand@ficofi.com', 'mdestot@ficofi.com', 2),
('Nana YUSOP', 'syusop@ficofi.com', 'Singapore', 'Human Resources', 'sgrand@ficofi.com', 'mdestot@ficofi.com', 2),

-- Legal
('Sterenn BERNARDEAU', 'sbernardeau@ficofi.com', 'Singapore', 'Legal', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Candise MU', 'cmu@ficofi.com', 'Singapore', 'Legal', 'sbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),

-- ManCO (Management)
('Terence LEE', 'tlee@ficofi.com', 'Hong Kong', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Alexandre SACCAZES', 'asaccazes@ficofi.com', 'Paris', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Delphine FONTENEAU', 'dfonteneau@ficofi.com', 'Paris', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Benjamin BAILLEUX', 'bbailleux@ficofi.com', 'Singapore', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Edouard DAUTREIX', 'edautreix@ficofi.com', 'Singapore', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Jerome BERNARDEAU', 'jbernardeau@ficofi.com', 'Singapore', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Nina FERRET', 'nferret@ficofi.com', 'Singapore', 'ManCO', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),

-- Marketing
('Joris LALUC', 'jlaluc@ficofi.com', 'Paris', 'Marketing', 'dfonteneau@ficofi.com', 'mdestot@ficofi.com', 1),
('Michelle LO', 'mlo@ficofi.com', 'Hong Kong', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 1),
('Pauline GEBRAEL', 'pgebrael@ficofi.com', 'Hong Kong', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 1),
('Matthieu CAUBIT', 'mcaubit@ficofi.com', 'Paris', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 1),
('Delphine THIVAT', 'dthivat@ficofi.com', 'Beaune', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 0),
('Cherry KAM', 'ckam@ficofi.com', 'Hong Kong', 'Marketing', 'mlo@ficofi.com', 'jlaluc@ficofi.com', 0),
('Sally LEUNG', 'sleung@ficofi.com', 'Hong Kong', 'Marketing', 'pgebrael@ficofi.com', 'jlaluc@ficofi.com', 0),
('Tiffany YEUNG', 'tyeung@ficofi.com', 'Hong Kong', 'Marketing', 'mlo@ficofi.com', 'jlaluc@ficofi.com', 0),
('Audrey BARBEREAU', 'abarbereau@ficofi.com', 'Paris', 'Marketing', 'mlo@ficofi.com', 'jlaluc@ficofi.com', 0),
('Céline BORDIER', 'cbordier@ficofi.com', 'Paris', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 0),
('Claire MEZZINA', 'cmezzina@ficofi.com', 'Paris', 'Marketing', 'jlaluc@ficofi.com', 'dfonteneau@ficofi.com', 0),
('Emilie DENIZON', 'edenizon@ficofi.com', 'Paris', 'Marketing', 'pgebrael@ficofi.com', 'jlaluc@ficofi.com', 0),
('Flore DERVAUX', 'fdervaux@ficofi.com', 'Paris', 'Marketing', 'pgebrael@ficofi.com', 'jlaluc@ficofi.com', 0),
('Justine RIGAL', 'jrigal@ficofi.com', 'Paris', 'Marketing', 'mcaubit@ficofi.com', 'jlaluc@ficofi.com', 0),
('Kimberley GARREAU', 'kgarreau@ficofi.com', 'Paris', 'Marketing', 'mcaubit@ficofi.com', 'jlaluc@ficofi.com', 0),
('Marine BOULLIER', 'mboullier@ficofi.com', 'Paris', 'Marketing', 'pgebrael@ficofi.com', 'jlaluc@ficofi.com', 0),
('Sasha BUSSI CALLENS', 'sbussicallens@ficofi.com', 'Paris', 'Marketing', 'mlo@ficofi.com', 'jlaluc@ficofi.com', 0),
('Shi Hwee LIM', 'slim@ficofi.com', 'Singapore', 'Marketing', 'pgebrael@ficofi.com', 'jlaluc@ficofi.com', 0),

-- Operations
('Karen HAN', 'khan@ficofi.com', 'Singapore', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 1),
('Marie Amélie MOREAU', 'mmoreau@ficofi.com', 'Pessac', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 1),
('Evelyn CHAI', 'evchai@ficofi.com', 'Hong Kong', 'Operations', 'khan@ficofi.com', 'edautreix@ficofi.com', 0),
('Summer SIT', 'ssit@ficofi.com', 'Hong Kong', 'Operations', 'khan@ficofi.com', 'edautreix@ficofi.com', 0),
('Aurelie BIGNON', 'abignon@ficofi.com', 'Pessac', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 0),
('Elisabeth PALLU', 'epallu@ficofi.com', 'Pessac', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 0),
('Estelle SANTI', 'esanti@ficofi.com', 'Pessac', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 0),
('Grégory BORDES', 'gbordes@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Jérôme CASTANO', 'jcastano@ficofi.com', 'Pessac', 'Operations', 'edautreix@ficofi.com', 'mdestot@ficofi.com', 0),
('Krystel DUCAMP', 'kducamp@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Ludivine VERMEERSCH', 'lvermeersch@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Margaux ROYER', 'mroyer@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Patrice BEINAT', 'pbeinat@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Patricia SOARES', 'psoares@ficofi.com', 'Pessac', 'Operations', 'mmoreau@ficofi.com', 'edautreix@ficofi.com', 0),
('Janice Ang', 'jang@ficofi.com', 'Singapore', 'Operations', 'khan@ficofi.com', 'edautreix@ficofi.com', 0),
('Mui San CHAN', 'mschan@ficofi.com', 'Singapore', 'Operations', 'khan@ficofi.com', 'edautreix@ficofi.com', 0),

-- Sales & Members
('Benjamin BAILLEUX', 'bbailleux@ficofi.com', 'Singapore', 'Sales & Members', 'mdestot@ficofi.com', 'pcapdouze@ficofi.com', 1),
('Bélinda DUPHIL', 'bduphil@ficofi.com', 'Pessac', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 1),
('Roberta MITSUDA', 'rmitsuda@ficofi.com', 'Brazil', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Chris CHAU', 'cchau@ficofi.com', 'Hong Kong', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Christopher CHENG', 'ccheng@ficofi.com', 'Hong Kong', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Eunice NG', 'eng@ficofi.com', 'Hong Kong', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Katie WITHERS GREEN', 'kgreen@ficofi.com', 'Hong Kong', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Kelsei WATT', 'kwatt@ficofi.com', 'Hong Kong', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Laurie JAMIN', 'ljamin@ficofi.com', 'Hong Kong', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Mandy HO', 'mho@ficofi.com', 'Hong Kong', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Queenie NG', 'qng@ficofi.com', 'Hong Kong', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Vivian LEE', 'vlee@ficofi.com', 'Hong Kong', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Yvette HUNG', 'yhung@ficofi.com', 'Hong Kong', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Manuel BRONSON', 'mbronson@ficofi.com', 'Los Angeles', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Olivier LAHAYE', 'olahaye@ficofi.com', 'New York', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Stephen CLAPP', 'sclapp@ficofi.com', 'Paris', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Cornelia BAUER', 'cbauer@ficofi.com', 'Pessac', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Sandra LIVET', 'slivet@ficofi.com', 'Pessac', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Sylvie NICOLAS', 'snicolas@ficofi.com', 'Pessac', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Chee Wee LEE', 'clee@ficofi.com', 'Singapore', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Christina NG', 'cng@ficofi.com', 'Singapore', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Ee Wah CHAI', 'echai@ficofi.com', 'Singapore', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Gwen CHIN', 'gchin@ficofi.com', 'Singapore', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Jonathann GALLAY', 'jgallay@ficofi.com', 'Singapore', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),
('Karen KOH', 'kkoh@ficofi.com', 'Singapore', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Maybel TAN', 'mtan@ficofi.com', 'Singapore', 'Sales & Members', 'bduphil@ficofi.com', 'bbailleux@ficofi.com', 0),
('Victor SIBE', 'vsibe@ficofi.com', 'Singapore', 'Sales & Members', 'bbailleux@ficofi.com', 'mdestot@ficofi.com', 0),

-- Technology Department (your team!)
('Christophe PERRET', 'cperret@ficofi.com', 'Pessac', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),
('Nicolas SIRAC', 'nsirac@ficofi.com', 'Pessac', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),
('Samuel VERRON', 'sverron@ficofi.com', 'Pessac', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),
('Kiran SHENOY', 'kshenoy@ficofi.com', 'Singapore', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),
('Kunal SHANKAR', 'kshankar@ficofi.com', 'Singapore', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),
('Marife VINZON', 'mvinzon@ficofi.com', 'Singapore', 'Technology', 'jbernardeau@ficofi.com', 'mdestot@ficofi.com', 0),

-- Wines Department
('Kenneth MAN', 'kman@ficofi.com', 'Hong Kong', 'Wines', 'nferret@ficofi.com', 'mdestot@ficofi.com', 0),
('Elizabeth TATARA', 'etatara@ficofi.com', 'Paris', 'Wines', 'nferret@ficofi.com', 'mdestot@ficofi.com', 0),
('Laurène CAILLETTE', 'lcaillette@ficofi.com', 'Pessac', 'Wines', 'nferret@ficofi.com', 'mdestot@ficofi.com', 0),
('Hugo COLLENOT-CHOLLEZ', 'hchollez@ficofi.com', 'Singapore', 'Wines', 'nferret@ficofi.com', 'mdestot@ficofi.com', 0),
('Pirom PHADOEMCHIT', 'pphadoemchit@ficofi.com', 'Singapore', 'Wines', 'nferret@ficofi.com', 'mdestot@ficofi.com', 0);

-- Insert sample schedule data for this week (for demonstration)
-- Current week: various realistic work patterns

-- Generate some realistic schedules for demonstration
INSERT OR REPLACE INTO schedules (user_id, date, time_period, status) 
SELECT 
  u.id,
  date('now', 'localtime'),
  'AM',
  CASE 
    WHEN u.site = 'Singapore' AND u.department = 'Technology' THEN 'WFH'
    WHEN u.site = 'Paris' AND u.department = 'Marketing' THEN 'WFO'
    WHEN u.site = 'Hong Kong' THEN 'WFO'
    ELSE 'WFH'
  END
FROM users u
WHERE u.active = 1;

INSERT OR REPLACE INTO schedules (user_id, date, time_period, status) 
SELECT 
  u.id,
  date('now', 'localtime'),
  'PM',
  CASE 
    WHEN u.site = 'Singapore' AND u.department = 'Technology' THEN 'WFH'
    WHEN u.site = 'Paris' AND u.department = 'Marketing' THEN 'WFO'
    WHEN u.site = 'Hong Kong' THEN 'WFO'
    ELSE 'WFH'
  END
FROM users u
WHERE u.active = 1;