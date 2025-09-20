// FICOFI Work-from-Anywhere Planner Frontend JavaScript - Enhanced Schedule Management

// ============== LOGIN HANDLER ==============

// Handle login form submission with JavaScript to bypass browser form issues
function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
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
  
  // Create form data
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  
  // Submit login request
  fetch('/api/login', {
    method: 'POST',
    body: formData,
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
      showNotification('Habits saved successfully! They will apply to all future weeks.', 'success');
      document.getElementById('habits-modal').remove();
      
      // Optionally reload current week to show any changes
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
  
  // Determine which page we're on and initialize accordingly
  if (path === '/schedule') {
    initSchedule();
  }
  
  console.log('FICOFI Work Planner initialized for path:', path);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}