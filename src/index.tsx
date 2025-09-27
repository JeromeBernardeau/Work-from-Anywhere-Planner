import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { renderer } from './renderer'

// Environment bindings type
type Bindings = {
  DB: D1Database;
}

// User type definition
type User = {
  id: number;
  display_name: string;
  email: string;
  site: string;
  department: string;
  manager_email?: string;
  admin_access: number;
  active: number;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Main renderer for HTML pages
app.use(renderer)

// ============== AUTH & SESSION HELPERS ==============

// Generate session ID
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Hash password (simplified for demo - in production use proper bcrypt)
function hashPassword(password: string): string {
  // In production, use proper bcrypt hashing
  return `$2b$10$${Buffer.from(password).toString('base64')}`
}

// Verify password (simplified for demo)
function verifyPassword(password: string, hash: string): boolean {
  // In production, use proper bcrypt verification
  const expectedHash = hashPassword(password)
  return hash.includes(Buffer.from(password).toString('base64'))
}

// Get current user from session
const getCurrentUser = async (c: any): Promise<User | null> => {
  const sessionId = getCookie(c, 'session_id')
  
  if (!sessionId) {
    return null
  }

  try {
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.* FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.active = 1 AND s.expires_at > datetime('now')
    `).bind(sessionId).first()

    if (!session) {
      // Clean up invalid session
      deleteCookie(c, 'session_id')
      return null
    }

    // Update last accessed
    await c.env.DB.prepare(`
      UPDATE user_sessions SET last_accessed = datetime('now') WHERE id = ?
    `).bind(sessionId).run()

    return session as User
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

// Create user session
const createUserSession = async (c: any, user: User): Promise<string> => {
  const sessionId = generateSessionId()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await c.env.DB.prepare(`
    INSERT INTO user_sessions (id, user_id, email, expires_at, ip_address, user_agent, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).bind(
    sessionId,
    user.id,
    user.email,
    expiresAt.toISOString(),
    c.req.header('cf-connecting-ip') || 'unknown',
    c.req.header('user-agent') || 'unknown'
  ).run()

  // Set session cookie
  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'Lax'
  })

  return sessionId
}

// Check if user has access to view another user's data
const hasAccessToUser = (currentUser: User, targetUserId: number): boolean => {
  if (!currentUser) return false
  
  // Admin/HR has access to all
  if (currentUser.admin_access >= 2) return true
  
  // Users can always see their own data
  if (currentUser.id === targetUserId) return true
  
  // Managers can see their team members
  if (currentUser.admin_access >= 1) return true
  
  return false
}

// ============== AUTHENTICATION ROUTES ==============

// Login page
app.get('/login', (c) => {
  const error = c.req.query('error')
  const message = c.req.query('message')
  
  return c.render(
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <i className="fas fa-wine-glass-alt text-blue-600 text-2xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            FICOFI Work Planner
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your schedule
          </p>
        </div>
        
        <form id="loginForm" className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address (e.g., jbernardeau@ficofi.com)"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-400 bg-gray-100 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="PASSWORD NOT REQUIRED - Disabled"
                disabled
              />
            </div>
          </div>

          {error && (
            <div id="error-message" className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <i className="fas fa-exclamation-circle text-red-400 mr-3 mt-0.5"></i>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {message && (
            <div id="success-message" className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <i className="fas fa-check-circle text-green-400 mr-3 mt-0.5"></i>
                <div className="text-sm text-green-700">{message}</div>
              </div>
            </div>
          )}

          <div>
            <button
              id="loginButton"
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-lock text-blue-500 group-hover:text-blue-400"></i>
              </span>
              <span id="button-text">Sign in</span>
              <span id="loading-spinner" className="hidden">
                <i className="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              <strong>⚠️ Password Authentication Disabled</strong><br/>
              Enter any valid email to login<br/>
              Example: jbernardeau@ficofi.com
            </div>
          </div>
        </form>
      </div>
    </div>
  )
})

// Login API endpoint
app.post('/api/login', async (c) => {
  try {
    let email: string | null = ''
    let password: string | null = ''
    
    const contentType = c.req.header('content-type') || ''
    console.log('Login attempt - Content-Type:', contentType)
    
    // Try form data first (most common from HTML forms)
    try {
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await c.req.formData()
        email = formData.get('email') as string
        password = formData.get('password') as string
        console.log('Form data parsed successfully')
      } else if (contentType.includes('application/json')) {
        // Handle JSON data
        const json = await c.req.json()
        email = json.email
        password = json.password
        console.log('JSON data parsed successfully')
      } else {
        // Fallback: try to parse as form data regardless of content type
        console.log('Attempting fallback form data parsing...')
        const formData = await c.req.formData()
        email = formData.get('email') as string
        password = formData.get('password') as string
        console.log('Fallback form data parsed successfully')
      }
    } catch (error) {
      console.error('Login error:', error)
      return c.redirect('/login?error=Invalid request format')
    }

    // PASSWORD CHECK DISABLED - Only email required
    if (!email) {
      return c.redirect('/login?error=Email is required')
    }
    
    console.log(`⚠️ Password authentication disabled - Auto-login for: ${email}`)

    // Find user by email
    const user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND active = 1
    `).bind(email).first()

    if (!user) {
      // Log failed attempt
      await c.env.DB.prepare(`
        INSERT INTO login_audit (email, success, failure_reason, ip_address, user_agent)
        VALUES (?, 0, 'user_not_found', ?, ?)
      `).bind(email, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown').run()

      return c.redirect('/login?error=Invalid email or password')
    }

    // Check if account is locked
    if (user.account_locked && new Date(user.account_locked) > new Date()) {
      return c.redirect('/login?error=Account temporarily locked. Please try again later.')
    }

    // PASSWORD VERIFICATION DISABLED - Auto-login enabled
    console.log(`✅ Password check bypassed for user: ${email}`)
    const passwordValid = true // Always valid - no password check

    if (!passwordValid) {
      // Increment login attempts
      const attempts = (user.login_attempts || 0) + 1
      let accountLocked = null
      
      if (attempts >= 5) {
        // Lock account for 30 minutes
        accountLocked = new Date()
        accountLocked.setMinutes(accountLocked.getMinutes() + 30)
      }

      await c.env.DB.prepare(`
        UPDATE users SET login_attempts = ?, account_locked = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(attempts, accountLocked?.toISOString() || null, user.id).run()

      // Log failed attempt
      await c.env.DB.prepare(`
        INSERT INTO login_audit (email, success, failure_reason, ip_address, user_agent)
        VALUES (?, 0, 'invalid_password', ?, ?)
      `).bind(email, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown').run()

      const errorMsg = attempts >= 5 ? 
        'Too many failed attempts. Account locked for 30 minutes.' :
        `Invalid email or password. ${5 - attempts} attempts remaining.`
      
      return c.redirect(`/login?error=${encodeURIComponent(errorMsg)}`)
    }

    // Successful login
    await c.env.DB.prepare(`
      UPDATE users SET 
        login_attempts = 0, 
        account_locked = NULL, 
        last_login = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run()

    // Log successful login
    await c.env.DB.prepare(`
      INSERT INTO login_audit (email, success, ip_address, user_agent)
      VALUES (?, 1, ?, ?)
    `).bind(email, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown').run()

    // Create session
    await createUserSession(c, user as User)

    return c.redirect('/')
  } catch (error) {
    console.error('Login error:', error)
    return c.redirect('/login?error=An error occurred. Please try again.')
  }
})

// Logout endpoint
app.post('/api/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id')
  
  if (sessionId) {
    // Deactivate session
    await c.env.DB.prepare(`
      UPDATE user_sessions SET active = 0 WHERE id = ?
    `).bind(sessionId).run()
  }
  
  deleteCookie(c, 'session_id')
  return c.redirect('/login?message=Successfully logged out')
})

// Authentication middleware for protected routes
const requireAuth = async (c: any, next: any) => {
  const user = await getCurrentUser(c)
  if (!user) {
    return c.redirect('/login')
  }
  c.set('user', user)
  await next()
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
      user: { id: user.id, name: user.display_name, email: user.email, role: user.admin_access },
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

// Update schedule - FIXED VERSION
app.post('/api/schedule', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { userId, date, timePeriod, status, notes } = await c.req.json()

    // Validate required fields
    if (!userId || !date || !timePeriod || !status) {
      return c.json({ error: 'Missing required fields: userId, date, timePeriod, status' }, 400)
    }

    // Validate status values
    const validStatuses = ['WFH', 'WFO', 'TRIP', 'LEAVE', 'OFF']
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') }, 400)
    }

    // Validate time period
    const validPeriods = ['AM', 'PM', 'FULL']
    if (!validPeriods.includes(timePeriod)) {
      return c.json({ error: 'Invalid time period. Must be one of: ' + validPeriods.join(', ') }, 400)
    }

    if (!hasAccessToUser(user, userId)) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Insert or update schedule
    const result = await c.env.DB.prepare(`
      INSERT OR REPLACE INTO schedules (user_id, date, time_period, status, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, date, timePeriod, status, notes || null).run()

    // Log the change in audit trail
    await c.env.DB.prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
      VALUES (?, 'UPDATE', 'schedules', ?, ?)
    `).bind(user.id, result.meta.last_row_id, JSON.stringify({ userId, date, timePeriod, status, notes })).run()

    return c.json({ 
      success: true, 
      message: 'Schedule updated successfully',
      data: { userId, date, timePeriod, status, notes }
    })
  } catch (error) {
    console.error('Schedule update error:', error)
    return c.json({ error: 'Internal server error: ' + error.message }, 500)
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

// ============== RECURRING PATTERNS (HABITS) API ==============

// Get user's recurring patterns (habits)
app.get('/api/habits/:userId', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userId = parseInt(c.req.param('userId'))
    
    if (!hasAccessToUser(user, userId)) {
      return c.json({ error: 'Access denied' }, 403)
    }

    const habits = await c.env.DB.prepare(`
      SELECT * FROM recurring_patterns 
      WHERE user_id = ? AND active = 1
      ORDER BY day_of_week, time_period
    `).bind(userId).all()

    return c.json({ habits: habits.results })
  } catch (error) {
    console.error('Habits fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Set recurring patterns (habits) for a user
app.post('/api/habits', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { userId, patterns } = await c.req.json()
    
    if (!userId || !patterns || !Array.isArray(patterns)) {
      return c.json({ error: 'Missing required fields: userId, patterns array' }, 400)
    }

    if (!hasAccessToUser(user, userId)) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Deactivate existing patterns for this user
    await c.env.DB.prepare(`
      UPDATE recurring_patterns 
      SET active = 0, updated_at = datetime('now')
      WHERE user_id = ?
    `).bind(userId).run()

    // Insert new patterns
    const results = []
    for (const pattern of patterns) {
      const { dayOfWeek, timePeriod, status } = pattern
      
      // Validate inputs
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return c.json({ error: 'Invalid day of week (0=Sunday, 6=Saturday)' }, 400)
      }
      
      if (!['AM', 'PM', 'FULL'].includes(timePeriod)) {
        return c.json({ error: 'Invalid time period' }, 400)
      }
      
      if (!['WFH', 'WFO', 'TRIP', 'LEAVE', 'IN_OFFICE'].includes(status)) {
        return c.json({ error: 'Invalid status' }, 400)
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO recurring_patterns (user_id, day_of_week, time_period, status, active, start_date)
        VALUES (?, ?, ?, ?, 1, date('now'))
      `).bind(userId, dayOfWeek, timePeriod, status).run()
      
      results.push(result)
    }

    return c.json({ 
      success: true, 
      message: 'Habits updated successfully',
      patterns: patterns.length 
    })
  } catch (error) {
    console.error('Habits update error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Apply habits to generate schedules for a date range
app.post('/api/habits/apply', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { userId, startDate, endDate } = await c.req.json()
    
    if (!userId || !startDate || !endDate) {
      return c.json({ error: 'Missing required fields: userId, startDate, endDate' }, 400)
    }

    if (!hasAccessToUser(user, userId)) {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Get user's active habits
    const habits = await c.env.DB.prepare(`
      SELECT * FROM recurring_patterns 
      WHERE user_id = ? AND active = 1
    `).bind(userId).all()

    if (!habits.results || habits.results.length === 0) {
      return c.json({ error: 'No habits configured for this user' }, 400)
    }

    // Generate schedules based on habits
    const start = new Date(startDate)
    const end = new Date(endDate)
    const scheduleEntries = []

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay()
      
      // Find matching habits for this day of week
      const dayHabits = habits.results.filter(habit => habit.day_of_week === dayOfWeek)
      
      for (const habit of dayHabits) {
        // Check if schedule already exists for this date/period
        const existing = await c.env.DB.prepare(`
          SELECT id FROM schedules 
          WHERE user_id = ? AND date = ? AND time_period = ?
        `).bind(userId, date.toISOString().split('T')[0], habit.time_period).first()

        if (!existing) {
          // Insert new schedule entry
          await c.env.DB.prepare(`
            INSERT INTO schedules (user_id, date, time_period, status, notes)
            VALUES (?, ?, ?, ?, 'Auto-generated from habits')
          `).bind(userId, date.toISOString().split('T')[0], habit.time_period, habit.status).run()
          
          scheduleEntries.push({
            date: date.toISOString().split('T')[0],
            timePeriod: habit.time_period,
            status: habit.status
          })
        }
      }
    }

    return c.json({ 
      success: true, 
      message: `Applied habits and created ${scheduleEntries.length} schedule entries`,
      entries: scheduleEntries.length 
    })
  } catch (error) {
    console.error('Habits apply error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============== TEAM MANAGEMENT API ENDPOINTS ==============

// Get accessible employees for current user
app.get('/api/team/employees', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const employees = await getAccessibleEmployees(c, user)
    return c.json({ employees: employees.results })
  } catch (error) {
    console.error('Team employees API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get team schedules with filters
app.post('/api/team/schedules', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { startDate, endDate, employeeIds, departments, locations, statuses } = await c.req.json()
    
    // Get accessible employees
    const accessibleEmployees = await getAccessibleEmployees(c, user)
    const accessibleIds = accessibleEmployees.results?.map((emp: any) => emp.id) || []
    
    // Filter employee IDs based on access
    let filterIds = accessibleIds
    if (employeeIds && employeeIds.length > 0) {
      filterIds = accessibleIds.filter((id: number) => employeeIds.includes(id))
    }
    
    if (filterIds.length === 0) {
      return c.json({ schedules: [] })
    }
    
    // Build query
    let query = `
      SELECT s.*, u.display_name, u.email, u.department, u.site 
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id IN (${filterIds.map(() => '?').join(',')})
      AND s.date >= ? AND s.date <= ?
    `
    let params = [...filterIds, startDate, endDate]
    
    // Add additional filters
    if (departments && departments.length > 0) {
      query += ` AND u.department IN (${departments.map(() => '?').join(',')})`
      params.push(...departments)
    }
    
    if (locations && locations.length > 0) {
      query += ` AND u.site IN (${locations.map(() => '?').join(',')})`
      params.push(...locations)
    }
    
    if (statuses && statuses.length > 0) {
      query += ` AND s.status IN (${statuses.map(() => '?').join(',')})`
      params.push(...statuses)
    }
    
    query += ` ORDER BY u.display_name, s.date, s.time_period`
    
    const schedules = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ schedules: schedules.results })
  } catch (error) {
    console.error('Team schedules API error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Override employee schedule (manager/admin only)
app.post('/api/team/override-schedule', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user || user.admin_access < 1) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const { userId, date, timePeriod, status, reason } = await c.req.json()
    
    if (!userId || !date || !timePeriod || !status) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Verify access to this employee
    const accessibleEmployees = await getAccessibleEmployees(c, user)
    const accessibleIds = accessibleEmployees.results?.map((emp: any) => emp.id) || []
    
    if (!accessibleIds.includes(userId)) {
      return c.json({ error: 'Access denied to this employee' }, 403)
    }

    // Insert or update schedule with override
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO schedules (user_id, date, time_period, status, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, date, timePeriod, status, `Manager override: ${reason || 'No reason provided'}`).run()

    // Log the override in audit trail
    await c.env.DB.prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
      VALUES (?, 'OVERRIDE', 'schedules', ?, ?)
    `).bind(user.id, userId, JSON.stringify({ 
      overridden_user_id: userId, 
      date, 
      timePeriod, 
      status, 
      reason,
      overridden_by: user.display_name
    })).run()

    return c.json({ 
      success: true, 
      message: 'Schedule overridden successfully'
    })
  } catch (error) {
    console.error('Schedule override error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Bulk edit schedules (manager/admin only)
app.post('/api/team/bulk-edit', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user || user.admin_access < 1) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const { operations } = await c.req.json()
    
    if (!operations || !Array.isArray(operations)) {
      return c.json({ error: 'Invalid operations array' }, 400)
    }

    // Verify access to all employees in operations
    const accessibleEmployees = await getAccessibleEmployees(c, user)
    const accessibleIds = accessibleEmployees.results?.map((emp: any) => emp.id) || []
    
    let successCount = 0
    const errors = []

    for (const op of operations) {
      try {
        const { userId, date, timePeriod, status, reason } = op
        
        if (!accessibleIds.includes(userId)) {
          errors.push(`Access denied to employee ID ${userId}`)
          continue
        }

        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO schedules (user_id, date, time_period, status, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(userId, date, timePeriod, status, `Bulk edit: ${reason || 'Manager bulk update'}`).run()

        successCount++
      } catch (error) {
        errors.push(`Failed to update ${op.userId}: ${error}`)
      }
    }

    return c.json({ 
      success: true, 
      message: `Bulk edit completed: ${successCount} updates, ${errors.length} errors`,
      successCount,
      errors
    })
  } catch (error) {
    console.error('Bulk edit error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Export team schedules (manager/admin only)
app.get('/api/team/export', async (c) => {
  try {
    const user = await getCurrentUser(c)
    if (!user || user.admin_access < 1) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const format = c.req.query('format') || 'json'
    
    // Get accessible employees and their schedules
    const accessibleEmployees = await getAccessibleEmployees(c, user)
    const accessibleIds = accessibleEmployees.results?.map((emp: any) => emp.id) || []
    
    if (accessibleIds.length === 0) {
      return c.json({ schedules: [] })
    }

    const schedules = await c.env.DB.prepare(`
      SELECT 
        s.date, s.time_period, s.status, s.notes,
        u.display_name, u.email, u.department, u.site
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id IN (${accessibleIds.map(() => '?').join(',')})
      ${startDate ? 'AND s.date >= ?' : ''}
      ${endDate ? 'AND s.date <= ?' : ''}
      ORDER BY u.display_name, s.date, s.time_period
    `).bind(...accessibleIds, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])).all()

    if (format === 'csv') {
      const csvData = schedules.results?.map((row: any) => 
        [row.display_name, row.email, row.department, row.site, row.date, row.time_period, row.status, row.notes || ''].join(',')
      ).join('\n') || ''
      
      const csvHeader = 'Name,Email,Department,Site,Date,Period,Status,Notes\n'
      
      return new Response(csvHeader + csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="team-schedules-${startDate || 'all'}-${endDate || 'all'}.csv"`
        }
      })
    }

    return c.json({ schedules: schedules.results })
  } catch (error) {
    console.error('Export error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ============== PROTECTED PAGES ==============

// Main dashboard page - requires authentication
app.get('/', requireAuth, async (c) => {
  const user = c.get('user') as User
  
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {user.display_name}
          </div>
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
          <div className="mt-8 px-6">
            <form action="/api/logout" method="POST">
              <button type="submit" className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <i className="fas fa-sign-out-alt mr-3"></i>
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">FICOFI Work-from-Anywhere Planner</h2>
          <p className="text-gray-600">Comprehensive employee location tracking and analytics</p>
        </div>

        {/* Dashboard content will be loaded via JavaScript */}
        <div id="dashboard-content">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900" id="total-employees">Loading...</p>
                </div>
                <i className="fas fa-users text-blue-500 text-xl"></i>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">This Week Office</p>
                  <p className="text-2xl font-bold text-blue-600" id="this-week-office">Loading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" id="this-week-progress" style="width: 0%"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Week Office</p>
                  <p className="text-2xl font-bold text-blue-600" id="next-week-office">Loading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" id="next-week-progress" style="width: 0%"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900" id="active-sites">Loading...</p>
                </div>
                <i className="fas fa-map-marker-alt text-green-500 text-xl"></i>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Teams Tracked</p>
                  <p className="text-2xl font-bold text-gray-900" id="teams-tracked">Loading...</p>
                </div>
                <i className="fas fa-users-cog text-purple-500 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Presence Rate by Site</h3>
              <div id="presence-by-site">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Presence Rate by Team</h3>
              <div id="presence-by-team">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  )
})

// Schedule page - requires authentication  
app.get('/schedule', requireAuth, async (c) => {
  const user = c.get('user') as User
  
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - same as dashboard */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {user.display_name}
          </div>
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
          <div className="mt-8 px-6">
            <form action="/api/logout" method="POST">
              <button type="submit" className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <i className="fas fa-sign-out-alt mr-3"></i>
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome back, {user.display_name}</h2>
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Team</p>
                <p className="font-medium">{user.department}</p>
              </div>
              <div>
                <p className="text-gray-500">Site</p>
                <p className="font-medium">{user.site}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium">{user.admin_access >= 2 ? 'Admin' : user.admin_access >= 1 ? 'Manager' : 'Employee'}</p>
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
                  <span id="week-range" className="font-medium">Loading...</span>
                  <button id="next-week" className="p-2 hover:bg-gray-100 rounded">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <button id="setHabitsBtn" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i className="fas fa-cog mr-2"></i>
                  Set Habits
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <button id="office-toggle" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <i className="fas fa-building mr-2"></i>
                  Today: WFO
                </button>
                <button id="remote-toggle" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i className="fas fa-home mr-2"></i>
                  Today: WFH
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
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="mon" data-period="AM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="tue" data-period="AM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="wed" data-period="AM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="thu" data-period="AM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="fri" data-period="AM">
                  WFH
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                <div className="text-sm font-medium text-gray-700 flex items-center">PM</div>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="mon" data-period="PM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="tue" data-period="PM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="wed" data-period="PM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="thu" data-period="PM">
                  WFH
                </button>
                <button className="schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" data-day="fri" data-period="PM">
                  WFH
                </button>
              </div>
            </div>

            {/* Legend - Updated for Jerome's corrected specifications */}
            <div className="flex items-center justify-center mt-6 space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Work from Home (WFH)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Work From Overseas (WFO)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                <span>Business Trip</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span>Leave/Time Off</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                <span>In Office</span>
              </div>
            </div>
            
            {/* Hidden user ID for JavaScript */}
            <input type="hidden" id="current-user-id" value={user.id.toString()} />
          </div>
        </div>
      </div>
    </div>
  )
})

// Organization page - requires authentication
app.get('/organization', requireAuth, async (c) => {
  const user = c.get('user') as User
  
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - same structure */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {user.display_name}
          </div>
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
          <div className="mt-8 px-6">
            <form action="/api/logout" method="POST">
              <button type="submit" className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <i className="fas fa-sign-out-alt mr-3"></i>
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content - Organization Directory */}
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
              <p className="text-sm text-gray-600" id="showing-count">Loading employees...</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <i className="fas fa-download mr-2"></i>
                Export
              </button>
            </div>
          </div>

          {/* Employee Directory */}
          <div className="bg-white rounded-lg shadow-sm">
            <div id="employee-directory">
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading employee directory...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// ============== ROLE-BASED ACCESS CONTROL HELPERS ==============

// Check if user has manager access to another user
function hasManagerAccess(currentUser: User, targetUserId?: number): boolean {
  // Admins have access to everyone
  if (currentUser.admin_access >= 2) return true
  
  // Managers have access to their team members
  if (currentUser.admin_access >= 1) return true
  
  // Regular employees only have access to themselves
  return !targetUserId || currentUser.id === targetUserId
}

// Get user's accessible team members based on role
async function getAccessibleEmployees(c: any, currentUser: User) {
  let query = `
    SELECT DISTINCT u.* FROM users u 
    WHERE u.active = 1
  `
  let params: any[] = []
  
  if (currentUser.admin_access >= 2) {
    // Admin: All employees
    query += ` ORDER BY u.department, u.display_name`
  } else if (currentUser.admin_access >= 1) {
    // Manager: Their department + cross-team coordination
    query += ` AND (u.department = ? OR u.manager_email = ?) ORDER BY u.department, u.display_name`
    params = [currentUser.department, currentUser.email]
  } else {
    // Employee: Only themselves
    query += ` AND u.id = ? ORDER BY u.display_name`
    params = [currentUser.id]
  }
  
  return await c.env.DB.prepare(query).bind(...params).all()
}

// ============== TEAM VIEW PAGE ==============

// Team view page - requires authentication with role-based access
app.get('/team', requireAuth, async (c) => {
  const user = c.get('user') as User
  
  return c.render(
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Work-from-Anywhere Planner</h1>
          <div className="mt-2 text-sm text-gray-600">
            Welcome, {user.display_name}
          </div>
          <div className="mt-1 text-xs text-blue-600 font-medium">
            {user.admin_access >= 2 ? 'Admin Access' : user.admin_access >= 1 ? 'Manager Access' : 'Employee Access'}
          </div>
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
          <a href="/team" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-2 border-blue-500">
            <i className="fas fa-users mr-3"></i>
            Team View
          </a>
          <a href="/organization" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <i className="fas fa-building mr-3"></i>
            Organization
          </a>
          <div className="mt-8 px-6">
            <form action="/api/logout" method="POST">
              <button type="submit" className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <i className="fas fa-sign-out-alt mr-3"></i>
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Team Schedule Management</h2>
          <p className="text-gray-600">
            {user.admin_access >= 2 
              ? 'Manage schedules for all employees across the organization'
              : user.admin_access >= 1 
                ? 'View and manage your team member schedules'
                : 'View schedules for your immediate team'
            }
          </p>
        </div>

        {/* Date Range and View Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-800">Schedule View</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button id="weekly-view" className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white">
                  Weekly
                </button>
                <button id="monthly-view" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800">
                  Monthly
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select id="date-range-preset" className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="today">Today</option>
                <option value="this-week" selected>This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="custom">Custom Range</option>
              </select>
              
              <div id="custom-date-inputs" className="hidden flex items-center space-x-2">
                <input type="date" id="start-date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <span className="text-gray-500">to</span>
                <input type="date" id="end-date" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              
              <button id="apply-date-range" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select id="employee-filter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Employees</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team/Department</label>
              <select id="department-filter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Departments</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Office Location</label>
              <select id="location-filter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Locations</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Type</label>
              <select id="status-filter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                <option value="WFH">Work from Home</option>
                <option value="WFO">Work From Overseas</option>
                <option value="IN_OFFICE">In Office</option>
                <option value="TRIP">Business Trip</option>
                <option value="LEAVE">Leave/Time Off</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <div className="flex space-x-2">
                <button id="apply-filters" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Apply
                </button>
                <button id="clear-filters" className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team Calendar View */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button id="prev-period" className="p-2 rounded-lg hover:bg-gray-100">
                  <i className="fas fa-chevron-left text-gray-600"></i>
                </button>
                <h3 id="period-title" className="text-lg font-semibold text-gray-800">
                  Week of December 18, 2024
                </h3>
                <button id="next-period" className="p-2 rounded-lg hover:bg-gray-100">
                  <i className="fas fa-chevron-right text-gray-600"></i>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.admin_access >= 1 && (
                  <>
                    <button id="bulk-edit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                      <i className="fas fa-edit mr-2"></i>
                      Bulk Edit
                    </button>
                    <button id="export-schedules" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                      <i className="fas fa-download mr-2"></i>
                      Export
                    </button>
                  </>
                )}
                <button id="refresh-view" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div id="team-calendar" className="p-6">
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <div>Loading team schedules...</div>
            </div>
          </div>
        </div>

        {/* Schedule Override Modal (for managers) */}
        {user.admin_access >= 1 && (
          <div id="override-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Override Schedule</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <select id="override-employee" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Employee</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" id="override-date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select id="override-period" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="AM">Morning</option>
                  <option value="PM">Afternoon</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select id="override-status" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="WFH">Work from Home</option>
                  <option value="WFO">Work From Overseas</option>
                  <option value="IN_OFFICE">In Office</option>
                  <option value="TRIP">Business Trip</option>
                  <option value="LEAVE">Leave/Time Off</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Override Reason</label>
                <textarea id="override-reason" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Reason for schedule override..."></textarea>
              </div>
              <div className="flex space-x-3">
                <button id="confirm-override" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Override Schedule
                </button>
                <button id="cancel-override" className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden user info for JavaScript */}
        <input type="hidden" id="current-user-id" value={user.id.toString()} />
        <input type="hidden" id="user-access-level" value={user.admin_access.toString()} />
      </div>
    </div>
  )
})

export default app