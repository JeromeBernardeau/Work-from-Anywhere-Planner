import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

// Environment bindings type
type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Main renderer for HTML pages
app.use(renderer)

// ============== AUTH & SESSION HELPERS ==============

// Simple session simulation - in production, use proper JWT/session management
const getCurrentUser = async (c: any) => {
  // For demo, get user by email query param or default to Jerome
  const email = c.req.query('user') || 'jbernardeau@ficofi.com'
  
  const user = await c.env.DB.prepare(`
    SELECT * FROM users WHERE email = ? AND active = 1
  `).bind(email).first()
  
  return user
}

// Check if user has access to view another user's data
const hasAccessToUser = (currentUser: any, targetUserId: number) => {
  if (!currentUser) return false
  
  // Admin/HR has access to all
  if (currentUser.admin_access >= 2) return true
  
  // Users can always see their own data
  if (currentUser.id === targetUserId) return true
  
  // Managers can see their team members - would need proper team hierarchy check
  if (currentUser.admin_access >= 1) return true
  
  return false
}

// ============== API ROUTES ==============

// Get dashboard data
app.get('/api/dashboard', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get total employees
    const totalEmployees = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE active = 1
    `).first()

    // Get this week's office presence
    const thisWeekOffice = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'WFO' 
      AND s.date >= date('now', 'weekday 0', '-6 days')
      AND s.date <= date('now', 'weekday 0')
      AND u.active = 1
    `).first()

    // Get active sites
    const activeSites = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT site) as count FROM users WHERE active = 1
    `).first()

    // Get teams tracked
    const teamsTracked = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT department) as count FROM users WHERE active = 1
    `).first()

    // Get presence by site
    const presenceBySite = await c.env.DB.prepare(`
      SELECT 
        u.site,
        COUNT(DISTINCT u.id) as total_employees,
        COUNT(CASE WHEN s.status = 'WFO' AND s.date = date('now') THEN 1 END) as office_today
      FROM users u
      LEFT JOIN schedules s ON u.id = s.user_id AND s.date = date('now')
      WHERE u.active = 1
      GROUP BY u.site
      ORDER BY total_employees DESC
    `).all()

    // Get presence by team
    const presenceByTeam = await c.env.DB.prepare(`
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as total_members,
        COUNT(CASE WHEN s.status = 'WFO' AND s.date = date('now') THEN 1 END) as office_today
      FROM users u
      LEFT JOIN schedules s ON u.id = s.user_id AND s.date = date('now')
      WHERE u.active = 1
      GROUP BY u.department
      ORDER BY total_members DESC
    `).all()

    // Get weekly heatmap data
    const heatmapData = await c.env.DB.prepare(`
      SELECT 
        CASE strftime('%w', s.date)
          WHEN '0' THEN 'Sun'
          WHEN '1' THEN 'Mon' 
          WHEN '2' THEN 'Tue'
          WHEN '3' THEN 'Wed'
          WHEN '4' THEN 'Thu'
          WHEN '5' THEN 'Fri'
          WHEN '6' THEN 'Sat'
        END as day_of_week,
        s.time_period,
        COUNT(CASE WHEN s.status = 'WFO' THEN 1 END) as office_count,
        COUNT(*) as total_count
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.date >= date('now', 'weekday 0', '-6 days')
      AND s.date <= date('now', 'weekday 0')
      AND u.active = 1
      GROUP BY day_of_week, s.time_period
      ORDER BY s.date, s.time_period
    `).all()

    return c.json({
      metrics: {
        totalEmployees: totalEmployees?.count || 0,
        thisWeekOffice: Math.round((thisWeekOffice?.count || 0) * 100 / (totalEmployees?.count || 1)),
        nextWeekOffice: 65, // TODO: calculate next week
        activeSites: activeSites?.count || 0,
        teamsTracked: teamsTracked?.count || 0
      },
      presenceBySite: presenceBySite.results || [],
      presenceByTeam: presenceByTeam.results || [],
      heatmapData: heatmapData.results || []
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get employees list
app.get('/api/employees', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const search = c.req.query('search') || ''
    const team = c.req.query('team') || ''
    const site = c.req.query('site') || ''
    const role = c.req.query('role') || ''

    let query = `
      SELECT 
        u.*,
        COUNT(CASE WHEN s.status = 'WFO' AND s.date >= date('now', 'weekday 0', '-6 days') AND s.date <= date('now', 'weekday 0') THEN 1 END) as this_week_office,
        COUNT(CASE WHEN s.date >= date('now', 'weekday 0', '-6 days') AND s.date <= date('now', 'weekday 0') THEN 1 END) as this_week_total
      FROM users u
      LEFT JOIN schedules s ON u.id = s.user_id
      WHERE u.active = 1
    `

    const params: any[] = []

    if (search) {
      query += ` AND (u.display_name LIKE ? OR u.email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (team) {
      query += ` AND u.department = ?`
      params.push(team)
    }

    if (site) {
      query += ` AND u.site = ?`
      params.push(site)
    }

    if (role) {
      const adminLevel = role === 'Admin' ? 2 : role === 'Manager' ? 1 : 0
      query += ` AND u.admin_access = ?`
      params.push(adminLevel)
    }

    query += ` GROUP BY u.id ORDER BY u.display_name`

    const employees = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      employees: employees.results?.map((emp: any) => ({
        ...emp,
        this_week_percentage: emp.this_week_total > 0 
          ? Math.round((emp.this_week_office / emp.this_week_total) * 100)
          : 0,
        role: emp.admin_access >= 2 ? 'Admin' : emp.admin_access >= 1 ? 'Manager' : 'Employee'
      })) || []
    })
  } catch (error) {
    console.error('Employees API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user schedule
app.get('/api/schedule/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const user = await getCurrentUser(c)
    
    if (!user || !hasAccessToUser(user, userId)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const startDate = c.req.query('start') || new Date().toISOString().split('T')[0]
    const endDate = c.req.query('end') || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const schedules = await c.env.DB.prepare(`
      SELECT * FROM schedules 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date, time_period
    `).bind(userId, startDate, endDate).all()

    return c.json({ schedules: schedules.results || [] })
  } catch (error) {
    console.error('Schedule API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update schedule
app.post('/api/schedule', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { userId, date, timePeriod, status, notes } = await c.req.json()

    if (!hasAccessToUser(user, userId)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO schedules (user_id, date, time_period, status, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, date, timePeriod, status, notes || null).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Schedule update error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get filter options
app.get('/api/filters', async (c) => {
  try {
    const teams = await c.env.DB.prepare(`
      SELECT DISTINCT department FROM users WHERE active = 1 ORDER BY department
    `).all()

    const sites = await c.env.DB.prepare(`
      SELECT DISTINCT site FROM users WHERE active = 1 ORDER BY site  
    `).all()

    return c.json({
      teams: teams.results?.map((t: any) => t.department) || [],
      sites: sites.results?.map((s: any) => s.site) || [],
      roles: ['Employee', 'Manager', 'Admin']
    })
  } catch (error) {
    console.error('Filters API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============== MAIN PAGES ==============

// Main dashboard page
app.get('/', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
        </div>
        <nav className="mt-6">
          <a href="/" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-2 border-blue-500">
            <i className="fas fa-chart-bar mr-3"></i>
            Analytics
          </a>
          <a href="/schedule" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-calendar mr-3"></i>
            My Schedule
          </a>
          <a href="/team" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-users mr-3"></i>
            Team View
          </a>
          <a href="/organization" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-building mr-3"></i>
            Organization
          </a>
          <a href="/profile" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-user mr-3"></i>
            Profile
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">FICOFI Work-from-Anywhere Planner</h2>
          <p className="text-gray-600">Comprehensive employee location tracking and analytics</p>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900" id="total-employees">116</p>
              </div>
              <i className="fas fa-users text-blue-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">This Week Office</p>
                <p className="text-2xl font-bold text-blue-600" id="this-week-office">56%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style="width: 56%"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Next Week Office</p>
                <p className="text-2xl font-bold text-blue-600" id="next-week-office">60%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style="width: 60%"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Sites</p>
                <p className="text-2xl font-bold text-gray-900" id="active-sites">8</p>
              </div>
              <i className="fas fa-map-marker-alt text-green-500 text-xl"></i>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Teams Tracked</p>
                <p className="text-2xl font-bold text-gray-900" id="teams-tracked">16</p>
              </div>
              <i className="fas fa-users-cog text-purple-500 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Presence Rate by Site */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Presence Rate by Site</h3>
            <div id="presence-by-site">
              {/* This will be populated by JavaScript */}
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/6"></div>
              </div>
            </div>
          </div>

          {/* Presence Rate by Team */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Presence Rate by Team</h3>
            <div id="presence-by-team">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Office Occupancy Heatmap */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Office Occupancy Heatmap</h3>
          <div id="heatmap-container">
            <div className="grid grid-cols-6 gap-2 text-center text-sm font-medium text-gray-700 mb-2">
              <div></div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
            </div>
            <div id="heatmap-grid">
              {/* This will be populated by JavaScript */}
              <div className="animate-pulse">
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-sm font-medium text-gray-700">AM</div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <div className="text-sm font-medium text-gray-700">PM</div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>High (70%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Medium (40-69%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span>Low (0-39%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Organization page
app.get('/organization', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar - Reused */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
        </div>
        <nav className="mt-6">
          <a href="/" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-chart-bar mr-3"></i>
            Analytics
          </a>
          <a href="/schedule" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-calendar mr-3"></i>
            My Schedule
          </a>
          <a href="/team" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-users mr-3"></i>
            Team View
          </a>
          <a href="/organization" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-2 border-blue-500">
            <i className="fas fa-building mr-3"></i>
            Organization
          </a>
          <a href="/profile" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-user mr-3"></i>
            Profile
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Organization Directory</h2>
          
          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input 
                  type="text" 
                  id="employee-search"
                  placeholder="Search employees, teams, sites..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select id="team-filter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Teams</option>
                </select>
              </div>
              <div>
                <select id="site-filter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Sites</option>
                </select>
              </div>
              <div>
                <select id="role-filter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Roles</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600" id="showing-count">Showing 5 of 5 employees</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <i className="fas fa-download mr-2"></i>
                Export
              </button>
            </div>
          </div>

          {/* Employee Directory */}
          <div className="bg-white rounded-lg shadow-sm">
            <div id="employee-directory">
              {/* This will be populated by JavaScript */}
              <div className="animate-pulse p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Schedule page
app.get('/schedule', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Reused */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
        </div>
        <nav className="mt-6">
          <a href="/" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-chart-bar mr-3"></i>
            Analytics
          </a>
          <a href="/schedule" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-2 border-blue-500">
            <i className="fas fa-calendar mr-3"></i>
            My Schedule
          </a>
          <a href="/team" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-users mr-3"></i>
            Team View
          </a>
          <a href="/organization" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-building mr-3"></i>
            Organization
          </a>
          <a href="/profile" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-user mr-3"></i>
            Profile
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome back, Jerome Bernardeau</h2>
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">jbernardeau@ficofi.com</p>
              </div>
              <div>
                <p className="text-gray-500">Team</p>
                <p className="font-medium">Technology</p>
              </div>
              <div>
                <p className="text-gray-500">Site</p>
                <p className="font-medium">Singapore</p>
              </div>
              <div>
                <p className="text-gray-500">Timezone</p>
                <p className="font-medium">Asia/Singapore</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Weekly Schedule</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button id="prev-week" className="p-2 hover:bg-gray-100 rounded">
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span id="week-range" className="font-medium">15/09/2025 - 19/09/2025</span>
                  <button id="next-week" className="p-2 hover:bg-gray-100 rounded">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i className="fas fa-cog mr-2"></i>
                  Set Habits
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <button id="office-toggle" className="px-4 py-2 bg-green-600 text-white rounded-lg">
                  Today: Office
                </button>
                <button id="remote-toggle" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Today: Remote
                </button>
              </div>
            </div>

            {/* Schedule Grid */}
            <div id="schedule-grid">
              <div className="grid grid-cols-6 gap-2 text-center text-sm font-medium text-gray-700 mb-2">
                <div></div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
              </div>
              
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="text-sm font-medium text-gray-700 flex items-center">AM</div>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="mon" data-period="AM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="tue" data-period="AM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="wed" data-period="AM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="thu" data-period="AM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="fri" data-period="AM">
                  Remote
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                <div className="text-sm font-medium text-gray-700 flex items-center">PM</div>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="mon" data-period="PM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="tue" data-period="PM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="wed" data-period="PM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="thu" data-period="PM">
                  Remote
                </button>
                <button class="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600" data-day="fri" data-period="PM">
                  Remote
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center mt-6 space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Office</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Remote</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                <span>Off</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                <span>Holiday</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Outlook Calendar Sync</p>
                <p className="text-sm text-gray-600">Automatically create calendar events for your work schedule</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default app
