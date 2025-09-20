-- FICOFI Employee Seeding Script (Fixed Schema)
-- Generated: September 20, 2025
-- Total Employees: 115
-- Note: Password hashes are placeholders - will be updated on first login

-- Management (EO & ManCO) - Admin level (admin_access = 2)
INSERT OR REPLACE INTO users (display_name, email, site, department, admin_access, active, password_hash) VALUES
('Philippe CAPDOUZE', 'pcapdouze@ficofi.com', 'Singapore', 'Management', 2, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Matthieu DESTOT', 'mdestot@ficofi.com', 'Singapore', 'Management', 2, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marie CAPDOUZE', 'mcapdouze@ficofi.com', 'Singapore', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Deepak RAO', 'drao@ficofi.com', 'Singapore', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Terence LEE', 'tlee@ficofi.com', 'Singapore', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Alexandre SACCAZES', 'asaccazes@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Delphine FONTENEAU', 'dfonteneau@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Benjamin BAILLEUX', 'bbailleux@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Delphine ISAUTIER', 'disautier@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Edouard DAUTREIX', 'edautreix@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Jerome BERNARDEAU', 'jbernardeau@ficofi.com', 'Paris', 'Technology', 2, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Nina FERRET', 'nferret@ficofi.com', 'Paris', 'Management', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Business Transformation
('Catherine TOBLER', 'ctobler@ficofi.com', 'Pessac', 'Business Transformation', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Estates Department
('Francis YUNG', 'fyung@ficofi.com', 'Singapore', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Charles-Erwan SAVARY', 'csavary@ficofi.com', 'Paris', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Mathieu GILLET', 'mgillet@ficofi.com', 'Paris', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Pauline BURSON', 'pburson@ficofi.com', 'Paris', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Joseph PINON', 'jpinon@ficofi.com', 'Beaune', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Aymeric MOREAU', 'amoreau@ficofi.com', 'Beaune', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Clement LIM', 'clim@ficofi.com', 'Singapore', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marina Chloe BURCELIN', 'mburcelin@ficofi.com', 'Paris', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Quentin de LACLOS', 'qdelaclos@ficofi.com', 'Paris', 'Estates', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Finance Department
('Hector BECHEMILH', 'hbechemilh@ficofi.com', 'Pessac', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Laurence VADROT', 'lvadrot@ficofi.com', 'Pessac', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Gisele DO CHI NAM', 'gdochinam@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marie-Chantal JANOTS-BEINAT', 'mjanots@ficofi.com', 'Pessac', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Pierre-Edouard TALINEAU', 'ptalineau@ficofi.com', 'Pessac', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sandra PARODI', 'sparodi@ficofi.com', 'Pessac', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Terence CHEW', 'tchew@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Jerold WONG', 'jewong@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Kelly LEONG', 'kleong@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('LOW Chee Yi', 'clow@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sharon HU', 'shu@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sherlyn LEE', 'shlee@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sivapakkiam PALAYAN', 'spalayan@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Tracy WONG', 'twong@ficofi.com', 'Singapore', 'Finance', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Human Resources
('Sidonie GRAND', 'sgrand@ficofi.com', 'Paris', 'Human Resources', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Jackie LEUNG', 'jleung@ficofi.com', 'Singapore', 'Human Resources', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Leïla AIT DJOUDI', 'ldjoudi@ficofi.com', 'Paris', 'Human Resources', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sara LE BESCOT', 'slebescot@ficofi.com', 'Paris', 'Human Resources', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Benjamin LIEW', 'bliew@ficofi.com', 'Singapore', 'Human Resources', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Nana YUSOP', 'syusop@ficofi.com', 'Singapore', 'Human Resources', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Legal
('Sterenn BERNARDEAU', 'sbernardeau@ficofi.com', 'Paris', 'Legal', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Candise MU', 'cmu@ficofi.com', 'Singapore', 'Legal', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Marketing Department  
('Joris LALUC', 'jlaluc@ficofi.com', 'Paris', 'Marketing', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Michelle LO', 'mlo@ficofi.com', 'Hong Kong', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Pauline GEBRAEL', 'pgebrael@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Matthieu CAUBIT', 'mcaubit@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Delphine THIVAT', 'dthivat@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Cherry KAM', 'ckam@ficofi.com', 'Hong Kong', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sally LEUNG', 'sleung@ficofi.com', 'Hong Kong', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Tiffany YEUNG', 'tyeung@ficofi.com', 'Hong Kong', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Audrey BARBEREAU', 'abarbereau@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Céline BORDIER', 'cbordier@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Claire MEZZINA', 'cmezzina@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Emilie DENIZON', 'edenizon@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Flore DERVAUX', 'fdervaux@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Justine RIGAL', 'jrigal@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Kimberley GARREAU', 'kgarreau@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marine BOULLIER', 'mboullier@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sasha BUSSI CALLENS', 'sbussicallens@ficofi.com', 'Paris', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Shi Hwee LIM', 'slim@ficofi.com', 'Singapore', 'Marketing', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Operations Department
('Karen HAN', 'khan@ficofi.com', 'Singapore', 'Operations', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marie Amélie MOREAU', 'mmoreau@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Evelyn CHAI', 'evchai@ficofi.com', 'Singapore', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Summer SIT', 'ssit@ficofi.com', 'Singapore', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Aurelie BIGNON', 'abignon@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Elisabeth PALLU', 'epallu@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Estelle SANTI', 'esanti@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Grégory BORDES', 'gbordes@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Jérôme CASTANO', 'jcastano@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Krystel DUCAMP', 'kducamp@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Ludivine VERMEERSCH', 'lvermeersch@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Margaux ROYER', 'mroyer@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Patrice BEINAT', 'pbeinat@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Patricia SOARES', 'psoares@ficofi.com', 'Pessac', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Janice Ang', 'jang@ficofi.com', 'Singapore', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Mui San CHAN', 'mschan@ficofi.com', 'Singapore', 'Operations', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Sales & Members Department
('Roberta MITSUDA', 'rmitsuda@ficofi.com', 'New York', 'Sales & Members', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Chris CHAU', 'cchau@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Christopher CHENG', 'ccheng@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Eunice NG', 'eng@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Katie WITHERS GREEN', 'kgreen@ficofi.com', 'New York', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Kelsei WATT', 'kwatt@ficofi.com', 'New York', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Laurie JAMIN', 'ljamin@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Mandy HO', 'mho@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Queenie NG', 'qng@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Vivian LEE', 'vlee@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Yvette HUNG', 'yhung@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Manuel BRONSON', 'mbronson@ficofi.com', 'Los Angeles', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Olivier LAHAYE', 'olahaye@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Stephen CLAPP', 'sclapp@ficofi.com', 'Los Angeles', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Bélinda DUPHIL', 'bduphil@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Cornelia BAUER', 'cbauer@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sandra LIVET', 'slivet@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sylvie NICOLAS', 'snicolas@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Chee Wee LEE', 'clee@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Christina NG', 'cng@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Ee Wah CHAI', 'echai@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Gwen CHIN', 'gchin@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Jonathann GALLAY', 'jgallay@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Karen KOH', 'kkoh@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Maybel TAN', 'mtan@ficofi.com', 'Singapore', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Victor SIBE', 'vsibe@ficofi.com', 'Paris', 'Sales & Members', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Technology Department
('Christophe PERRET', 'cperret@ficofi.com', 'Paris', 'Technology', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Nicolas SIRAC', 'nsirac@ficofi.com', 'Paris', 'Technology', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Samuel VERRON', 'sverron@ficofi.com', 'Paris', 'Technology', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Kiran SHENOY', 'kshenoy@ficofi.com', 'Singapore', 'Technology', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Kunal SHANKAR', 'kshankar@ficofi.com', 'Singapore', 'Technology', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Marife VINZON', 'mvinzon@ficofi.com', 'Singapore', 'Technology', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),

-- Wines Department
('Kenneth MAN', 'kman@ficofi.com', 'Singapore', 'Wines', 1, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Elizabeth TATARA', 'etatara@ficofi.com', 'Los Angeles', 'Wines', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Laurène CAILLETTE', 'lcaillette@ficofi.com', 'Beaune', 'Wines', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Hugo COLLENOT-CHOLLEZ', 'hchollez@ficofi.com', 'Beaune', 'Wines', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Pirom PHADOEMCHIT', 'pphadoemchit@ficofi.com', 'Singapore', 'Wines', 0, 1, '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Report success
SELECT 'Successfully seeded ' || COUNT(*) || ' employees' as result FROM users WHERE password_hash IS NOT NULL;