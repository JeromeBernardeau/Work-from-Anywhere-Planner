// FICOFI Work-from-Anywhere Planner Frontend JavaScript - Enhanced Schedule Management

// ============== GLOBAL STATE ==============
let currentUser = null;
let dashboardData = null;
let employees = [];
let filters = { teams: [], sites: [], roles: [] };
let currentWeekStart = null;

// ============== UTILITY FUNCTIONS ==============

// Format percentage with color coding
function formatPercentage(value, total = 100) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  let colorClass = 'text-gray-500';
  
  if (percentage >= 70) colorClass = 'text-green-600';
  else if (percentage >= 40) colorClass = 'text-blue-600';
  
  return { percentage, colorClass };
}

// Get status color class
function getStatusColor(status) {
  switch (status) {
    case 'WFO': return 'bg-green-500 text-white';
    case 'WFH': return 'bg-blue-500 text-white';
    case 'TRIP': return 'bg-orange-500 text-white';
    case 'LEAVE': return 'bg-red-500 text-white';
    case 'OFF': return 'bg-gray-400 text-white';
    default: return 'bg-gray-200 text-gray-600';
  }
}

// Get heatmap color for occupancy percentage
function getHeatmapColor(percentage) {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 40) return 'bg-blue-500';
  return 'bg-gray-400';
}

// Format date for API calls
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Calculate current week start (Monday)
function getCurrentWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday as 0
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ============== API FUNCTIONS ==============

// Fetch dashboard data
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }
    
    dashboardData = data;
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showNotification('Error loading dashboard data', 'error');
    return null;
  }
}

// Fetch employees
async function fetchEmployees(search = '', team = '', site = '', role = '') {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (team) params.append('team', team);
    if (site) params.append('site', site);
    if (role) params.append('role', role);
    
    const response = await fetch(`/api/employees?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch employees');
    }
    
    employees = data.employees;
    return data.employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    showNotification('Error loading employees', 'error');
    return [];
  }
}

// Fetch filter options
async function fetchFilters() {
  try {
    const response = await fetch('/api/filters');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch filters');
    }
    
    filters = data;
    return data;
  } catch (error) {
    console.error('Error fetching filters:', error);
    return { teams: [], sites: [], roles: [] };
  }
}

// Update schedule
async function updateSchedule(userId, date, timePeriod, status, notes = '') {
  try {
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        date,
        timePeriod,
        status,
        notes
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update schedule');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

// Fetch user schedule for a date range
async function fetchUserSchedule(userId, startDate, endDate) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const response = await fetch(`/api/schedule/${userId}?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch schedule');
    }
    
    return data.schedules || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

// ============== UI FUNCTIONS ==============

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Update dashboard metrics
function updateDashboardMetrics(data) {
  if (!data || !data.metrics) return;
  
  const { metrics } = data;
  
  const totalEmployeesEl = document.getElementById('total-employees');
  const thisWeekOfficeEl = document.getElementById('this-week-office');
  const nextWeekOfficeEl = document.getElementById('next-week-office');
  const activeSitesEl = document.getElementById('active-sites');
  const teamsTrackedEl = document.getElementById('teams-tracked');
  
  if (totalEmployeesEl) totalEmployeesEl.textContent = metrics.totalEmployees;
  if (thisWeekOfficeEl) thisWeekOfficeEl.textContent = metrics.thisWeekOffice + '%';
  if (nextWeekOfficeEl) nextWeekOfficeEl.textContent = metrics.nextWeekOffice + '%';
  if (activeSitesEl) activeSitesEl.textContent = metrics.activeSites;
  if (teamsTrackedEl) teamsTrackedEl.textContent = metrics.teamsTracked;
}

// ============== SCHEDULE MANAGEMENT ==============

// Schedule slot click handler - Enhanced with full status cycle
function handleScheduleSlotClick(event) {
  const slot = event.target;
  if (!slot.classList.contains('schedule-slot')) return;
  
  const day = slot.dataset.day;
  const period = slot.dataset.period;
  
  // Full status cycle with all work location options
  const currentStatus = slot.textContent.trim();
  const statusCycle = {
    'Remote': { next: 'Office', status: 'WFO', class: 'bg-green-500 hover:bg-green-600' },
    'Office': { next: 'Trip', status: 'TRIP', class: 'bg-orange-500 hover:bg-orange-600' },
    'Trip': { next: 'Leave', status: 'LEAVE', class: 'bg-red-500 hover:bg-red-600' },
    'Leave': { next: 'Off', status: 'OFF', class: 'bg-gray-400 hover:bg-gray-500' },
    'Off': { next: 'Remote', status: 'WFH', class: 'bg-blue-500 hover:bg-blue-600' }
  };
  
  const nextState = statusCycle[currentStatus] || statusCycle['Remote'];
  
  // Update UI immediately for better UX
  const originalText = slot.textContent;
  const originalClass = slot.className;
  
  slot.textContent = nextState.next;
  slot.className = `schedule-slot h-16 text-white rounded-lg ${nextState.class}`;
  
  // Calculate actual date based on day and current week
  const weekStart = currentWeekStart || getCurrentWeekStart();
  const dayOffset = {
    'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4
  }[day] || 0;
  
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + dayOffset);
  const dateStr = formatDate(targetDate);
  
  // Send API request to update schedule
  const userId = 43; // Jerome's user ID (in production, get from session)
  
  updateSchedule(userId, dateStr, period, nextState.status)
    .then(() => {
      showNotification(`Schedule updated: ${day.toUpperCase()} ${period} → ${nextState.next}`, 'success');
    })
    .catch(error => {
      // Revert UI on error
      slot.textContent = originalText;
      slot.className = originalClass;
      showNotification('Failed to update schedule. Please try again.', 'error');
    });
}

// Week navigation handlers
function handleWeekNavigation(direction) {
  const weekRangeEl = document.getElementById('week-range');
  if (!weekRangeEl) return;
  
  // Calculate new week
  if (!currentWeekStart) {
    currentWeekStart = getCurrentWeekStart();
  }
  
  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 4);
  
  // Update UI
  const formatDisplayDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  weekRangeEl.textContent = `${formatDisplayDate(currentWeekStart)} - ${formatDisplayDate(weekEnd)}`;
  
  // Load schedule for new week
  loadWeeklySchedule();
  
  showNotification(`Week changed to ${formatDisplayDate(currentWeekStart)}`, 'info');
}

// Quick status toggle handlers for today
function handleQuickToggle(status) {
  const today = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayName = dayNames[today.getDay()];
  
  // Find today's slots
  const todaySlots = document.querySelectorAll(`[data-day=\"${todayName}\"]`);
  
  if (todaySlots.length === 0) {
    showNotification(`No schedule slots found for today (${todayName.toUpperCase()})`, 'warning');
    return;
  }
  
  // Status configuration
  const statusConfig = {\n    'office': { text: 'Office', status: 'WFO', class: 'bg-green-500 hover:bg-green-600' },\n    'remote': { text: 'Remote', status: 'WFH', class: 'bg-blue-500 hover:bg-blue-600' }\n  };\n  \n  const config = statusConfig[status];\n  if (!config) return;\n  \n  // Update all today's slots (AM and PM)\n  todaySlots.forEach(slot => {\n    slot.textContent = config.text;\n    slot.className = `schedule-slot h-16 text-white rounded-lg ${config.class}`;\n    \n    // Update via API\n    const userId = 43; // Jerome's ID\n    const dateStr = formatDate(today);\n    const period = slot.dataset.period;\n    \n    updateSchedule(userId, dateStr, period, config.status)\n      .catch(error => {\n        showNotification(`Failed to update ${period} schedule`, 'error');\n      });\n  });\n  \n  showNotification(`Today set to ${config.text}`, 'success');\n}\n\n// Load weekly schedule from API\nasync function loadWeeklySchedule() {\n  const userId = 43; // Jerome's ID\n  const weekStart = currentWeekStart || getCurrentWeekStart();\n  const weekEnd = new Date(weekStart);\n  weekEnd.setDate(weekStart.getDate() + 6);\n  \n  try {\n    const schedules = await fetchUserSchedule(userId, formatDate(weekStart), formatDate(weekEnd));\n    \n    // Clear current schedule display\n    const slots = document.querySelectorAll('.schedule-slot');\n    slots.forEach(slot => {\n      slot.textContent = 'Remote'; // Default\n      slot.className = 'schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600';\n    });\n    \n    // Apply loaded schedules\n    schedules.forEach(schedule => {\n      const scheduleDate = new Date(schedule.date);\n      const dayOffset = Math.floor((scheduleDate - weekStart) / (24 * 60 * 60 * 1000));\n      const dayName = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayOffset];\n      \n      if (dayName && dayOffset < 5) { // Only weekdays\n        const slot = document.querySelector(`[data-day=\"${dayName}\"][data-period=\"${schedule.time_period}\"]`);\n        if (slot) {\n          const statusDisplay = {\n            'WFH': { text: 'Remote', class: 'bg-blue-500 hover:bg-blue-600' },\n            'WFO': { text: 'Office', class: 'bg-green-500 hover:bg-green-600' },\n            'TRIP': { text: 'Trip', class: 'bg-orange-500 hover:bg-orange-600' },\n            'LEAVE': { text: 'Leave', class: 'bg-red-500 hover:bg-red-600' },\n            'OFF': { text: 'Off', class: 'bg-gray-400 hover:bg-gray-500' }\n          };\n          \n          const display = statusDisplay[schedule.status] || statusDisplay['WFH'];\n          slot.textContent = display.text;\n          slot.className = `schedule-slot h-16 text-white rounded-lg ${display.class}`;\n        }\n      }\n    });\n    \n  } catch (error) {\n    showNotification('Failed to load weekly schedule', 'error');\n  }\n}\n\n// ============== OTHER UI FUNCTIONS ==============\n\n// Render presence by site\nfunction renderPresenceBySite(sites) {\n  const container = document.getElementById('presence-by-site');\n  if (!container || !sites) return;\n  \n  const html = sites.map(site => {\n    const percentage = site.total_employees > 0 \n      ? Math.round((site.office_today / site.total_employees) * 100) \n      : 0;\n    const { colorClass } = formatPercentage(site.office_today, site.total_employees);\n    \n    return `\n      <div class=\"flex items-center justify-between mb-4\">\n        <div class=\"flex-1\">\n          <div class=\"flex items-center justify-between mb-1\">\n            <span class=\"text-sm font-medium text-gray-700\">${site.site}</span>\n            <span class=\"text-sm ${colorClass}\">${percentage}%</span>\n          </div>\n          <div class=\"flex items-center justify-between text-xs text-gray-500 mb-2\">\n            <span>${site.total_employees} employees</span>\n            <span>This Week: ${percentage}%</span>\n          </div>\n          <div class=\"w-full bg-gray-200 rounded-full h-2\">\n            <div class=\"h-2 rounded-full transition-all duration-300\" \n                 style=\"width: ${percentage}%; background-color: ${percentage >= 70 ? '#10b981' : percentage >= 40 ? '#3b82f6' : '#9ca3af'}\"></div>\n          </div>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  container.innerHTML = html;\n}\n\n// Render presence by team\nfunction renderPresenceByTeam(teams) {\n  const container = document.getElementById('presence-by-team');\n  if (!container || !teams) return;\n  \n  const html = teams.map(team => {\n    const percentage = team.total_members > 0 \n      ? Math.round((team.office_today / team.total_members) * 100) \n      : 0;\n    const { colorClass } = formatPercentage(team.office_today, team.total_members);\n    \n    return `\n      <div class=\"flex items-center justify-between mb-4\">\n        <div class=\"flex-1\">\n          <div class=\"flex items-center justify-between mb-1\">\n            <span class=\"text-sm font-medium text-gray-700\">${team.department}</span>\n            <span class=\"text-sm ${colorClass}\">${percentage}%</span>\n          </div>\n          <div class=\"flex items-center justify-between text-xs text-gray-500 mb-2\">\n            <span>${team.total_members} members</span>\n            <span>${percentage}%</span>\n          </div>\n          <div class=\"w-full bg-gray-200 rounded-full h-2\">\n            <div class=\"h-2 rounded-full transition-all duration-300\" \n                 style=\"width: ${percentage}%; background-color: ${percentage >= 70 ? '#10b981' : percentage >= 40 ? '#3b82f6' : '#9ca3af'}\"></div>\n          </div>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  container.innerHTML = html;\n}\n\n// Render heatmap\nfunction renderHeatmap(heatmapData) {\n  const container = document.getElementById('heatmap-grid');\n  if (!container) return;\n  \n  const heatmapLookup = {};\n  heatmapData?.forEach(item => {\n    const key = `${item.day_of_week}-${item.time_period}`;\n    heatmapLookup[key] = {\n      percentage: item.total_count > 0 ? Math.round((item.office_count / item.total_count) * 100) : 0,\n      count: item.office_count\n    };\n  });\n  \n  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];\n  const periods = ['AM', 'PM'];\n  \n  const html = periods.map(period => {\n    const row = days.map(day => {\n      const key = `${day}-${period}`;\n      const data = heatmapLookup[key] || { percentage: 0, count: 0 };\n      const colorClass = getHeatmapColor(data.percentage);\n      \n      return `\n        <div class=\"${colorClass} h-12 rounded flex items-center justify-center text-white text-sm font-medium\" \n             title=\"${day} ${period}: ${data.percentage}% (${data.count} in office)\">\n          ${data.percentage}%\n        </div>\n      `;\n    }).join('');\n    \n    return `\n      <div class=\"grid grid-cols-6 gap-2 mb-2\">\n        <div class=\"text-sm font-medium text-gray-700 flex items-center\">${period}</div>\n        ${row}\n      </div>\n    `;\n  }).join('');\n  \n  container.innerHTML = html;\n}\n\n// Render employee directory\nfunction renderEmployeeDirectory(employeeList) {\n  const container = document.getElementById('employee-directory');\n  if (!container) return;\n  \n  if (!employeeList || employeeList.length === 0) {\n    container.innerHTML = `\n      <div class=\"p-8 text-center text-gray-500\">\n        <i class=\"fas fa-users text-4xl mb-4\"></i>\n        <p>No employees found</p>\n      </div>\n    `;\n    return;\n  }\n  \n  const html = employeeList.map(employee => {\n    const { colorClass } = formatPercentage(employee.this_week_percentage, 100);\n    \n    return `\n      <div class=\"flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50\">\n        <div class=\"flex items-center space-x-4\">\n          <div class=\"w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold\">\n            ${employee.display_name.split(' ').map(n => n[0]).join('').substring(0, 2)}\n          </div>\n          <div>\n            <h4 class=\"font-medium text-gray-900\">${employee.display_name}</h4>\n            <div class=\"text-sm text-gray-500\">\n              <span>${employee.email}</span> • \n              <span>${employee.department}</span> • \n              <span>${employee.site}</span>\n            </div>\n          </div>\n        </div>\n        <div class=\"flex items-center space-x-4\">\n          <div class=\"text-right\">\n            <div class=\"text-sm font-medium text-gray-700\">${employee.role}</div>\n            <div class=\"text-xs text-gray-500\">This Week: <span class=\"${colorClass}\">${employee.this_week_percentage}%</span></div>\n          </div>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  container.innerHTML = html;\n  \n  // Update showing count\n  const showingCountEl = document.getElementById('showing-count');\n  if (showingCountEl) {\n    showingCountEl.textContent = `Showing ${employeeList.length} of ${employeeList.length} employees`;\n  }\n}\n\n// Populate filter dropdowns\nfunction populateFilters() {\n  const teamFilter = document.getElementById('team-filter');\n  const siteFilter = document.getElementById('site-filter');\n  const roleFilter = document.getElementById('role-filter');\n  \n  if (teamFilter && filters.teams) {\n    teamFilter.innerHTML = '<option value=\"\">All Teams</option>' + \n      filters.teams.map(team => `<option value=\"${team}\">${team}</option>`).join('');\n  }\n  \n  if (siteFilter && filters.sites) {\n    siteFilter.innerHTML = '<option value=\"\">All Sites</option>' + \n      filters.sites.map(site => `<option value=\"${site}\">${site}</option>`).join('');\n  }\n  \n  if (roleFilter && filters.roles) {\n    roleFilter.innerHTML = '<option value=\"\">All Roles</option>' + \n      filters.roles.map(role => `<option value=\"${role}\">${role}</option>`).join('');\n  }\n}\n\n// ============== EVENT HANDLERS ==============\n\n// Filter employees based on current filter values\nfunction handleFilterChange() {\n  const search = document.getElementById('employee-search')?.value || '';\n  const team = document.getElementById('team-filter')?.value || '';\n  const site = document.getElementById('site-filter')?.value || '';\n  const role = document.getElementById('role-filter')?.value || '';\n  \n  fetchEmployees(search, team, site, role).then(employees => {\n    renderEmployeeDirectory(employees);\n  });\n}\n\n// ============== PAGE-SPECIFIC INITIALIZATION ==============\n\n// Initialize dashboard page\nfunction initDashboard() {\n  fetchDashboardData().then(data => {\n    if (data) {\n      updateDashboardMetrics(data);\n      renderPresenceBySite(data.presenceBySite);\n      renderPresenceByTeam(data.presenceByTeam);\n      renderHeatmap(data.heatmapData);\n    }\n  });\n}\n\n// Initialize organization page\nfunction initOrganization() {\n  Promise.all([\n    fetchFilters(),\n    fetchEmployees()\n  ]).then(([filtersData, employeesData]) => {\n    populateFilters();\n    renderEmployeeDirectory(employeesData);\n  });\n  \n  // Set up event listeners for filters\n  const searchInput = document.getElementById('employee-search');\n  const teamFilter = document.getElementById('team-filter');\n  const siteFilter = document.getElementById('site-filter');\n  const roleFilter = document.getElementById('role-filter');\n  \n  if (searchInput) {\n    let searchTimeout;\n    searchInput.addEventListener('input', () => {\n      clearTimeout(searchTimeout);\n      searchTimeout = setTimeout(handleFilterChange, 300);\n    });\n  }\n  \n  [teamFilter, siteFilter, roleFilter].forEach(filter => {\n    if (filter) {\n      filter.addEventListener('change', handleFilterChange);\n    }\n  });\n}\n\n// Initialize schedule page\nfunction initSchedule() {\n  // Initialize current week\n  currentWeekStart = getCurrentWeekStart();\n  \n  // Load initial schedule\n  loadWeeklySchedule();\n  \n  // Set up schedule slot click handlers\n  document.addEventListener('click', (event) => {\n    if (event.target.classList.contains('schedule-slot')) {\n      handleScheduleSlotClick(event);\n    }\n  });\n  \n  // Week navigation\n  const prevWeekBtn = document.getElementById('prev-week');\n  const nextWeekBtn = document.getElementById('next-week');\n  \n  if (prevWeekBtn) {\n    prevWeekBtn.addEventListener('click', () => handleWeekNavigation(-1));\n  }\n  \n  if (nextWeekBtn) {\n    nextWeekBtn.addEventListener('click', () => handleWeekNavigation(1));\n  }\n  \n  // Quick toggle buttons\n  const officeToggle = document.getElementById('office-toggle');\n  const remoteToggle = document.getElementById('remote-toggle');\n  \n  if (officeToggle) {\n    officeToggle.addEventListener('click', () => handleQuickToggle('office'));\n  }\n  \n  if (remoteToggle) {\n    remoteToggle.addEventListener('click', () => handleQuickToggle('remote'));\n  }\n}\n\n// ============== MAIN INITIALIZATION ==============\n\n// Initialize app based on current page\nfunction initApp() {\n  const path = window.location.pathname;\n  \n  // Determine which page we're on and initialize accordingly\n  if (path === '/' || path === '/analytics') {\n    initDashboard();\n  } else if (path === '/organization') {\n    initOrganization();\n  } else if (path === '/schedule') {\n    initSchedule();\n  }\n  \n  // Global notification for successful loading\n  setTimeout(() => {\n    showNotification('FICOFI Work Planner loaded successfully', 'success');\n  }, 1000);\n}\n\n// Initialize when DOM is ready\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', initApp);\n} else {\n  initApp();\n}"