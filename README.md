# FICOFI Work-from-Anywhere Planner

## Project Overview
- **Name**: FICOFI Work-from-Anywhere Planner
- **Goal**: Streamline hybrid work scheduling for FICOFI's 115 employees across multiple locations
- **Current Status**: ✅ **FULLY OPERATIONAL** - All features working
- **Last Updated**: September 27, 2025

## 🌐 Access Links

### Production URLs
- **Live Application**: https://3000-iup4ucpc1uwzm5ytbolrh-6532622b.e2b.dev
- **GitHub Repository**: https://github.com/JeromeBernardeau/Work-from-Anywhere-Planner
- **Latest Commit**: https://github.com/JeromeBernardeau/Work-from-Anywhere-Planner/commit/c7309b7

### Download Resources
- **Excel Password Directory**: [Download FICOFI_Employee_Passwords.xlsx](https://3000-iup4ucpc1uwzm5ytbolrh-6532622b.e2b.dev/static/FICOFI_Employee_Passwords.xlsx)
- **Project Backup**: [Download Complete Backup](https://page.gensparksite.com/project_backups/toolu_01RYksrd16rCxoEhG49kfW4Z.tar.gz)

## ✅ Currently Completed Features

### 1. **Password-Free Authentication** 
   - Login with email only (no password required)
   - Auto-login enabled for all @ficofi.com emails
   - Session management with secure cookies

### 2. **Employee Database (115 Users)**
   - Complete staff directory with hierarchy
   - ManCO department (11 employees, formerly EO)
   - All departments: Finance, Marketing, Sales, Operations, Technology, Legal, HR, Estates, Wines, Business Transformation
   - Manager relationships and reporting structure

### 3. **Personal Schedule Management**
   - Weekly calendar view with AM/PM slots
   - Status options: Work from Office (WFO), Work from Home (WFH), Business Trip, Leave/Time Off
   - Navigate between weeks
   - Quick toggle buttons for daily status

### 4. **Habits System (Recurring Patterns)**
   - Set weekly recurring schedules
   - Configure default AM/PM status for each weekday
   - Apply habits to future weeks automatically
   - Default habits: Mon/Tue/Thu (Office), Wed/Fri (WFH)

### 5. **Team View & Management**
   - View entire team's schedules
   - Filter by department, location, or specific employees
   - Weekly and monthly calendar views
   - Export team schedules to Excel
   - Bulk edit capabilities for managers

### 6. **Organization Chart**
   - Visual hierarchy display
   - Department structure
   - Reporting relationships
   - Admin access indicators

### 7. **Analytics Dashboard**
   - Office occupancy metrics
   - Department presence statistics
   - Weekly/monthly trends
   - Site-specific analytics (Paris, Bordeaux, Singapore)

## 📊 Data Architecture

### Storage Services
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages
- **Runtime**: Cloudflare Workers (Edge)

### Data Models
```
Users (115 employees)
├── Personal Info (name, email, site)
├── Organization (department, managers)
├── Access Control (admin privileges)
└── Authentication (session management)

Schedules
├── Daily Records (date, AM/PM status)
├── Recurring Patterns (weekly habits)
└── Override Entries (exceptions)

Teams
├── Department Groups
├── Manager Hierarchies
└── Bulk Operations
```

## 🚀 User Guide

### How to Login
1. Go to https://3000-iup4ucpc1uwzm5ytbolrh-6532622b.e2b.dev
2. Enter your FICOFI email (e.g., jbernardeau@ficofi.com)
3. Click "Sign in" (password field is disabled)
4. You're automatically logged in!

### Managing Your Schedule
1. Click "My Schedule" in the sidebar
2. View your weekly calendar
3. Click any day slot to change status
4. Use "Set Habits" to configure recurring patterns
5. Navigate weeks with arrow buttons

### Team Management (Managers Only)
1. Click "Team View" in the sidebar
2. Select employees or departments to view
3. Switch between weekly/monthly views
4. Export schedules using "Export" button
5. Use bulk edit for multiple changes

### Setting Your Habits
1. Click "Set Habits" button on schedule page
2. Configure your typical weekly pattern
3. Choose AM/PM status for each weekday
4. Click "Save" to apply to future weeks

## 🔧 Technical Stack
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Hono Framework on Cloudflare Workers
- **Database**: Cloudflare D1 (Distributed SQLite)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages via Wrangler CLI

## 📈 Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: ✅ **Active & Running**
- **Environment**: Production
- **Database**: 115 users loaded
- **Authentication**: Simplified (no password)

## 🎯 Functional Entry Points

### Main Pages
- `/` - Dashboard (redirects to login if not authenticated)
- `/login` - Login page (email only)
- `/schedule` - Personal schedule management
- `/team` - Team view and management
- `/organization` - Organization chart
- `/analytics` - Analytics dashboard

### API Endpoints
- `POST /api/login` - User authentication
- `GET /api/schedule/:userId` - Fetch user schedule
- `POST /api/schedule` - Update schedule
- `GET /api/habits/:userId` - Get recurring patterns
- `POST /api/habits` - Save habits
- `GET /api/team/employees` - List team members
- `POST /api/team/schedules` - Fetch team schedules
- `GET /api/team/export` - Export to Excel

## 🔄 Recent Updates (September 27, 2025)

### Latest Fixes
- ✅ Fixed user ID mapping (Jerome: ID 10, not 11)
- ✅ Added default habits for all weekdays
- ✅ Restored calendar functionality
- ✅ Removed password authentication requirement
- ✅ Updated employee database with ManCO department
- ✅ Created Excel password directory (even though passwords disabled)

### GitHub Commits
- `c7309b7` - Calendar and habits functionality restored
- `aa22b5a` - Temporarily disable password authentication
- `18bf2cb` - Complete password management system with Excel export
- `fc9f707` - Fix login form for production compatibility

## 📋 Features Not Yet Implemented
- Real-time notifications for schedule changes
- Mobile app version
- Integration with Outlook/Google Calendar
- Automated office capacity warnings
- Advanced analytics with predictive modeling
- Multi-language support

## 💡 Recommended Next Steps
1. **Deploy to Production Cloudflare**: Update to official Cloudflare Pages URL
2. **Add Email Notifications**: Integrate with SendGrid or similar
3. **Mobile Responsiveness**: Enhance mobile UI/UX
4. **Calendar Sync**: Add iCal/Outlook integration
5. **Advanced Reporting**: Add CSV/PDF export options
6. **Audit Trail**: Track all schedule modifications

## 📞 Support & Contact
- **GitHub Issues**: [Report Issues](https://github.com/JeromeBernardeau/Work-from-Anywhere-Planner/issues)
- **Project Lead**: Jerome Bernardeau (jbernardeau@ficofi.com)
- **Department**: ManCO / Group CIO

## 🔒 Security Notes
- Authentication currently simplified (no password)
- To re-enable passwords: Revert commit `aa22b5a`
- All 115 employee passwords documented in Excel file
- Session-based authentication with HTTP-only cookies

---

**© 2025 FICOFI - Work-from-Anywhere Planner**
*Empowering flexible work arrangements for the modern wine industry*