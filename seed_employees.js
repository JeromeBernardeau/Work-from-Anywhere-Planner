import { readFileSync } from 'fs';
import { hash } from 'bcryptjs';

// Mock database for script execution - replace with actual wrangler execution
console.log('-- Employee seeding script');
console.log('-- This will be executed via wrangler d1 execute');

// Read the passwords file
const passwordData = `# FICOFI EMPLOYEE AUTHENTICATION CREDENTIALS
# Generated: September 20, 2025
# Total Employees: 115
# Password Format: 10 unique digits

# MANAGEMENT (EO & ManCO)
Philippe CAPDOUZE,pcapdouze@ficofi.com,1023456789
Matthieu DESTOT,mdestot@ficofi.com,2034567891
Marie CAPDOUZE,mcapdouze@ficofi.com,3045678912
Deepak RAO,drao@ficofi.com,4056789123
Terence LEE,tlee@ficofi.com,5067891234
Alexandre SACCAZES,asaccazes@ficofi.com,6078912345
Delphine FONTENEAU,dfonteneau@ficofi.com,7089123456
Benjamin BAILLEUX,bbailleux@ficofi.com,8091234567
Delphine ISAUTIER,disautier@ficofi.com,9012345678
Edouard DAUTREIX,edautreix@ficofi.com,1023567894
Jerome BERNARDEAU,jbernardeau@ficofi.com,2034678915
Nina FERRET,nferret@ficofi.com,3045789126`;

// Parse and create SQL insert statements
const lines = passwordData.split('\n');
const sqlStatements = [];

for (const line of lines) {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') continue;
  
  // Parse employee data
  const parts = line.split(',');
  if (parts.length === 3) {
    const [name, email, password] = parts.map(p => p.trim());
    
    // Generate SQL insert with bcrypt placeholder - will be handled by application
    sqlStatements.push(`INSERT OR REPLACE INTO users (name, email, location, department, role, status, password_hash) VALUES ('${name}', '${email}', 'France', 'Management', 'employee', 'active', 'BCRYPT_${password}');`);
  }
}

console.log('Generated SQL statements for first few employees:');
sqlStatements.slice(0, 5).forEach(sql => console.log(sql));
console.log(`Total employees to insert: ${sqlStatements.length}`);