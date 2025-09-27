// FICOFI Work-from-Anywhere Planner Frontend JavaScript - Enhanced Schedule Management

// ============== LOGIN HANDLER ==============

// Handle login form submission with JavaScript to bypass browser form issues
function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = document.getElementById('email').value;
  // Password field disabled - not required for authentication
  const password = '';
  const button = document.getElementById('loginButton');
  const buttonText = document.getElementById('button-text');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  // Show loading state
  button.disabled = true;
  buttonText.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');
  
  // Remove existing error messages
  const existingError = document.getElementById('error-message');
  if (existingError) existingError.remove();
  
  // Create JSON payload (matching successful curl test)
  const loginData = {
    email: email,
    password: password
  };
  
  // Submit login request with JSON (matching successful curl test)
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData),
    credentials: 'same-origin'
  })
  .then(response => {
    if (response.redirected || response.ok) {
      // Success - redirect to dashboard
      window.location.href = '/';
    } else {
      // Error - show error message
      return response.text().then(text => {
        throw new Error('Login failed');
      });
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'rounded-md bg-red-50 p-4';
    errorDiv.innerHTML = `
      <div class="flex">
        <i class="fas fa-exclamation-circle text-red-400 mr-3 mt-0.5"></i>
        <div class="text-sm text-red-700">Login failed. Please check your credentials and try again.</div>
      </div>
    `;
    
    // Insert error before the button
    form.insertBefore(errorDiv, button.parentElement);
    
    // Reset button state
    button.disabled = false;
    buttonText.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
  });
}

// ============== GLOBAL STATE ==============
let currentUser = null;
let dashboardData = null;
let employees = [];
let filters = { teams: [], sites: [], roles: [] };
let currentWeekStart = null;

// Status configuration according to Jerome's updated specifications
const statusConfig = {
  'WFH': { text: 'Work from Home', short: 'WFH', class: 'bg-blue-500 hover:bg-blue-600', color: 'Blue' },
  'WFO': { text: 'Work From Overseas', short: 'WFO', class: 'bg-green-500 hover:bg-green-600', color: 'Green' },  
  'TRIP': { text: 'Business Trip', short: 'Trip', class: 'bg-orange-500 hover:bg-orange-600', color: 'Orange' },
  'LEAVE': { text: 'Leave/Time Off', short: 'Leave', class: 'bg-red-500 hover:bg-red-600', color: 'Red' },
  'IN_OFFICE': { text: 'In Office', short: 'In Office', class: 'bg-gray-500 hover:bg-gray-600', color: 'Gray' }
};

// ============== UTILITY FUNCTIONS ==============

// Format percentage with color coding
function formatPercentage(value, total = 100) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  let colorClass = 'text-gray-500';
  
  if (percentage >= 70) colorClass = 'text-green-600';
  else if (percentage >= 40) colorClass = 'text-blue-600';
  
  return { percentage, colorClass };
}

// Get status color class - Updated for Jerome's specifications
function getStatusColor(status) {
  switch (status) {
    case 'WFH': return 'bg-blue-500 text-white';      // Work from Home - Blue
    case 'WFO': return 'bg-green-500 text-white';     // Work from Office - Green  
    case 'TRIP': return 'bg-orange-500 text-white';   // Business Trip - Orange
    case 'LEAVE': return 'bg-red-500 text-white';     // Leave/Time Off - Red
    case 'IN_OFFICE': return 'bg-gray-500 text-white'; // In Office - Gray
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

// ============== SCHEDULE MANAGEMENT ==============

// Create status selection dropdown
function createStatusDropdown(currentSlot, day, period) {
  // Remove any existing dropdown
  const existingDropdown = document.getElementById('status-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }
  
  const dropdown = document.createElement('div');
  dropdown.id = 'status-dropdown';
  dropdown.className = 'absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-48';
  
  // Position dropdown near the clicked slot
  const rect = currentSlot.getBoundingClientRect();
  dropdown.style.left = rect.left + window.scrollX + 'px';
  dropdown.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  
  // Create dropdown content
  dropdown.innerHTML = `
    <div class="text-sm font-semibold text-gray-700 mb-2 p-2 border-b">
      Select Status for ${day.toUpperCase()} ${period}
    </div>
  `;
  
  // Add status options
  Object.entries(statusConfig).forEach(([status, config]) => {
    const option = document.createElement('button');
    option.className = `w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center space-x-2`;
    option.innerHTML = `
      <div class="w-4 h-4 rounded ${config.class.split(' ')[0]}"></div>
      <span>${config.text}</span>
    `;
    
    option.addEventListener('click', () => {
      updateSlotStatus(currentSlot, day, period, status, config);
      dropdown.remove();
    });
    
    dropdown.appendChild(option);
  });
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'w-full text-center px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 border-t mt-2';
  closeButton.textContent = 'Cancel';
  closeButton.addEventListener('click', () => dropdown.remove());
  dropdown.appendChild(closeButton);
  
  document.body.appendChild(dropdown);
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 100);
}

// Update slot status (called from dropdown selection)
async function updateSlotStatus(slot, day, period, status, config) {
  // Update UI immediately
  const originalText = slot.textContent;
  const originalClass = slot.className;
  
  slot.textContent = config.short;
  slot.className = `schedule-slot h-16 text-white rounded-lg transition-colors ${config.class}`;
  
  // Calculate actual date
  const weekStart = currentWeekStart || getCurrentWeekStart();
  const dayOffset = {
    'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4
  }[day] || 0;
  
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + dayOffset);
  const dateStr = formatDate(targetDate);
  
  // Get current user ID from hidden input (Jerome's actual ID)
  const userIdElement = document.getElementById('current-user-id');
  const userId = userIdElement ? parseInt(userIdElement.value) : 11; // Jerome's correct ID is 11
  
  try {
    await updateSchedule(userId, dateStr, period, status);
    showNotification(`Schedule updated: ${day.toUpperCase()} ${period} → ${config.text}`, 'success');
  } catch (error) {
    // Revert UI on error
    slot.textContent = originalText;
    slot.className = originalClass;
    showNotification('Failed to update schedule. Please try again.', 'error');
    console.error('Schedule update error:', error);
  }
}

// Schedule slot click handler - Shows dropdown for status selection
function handleScheduleSlotClick(event) {
  const slot = event.target;
  if (!slot.classList.contains('schedule-slot')) return;
  
  const day = slot.dataset.day;
  const period = slot.dataset.period;
  
  if (!day || !period) {
    console.error('Missing day or period data on schedule slot');
    return;
  }
  
  // Create and show status selection dropdown
  createStatusDropdown(slot, day, period);
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
  const todaySlots = document.querySelectorAll(`[data-day="${todayName}"]`);
  
  if (todaySlots.length === 0) {
    showNotification(`No schedule slots found for today (${todayName.toUpperCase()})`, 'warning');
    return;
  }
  
  // Status configuration for quick toggles
  const quickStatusConfig = {
    'office': { text: 'WFO', status: 'WFO', class: 'bg-green-500 hover:bg-green-600' },
    'remote': { text: 'WFH', status: 'WFH', class: 'bg-blue-500 hover:bg-blue-600' }
  };
  
  const config = quickStatusConfig[status];
  if (!config) return;
  
  // Get current user ID
  const userIdElement = document.getElementById('current-user-id');
  const userId = userIdElement ? parseInt(userIdElement.value) : 11;
  
  // Update all today's slots (AM and PM)
  todaySlots.forEach(slot => {
    slot.textContent = config.text;
    slot.className = `schedule-slot h-16 text-white rounded-lg transition-colors ${config.class}`;
    
    // Update via API
    const dateStr = formatDate(today);
    const period = slot.dataset.period;
    
    updateSchedule(userId, dateStr, period, config.status)
      .catch(error => {
        showNotification(`Failed to update ${period} schedule`, 'error');
      });
  });
  
  showNotification(`Today set to ${config.text}`, 'success');
}

// ============== HABITS MANAGEMENT ==============

// Create and show Set Habits modal
function createHabitsModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById('habits-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'habits-modal';
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
  
  modal.innerHTML = `
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Set Weekly Habits</h3>
          <button id="close-habits-modal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <p class="text-sm text-gray-600 mb-6">
          Set your default weekly schedule. These habits will be applied to all future weeks automatically.
        </p>
        
        <div class="space-y-4">
          <div class="grid grid-cols-6 gap-2 text-sm font-medium text-gray-700 mb-2">
            <div></div>
            <div class="text-center">Mon</div>
            <div class="text-center">Tue</div>
            <div class="text-center">Wed</div>
            <div class="text-center">Thu</div>
            <div class="text-center">Fri</div>
          </div>
          
          <div class="grid grid-cols-6 gap-2 mb-2">
            <div class="text-sm font-medium text-gray-700 flex items-center">AM</div>
            <select class="habit-select border rounded p-1 text-sm" data-day="1" data-period="AM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="2" data-period="AM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="3" data-period="AM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="4" data-period="AM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="5" data-period="AM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
          </div>
          
          <div class="grid grid-cols-6 gap-2">
            <div class="text-sm font-medium text-gray-700 flex items-center">PM</div>
            <select class="habit-select border rounded p-1 text-sm" data-day="1" data-period="PM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="2" data-period="PM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="3" data-period="PM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="4" data-period="PM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
            <select class="habit-select border rounded p-1 text-sm" data-day="5" data-period="PM">
              <option value="WFH">WFH</option>
              <option value="WFO">WFO</option>
              <option value="TRIP">Trip</option>
              <option value="LEAVE">Leave</option>
              <option value="IN_OFFICE" selected>In Office</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-center justify-between mt-6 pt-4 border-t">
          <div class="text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            Changes will apply to all future weeks automatically
          </div>
          <div class="flex space-x-3">
            <button id="cancel-habits" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cancel
            </button>
            <button id="save-habits" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-save mr-2"></i>
              Save Habits
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Load existing habits
  loadUserHabits();

  // Event listeners
  document.getElementById('close-habits-modal').addEventListener('click', () => modal.remove());
  document.getElementById('cancel-habits').addEventListener('click', () => modal.remove());
  document.getElementById('save-habits').addEventListener('click', saveUserHabits);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Load existing user habits and populate the modal
async function loadUserHabits() {
  const userIdElement = document.getElementById('current-user-id');
  const userId = userIdElement ? parseInt(userIdElement.value) : 11;

  try {
    const response = await fetch(`/api/habits/${userId}`);
    const data = await response.json();

    if (response.ok && data.habits) {
      // Populate the modal selects with existing habits
      data.habits.forEach(habit => {
        const select = document.querySelector(`[data-day="${habit.day_of_week}"][data-period="${habit.time_period}"]`);
        if (select) {
          select.value = habit.status;
        }
      });
    }
  } catch (error) {
    console.error('Error loading habits:', error);
  }
}

// Save user habits
async function saveUserHabits() {
  const userIdElement = document.getElementById('current-user-id');
  const userId = userIdElement ? parseInt(userIdElement.value) : 11;

  // Collect all habit selections
  const selects = document.querySelectorAll('.habit-select');
  const patterns = [];

  selects.forEach(select => {
    if (select.value) {
      patterns.push({
        dayOfWeek: parseInt(select.dataset.day),
        timePeriod: select.dataset.period,
        status: select.value
      });
    }
  });

  try {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        patterns: patterns
      })
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Habits saved successfully! Applying to future weeks...', 'success');
      document.getElementById('habits-modal').remove();
      
      // Apply habits to the next 8 weeks automatically
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (8 * 7)); // 8 weeks from now
        
        const applyResponse = await fetch('/api/habits/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          })
        });
        
        const applyData = await applyResponse.json();
        
        if (applyResponse.ok) {
          showNotification(`Habits applied successfully! ${applyData.entries || 0} schedule entries created for future weeks.`, 'success');
        } else {
          console.warn('Failed to apply habits automatically:', applyData.error);
        }
      } catch (error) {
        console.warn('Error applying habits automatically:', error);
      }
      
      // Reload current week to show any changes
      loadWeeklySchedule();
    } else {
      showNotification('Failed to save habits: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving habits:', error);
    showNotification('Failed to save habits. Please try again.', 'error');
  }
}

// Load weekly schedule from API
async function loadWeeklySchedule() {
  // Get current user ID
  const userIdElement = document.getElementById('current-user-id');
  const userId = userIdElement ? parseInt(userIdElement.value) : 11; // Jerome's correct ID
  
  const weekStart = currentWeekStart || getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Update week range display
  const weekRangeEl = document.getElementById('week-range');
  if (weekRangeEl) {
    const formatDisplayDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const weekEndForDisplay = new Date(weekStart);
    weekEndForDisplay.setDate(weekStart.getDate() + 4); // Friday
    weekRangeEl.textContent = `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEndForDisplay)}`;
  }
  
  try {
    const schedules = await fetchUserSchedule(userId, formatDate(weekStart), formatDate(weekEnd));
    
    // Clear current schedule display with default WFH status
    const slots = document.querySelectorAll('.schedule-slot');
    slots.forEach(slot => {
      slot.textContent = 'WFH'; // Default to Work from Home
      slot.className = 'schedule-slot h-16 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors';
    });
    
    // Apply loaded schedules using the new status configuration
    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.date);
      const dayOffset = Math.floor((scheduleDate - weekStart) / (24 * 60 * 60 * 1000));
      const dayName = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayOffset];
      
      if (dayName && dayOffset < 5) { // Only weekdays
        const slot = document.querySelector(`[data-day="${dayName}"][data-period="${schedule.time_period}"]`);
        if (slot) {
          // Use the global statusConfig for consistency
          const config = statusConfig[schedule.status];
          if (config) {
            slot.textContent = config.short;
            slot.className = `schedule-slot h-16 text-white rounded-lg transition-colors ${config.class}`;
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error loading weekly schedule:', error);
    showNotification('Failed to load weekly schedule', 'error');
  }
}

// ============== PAGE INITIALIZATION ==============

// Initialize schedule page
function initSchedule() {
  // Initialize current week
  currentWeekStart = getCurrentWeekStart();
  
  // Load initial schedule
  loadWeeklySchedule();
  
  // Set up schedule slot click handlers - FIXED
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('schedule-slot')) {
      handleScheduleSlotClick(event);
    }
  });
  
  // Week navigation
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => handleWeekNavigation(-1));
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => handleWeekNavigation(1));
  }
  
  // Quick toggle buttons
  const officeToggle = document.getElementById('office-toggle');
  const remoteToggle = document.getElementById('remote-toggle');
  
  if (officeToggle) {
    officeToggle.addEventListener('click', () => handleQuickToggle('office'));
  }
  
  if (remoteToggle) {
    remoteToggle.addEventListener('click', () => handleQuickToggle('remote'));
  }

  // Set Habits button event listener
  const setHabitsBtn = document.getElementById('setHabitsBtn');
  if (setHabitsBtn) {
    setHabitsBtn.addEventListener('click', createHabitsModal);
  }
}

// ============== MAIN INITIALIZATION ==============

// Initialize app based on current page
function initApp() {
  const path = window.location.pathname;
  
  // Initialize login form if on login page
  if (path === '/login') {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
      console.log('Login form initialized');
    }
  }
  
  // Initialize team view if on team page
  if (path === '/team') {
    initTeamView();
  }
  
  // Determine which page we're on and initialize accordingly
  if (path === '/schedule') {
    initSchedule();
  }
  
  console.log('FICOFI Work Planner initialized for path:', path);
}

// ============== TEAM VIEW FUNCTIONALITY ==============

let teamViewState = {
  currentView: 'weekly', // 'weekly' or 'monthly'
  currentDate: new Date(),
  filters: {
    employees: [],
    departments: [],
    locations: [],
    statuses: []
  },
  accessibleEmployees: [],
  userAccessLevel: 0
};

// Initialize team view
function initTeamView() {
  console.log('Initializing team view...');
  
  // Get user access level
  const accessLevelElement = document.getElementById('user-access-level');
  teamViewState.userAccessLevel = accessLevelElement ? parseInt(accessLevelElement.value) : 0;
  
  // Load accessible employees and initialize UI
  loadAccessibleEmployees();
  
  // Set up event listeners
  setupTeamViewEventListeners();
  
  // Load initial data
  loadTeamSchedules();
}

// Load employees accessible to current user
async function loadAccessibleEmployees() {
  try {
    const response = await fetch('/api/team/employees');
    const data = await response.json();
    
    if (response.ok) {
      teamViewState.accessibleEmployees = data.employees || [];
      populateEmployeeFilter();
      populateDepartmentFilter();
      populateLocationFilter();
    } else {
      showNotification('Failed to load team members: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error loading accessible employees:', error);
    showNotification('Failed to load team members', 'error');
  }
}

// Populate employee filter dropdown
function populateEmployeeFilter() {
  const employeeFilter = document.getElementById('employee-filter');
  if (!employeeFilter) return;
  
  // Clear existing options except first
  employeeFilter.innerHTML = '<option value="">All Employees</option>';
  
  teamViewState.accessibleEmployees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.display_name} (${employee.department})`;
    employeeFilter.appendChild(option);
  });
}

// Populate department filter
function populateDepartmentFilter() {
  const departmentFilter = document.getElementById('department-filter');
  if (!departmentFilter) return;
  
  const departments = [...new Set(teamViewState.accessibleEmployees.map(emp => emp.department))].sort();
  
  departmentFilter.innerHTML = '<option value="">All Departments</option>';
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    departmentFilter.appendChild(option);
  });
}

// Populate location filter
function populateLocationFilter() {
  const locationFilter = document.getElementById('location-filter');
  if (!locationFilter) return;
  
  const locations = [...new Set(teamViewState.accessibleEmployees.map(emp => emp.site))].sort();
  
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

// Set up all event listeners for team view
function setupTeamViewEventListeners() {
  // View toggle buttons
  const weeklyViewBtn = document.getElementById('weekly-view');
  const monthlyViewBtn = document.getElementById('monthly-view');
  
  if (weeklyViewBtn) {
    weeklyViewBtn.addEventListener('click', () => switchToWeeklyView());
  }
  
  if (monthlyViewBtn) {
    monthlyViewBtn.addEventListener('click', () => switchToMonthlyView());
  }
  
  // Date range preset
  const dateRangePreset = document.getElementById('date-range-preset');
  if (dateRangePreset) {
    dateRangePreset.addEventListener('change', handleDateRangePresetChange);
  }
  
  // Custom date inputs
  const customDateInputs = document.getElementById('custom-date-inputs');
  if (dateRangePreset && customDateInputs) {
    dateRangePreset.addEventListener('change', () => {
      if (dateRangePreset.value === 'custom') {
        customDateInputs.classList.remove('hidden');
      } else {
        customDateInputs.classList.add('hidden');
      }
    });
  }
  
  // Apply date range
  const applyDateRangeBtn = document.getElementById('apply-date-range');
  if (applyDateRangeBtn) {
    applyDateRangeBtn.addEventListener('click', applyDateRange);
  }
  
  // Filter controls
  const applyFiltersBtn = document.getElementById('apply-filters');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }
  
  // Navigation buttons
  const prevPeriodBtn = document.getElementById('prev-period');
  const nextPeriodBtn = document.getElementById('next-period');
  
  if (prevPeriodBtn) {
    prevPeriodBtn.addEventListener('click', () => navigatePeriod(-1));
  }
  
  if (nextPeriodBtn) {
    nextPeriodBtn.addEventListener('click', () => navigatePeriod(1));
  }
  
  // Action buttons (for managers/admins)
  if (teamViewState.userAccessLevel >= 1) {
    const bulkEditBtn = document.getElementById('bulk-edit');
    const exportBtn = document.getElementById('export-schedules');
    
    if (bulkEditBtn) {
      bulkEditBtn.addEventListener('click', openBulkEditModal);
    }
    
    if (exportBtn) {
      exportBtn.addEventListener('click', exportSchedules);
    }
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refresh-view');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadTeamSchedules();
      showNotification('Schedule view refreshed', 'success');
    });
  }
}

// Switch to weekly view
function switchToWeeklyView() {
  teamViewState.currentView = 'weekly';
  
  const weeklyBtn = document.getElementById('weekly-view');
  const monthlyBtn = document.getElementById('monthly-view');
  
  if (weeklyBtn && monthlyBtn) {
    weeklyBtn.className = 'px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white';
    monthlyBtn.className = 'px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800';
  }
  
  loadTeamSchedules();
}

// Switch to monthly view
function switchToMonthlyView() {
  teamViewState.currentView = 'monthly';
  
  const weeklyBtn = document.getElementById('weekly-view');
  const monthlyBtn = document.getElementById('monthly-view');
  
  if (weeklyBtn && monthlyBtn) {
    weeklyBtn.className = 'px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800';
    monthlyBtn.className = 'px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white';
  }
  
  loadTeamSchedules();
}

// Handle date range preset changes
function handleDateRangePresetChange() {
  const preset = document.getElementById('date-range-preset').value;
  const today = new Date();
  let startDate, endDate;
  
  switch (preset) {
    case 'today':
      startDate = endDate = today;
      break;
    case 'this-week':
      startDate = getWeekStart(today);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'this-month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'last-month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'this-quarter':
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterStart, 1);
      endDate = new Date(today.getFullYear(), quarterStart + 3, 0);
      break;
    case 'last-quarter':
      const lastQuarterStart = Math.floor((today.getMonth() - 3) / 3) * 3;
      startDate = new Date(today.getFullYear(), lastQuarterStart, 1);
      endDate = new Date(today.getFullYear(), lastQuarterStart + 3, 0);
      break;
    default:
      return; // Custom range - don't auto-apply
  }
  
  if (startDate && endDate && preset !== 'custom') {
    teamViewState.currentDate = startDate;
    loadTeamSchedules();
  }
}

// Apply custom date range
function applyDateRange() {
  const preset = document.getElementById('date-range-preset').value;
  
  if (preset === 'custom') {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput.value && endDateInput.value) {
      teamViewState.currentDate = new Date(startDateInput.value);
      loadTeamSchedules();
    } else {
      showNotification('Please select both start and end dates', 'error');
    }
  } else {
    handleDateRangePresetChange();
  }
}

// Apply current filters
function applyFilters() {
  // Collect filter values
  const employeeFilter = document.getElementById('employee-filter');
  const departmentFilter = document.getElementById('department-filter');
  const locationFilter = document.getElementById('location-filter');
  const statusFilter = document.getElementById('status-filter');
  
  teamViewState.filters = {
    employees: employeeFilter.value ? [parseInt(employeeFilter.value)] : [],
    departments: departmentFilter.value ? [departmentFilter.value] : [],
    locations: locationFilter.value ? [locationFilter.value] : [],
    statuses: statusFilter.value ? [statusFilter.value] : []
  };
  
  loadTeamSchedules();
  showNotification('Filters applied', 'success');
}

// Clear all filters
function clearFilters() {
  document.getElementById('employee-filter').value = '';
  document.getElementById('department-filter').value = '';
  document.getElementById('location-filter').value = '';
  document.getElementById('status-filter').value = '';
  
  teamViewState.filters = {
    employees: [],
    departments: [],
    locations: [],
    statuses: []
  };
  
  loadTeamSchedules();
  showNotification('Filters cleared', 'success');
}

// Navigate periods (week/month)
function navigatePeriod(direction) {
  if (teamViewState.currentView === 'weekly') {
    teamViewState.currentDate.setDate(teamViewState.currentDate.getDate() + (direction * 7));
  } else {
    teamViewState.currentDate.setMonth(teamViewState.currentDate.getMonth() + direction);
  }
  
  loadTeamSchedules();
}

// Load team schedules with current filters and date range
async function loadTeamSchedules() {
  const calendarElement = document.getElementById('team-calendar');
  if (!calendarElement) return;
  
  // Show loading state
  calendarElement.innerHTML = `
    <div class="text-center py-8 text-gray-500">
      <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
      <div>Loading team schedules...</div>
    </div>
  `;
  
  try {
    // Calculate date range
    let startDate, endDate;
    const preset = document.getElementById('date-range-preset').value;
    
    if (preset === 'custom') {
      const startDateInput = document.getElementById('start-date');
      const endDateInput = document.getElementById('end-date');
      startDate = startDateInput.value;
      endDate = endDateInput.value;
    } else {
      if (teamViewState.currentView === 'weekly') {
        const weekStart = getWeekStart(teamViewState.currentDate);
        startDate = formatDate(weekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        endDate = formatDate(weekEnd);
      } else {
        const monthStart = new Date(teamViewState.currentDate.getFullYear(), teamViewState.currentDate.getMonth(), 1);
        const monthEnd = new Date(teamViewState.currentDate.getFullYear(), teamViewState.currentDate.getMonth() + 1, 0);
        startDate = formatDate(monthStart);
        endDate = formatDate(monthEnd);
      }
    }
    
    // Prepare request data
    const requestData = {
      startDate,
      endDate,
      employeeIds: teamViewState.filters.employees,
      departments: teamViewState.filters.departments,
      locations: teamViewState.filters.locations,
      statuses: teamViewState.filters.statuses
    };
    
    const response = await fetch('/api/team/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      renderTeamCalendar(data.schedules, startDate, endDate);
      updatePeriodTitle(startDate, endDate);
    } else {
      calendarElement.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <div>Failed to load schedules: ${data.error || 'Unknown error'}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading team schedules:', error);
    calendarElement.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <div>Error loading schedules</div>
      </div>
    `;
  }
}

// Render team calendar based on current view
function renderTeamCalendar(schedules, startDate, endDate) {
  const calendarElement = document.getElementById('team-calendar');
  if (!calendarElement) return;
  
  if (teamViewState.currentView === 'weekly') {
    renderWeeklyTeamCalendar(schedules, startDate, endDate);
  } else {
    renderMonthlyTeamCalendar(schedules, startDate, endDate);
  }
}

// Render weekly team calendar
function renderWeeklyTeamCalendar(schedules, startDate, endDate) {
  const calendarElement = document.getElementById('team-calendar');
  
  // Group schedules by employee and date
  const schedulesByEmployee = {};
  schedules.forEach(schedule => {
    const key = `${schedule.user_id}`;
    if (!schedulesByEmployee[key]) {
      schedulesByEmployee[key] = {
        employee: {
          id: schedule.user_id,
          name: schedule.display_name,
          department: schedule.department,
          site: schedule.site
        },
        schedules: {}
      };
    }
    
    const dateKey = schedule.date;
    if (!schedulesByEmployee[key].schedules[dateKey]) {
      schedulesByEmployee[key].schedules[dateKey] = {};
    }
    schedulesByEmployee[key].schedules[dateKey][schedule.time_period] = schedule.status;
  });
  
  // Generate date headers
  const start = new Date(startDate);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push({
      date: formatDate(date),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate()
    });
  }
  
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-300 p-3 text-left font-semibold">Employee</th>
            ${dates.map(d => `
              <th class="border border-gray-300 p-3 text-center font-semibold min-w-24">
                <div>${d.dayName}</div>
                <div class="text-sm text-gray-600">${d.dayNum}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
  `;
  
  // Render each employee's row
  Object.values(schedulesByEmployee).forEach(empData => {
    html += `
      <tr class="hover:bg-gray-50">
        <td class="border border-gray-300 p-3 font-medium">
          <div class="text-sm font-semibold">${empData.employee.name}</div>
          <div class="text-xs text-gray-600">${empData.employee.department}</div>
          <div class="text-xs text-gray-500">${empData.employee.site}</div>
        </td>
    `;
    
    dates.forEach(dateInfo => {
      const daySchedules = empData.schedules[dateInfo.date] || {};
      const amStatus = daySchedules.AM || 'WFH';
      const pmStatus = daySchedules.PM || 'WFH';
      
      html += `
        <td class="border border-gray-300 p-1">
          <div class="space-y-1">
            <div class="text-xs p-1 rounded text-center ${getStatusColor(amStatus)} cursor-pointer" 
                 onclick="editScheduleSlot(${empData.employee.id}, '${dateInfo.date}', 'AM', '${amStatus}')">
              AM: ${statusConfig[amStatus]?.short || amStatus}
            </div>
            <div class="text-xs p-1 rounded text-center ${getStatusColor(pmStatus)} cursor-pointer"
                 onclick="editScheduleSlot(${empData.employee.id}, '${dateInfo.date}', 'PM', '${pmStatus}')">
              PM: ${statusConfig[pmStatus]?.short || pmStatus}
            </div>
          </div>
        </td>
      `;
    });
    
    html += '</tr>';
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  if (Object.keys(schedulesByEmployee).length === 0) {
    html = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-calendar-times text-2xl mb-2"></i>
        <div>No schedules found for the selected criteria</div>
      </div>
    `;
  }
  
  calendarElement.innerHTML = html;
}

// Render monthly team calendar (simplified grid view)
function renderMonthlyTeamCalendar(schedules, startDate, endDate) {
  const calendarElement = document.getElementById('team-calendar');
  
  // Group schedules by date
  const schedulesByDate = {};
  schedules.forEach(schedule => {
    const date = schedule.date;
    if (!schedulesByDate[date]) {
      schedulesByDate[date] = {
        total: 0,
        WFH: 0,
        WFO: 0,
        IN_OFFICE: 0,
        TRIP: 0,
        LEAVE: 0
      };
    }
    schedulesByDate[date].total++;
    schedulesByDate[date][schedule.status] = (schedulesByDate[date][schedule.status] || 0) + 1;
  });
  
  // Generate calendar grid for the month
  const start = new Date(startDate);
  const end = new Date(endDate);
  const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  let html = `
    <div class="grid grid-cols-7 gap-1 mb-4">
      <div class="p-2 text-center font-semibold text-gray-600">Sun</div>
      <div class="p-2 text-center font-semibold text-gray-600">Mon</div>
      <div class="p-2 text-center font-semibold text-gray-600">Tue</div>
      <div class="p-2 text-center font-semibold text-gray-600">Wed</div>
      <div class="p-2 text-center font-semibold text-gray-600">Thu</div>
      <div class="p-2 text-center font-semibold text-gray-600">Fri</div>
      <div class="p-2 text-center font-semibold text-gray-600">Sat</div>
    </div>
    <div class="grid grid-cols-7 gap-1">
  `;
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    html += '<div class="h-24 bg-gray-100"></div>';
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = formatDate(new Date(start.getFullYear(), start.getMonth(), day));
    const dayData = schedulesByDate[date] || { total: 0 };
    
    const officePercentage = dayData.total > 0 ? Math.round(((dayData.IN_OFFICE || 0) / dayData.total) * 100) : 0;
    const colorClass = getHeatmapColor(officePercentage);
    
    html += `
      <div class="h-24 border border-gray-300 p-1 ${colorClass}">
        <div class="font-semibold text-sm">${day}</div>
        ${dayData.total > 0 ? `
          <div class="text-xs mt-1">
            <div>${dayData.total} people</div>
            <div>${officePercentage}% office</div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  
  calendarElement.innerHTML = html;
}

// Edit schedule slot (for managers)
function editScheduleSlot(userId, date, period, currentStatus) {
  if (teamViewState.userAccessLevel < 1) {
    showNotification('Insufficient permissions to edit schedules', 'error');
    return;
  }
  
  // Show override modal
  const modal = document.getElementById('override-modal');
  const employeeSelect = document.getElementById('override-employee');
  const dateInput = document.getElementById('override-date');
  const periodSelect = document.getElementById('override-period');
  const statusSelect = document.getElementById('override-status');
  
  if (modal && employeeSelect && dateInput && periodSelect && statusSelect) {
    // Populate employee dropdown
    employeeSelect.innerHTML = '<option value="">Select Employee</option>';
    teamViewState.accessibleEmployees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = employee.display_name;
      option.selected = employee.id == userId;
      employeeSelect.appendChild(option);
    });
    
    dateInput.value = date;
    periodSelect.value = period;
    statusSelect.value = currentStatus;
    
    modal.classList.remove('hidden');
    
    // Set up modal event listeners
    document.getElementById('confirm-override').onclick = confirmScheduleOverride;
    document.getElementById('cancel-override').onclick = () => modal.classList.add('hidden');
  }
}

// Confirm schedule override
async function confirmScheduleOverride() {
  const userId = document.getElementById('override-employee').value;
  const date = document.getElementById('override-date').value;
  const period = document.getElementById('override-period').value;
  const status = document.getElementById('override-status').value;
  const reason = document.getElementById('override-reason').value;
  
  if (!userId || !date || !period || !status) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/team/override-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        date,
        timePeriod: period,
        status,
        reason
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification('Schedule overridden successfully', 'success');
      document.getElementById('override-modal').classList.add('hidden');
      loadTeamSchedules(); // Refresh the view
    } else {
      showNotification('Failed to override schedule: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error overriding schedule:', error);
    showNotification('Failed to override schedule', 'error');
  }
}

// Export schedules
async function exportSchedules() {
  const preset = document.getElementById('date-range-preset').value;
  let startDate, endDate;
  
  if (preset === 'custom') {
    startDate = document.getElementById('start-date').value;
    endDate = document.getElementById('end-date').value;
  } else {
    // Use current period
    if (teamViewState.currentView === 'weekly') {
      const weekStart = getWeekStart(teamViewState.currentDate);
      startDate = formatDate(weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      endDate = formatDate(weekEnd);
    } else {
      const monthStart = new Date(teamViewState.currentDate.getFullYear(), teamViewState.currentDate.getMonth(), 1);
      const monthEnd = new Date(teamViewState.currentDate.getFullYear(), teamViewState.currentDate.getMonth() + 1, 0);
      startDate = formatDate(monthStart);
      endDate = formatDate(monthEnd);
    }
  }
  
  const url = `/api/team/export?format=csv&startDate=${startDate}&endDate=${endDate}`;
  window.open(url, '_blank');
  
  showNotification('Export started - download should begin shortly', 'success');
}

// Update period title
function updatePeriodTitle(startDate, endDate) {
  const titleElement = document.getElementById('period-title');
  if (!titleElement) return;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (teamViewState.currentView === 'weekly') {
    titleElement.textContent = `Week of ${start.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  } else {
    titleElement.textContent = `${start.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })}`;
  }
}

// Get week start date (Monday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

// Bulk edit modal functionality (placeholder for future implementation)
function openBulkEditModal() {
  showNotification('Bulk edit functionality coming soon', 'info');
}

  console.log('FICOFI Work Planner initialized for path:', path);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}