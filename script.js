
// ======================================================
// PIXEL PICK ADMIN
// Supabase connection, secure admin login and competitions
// ======================================================

const SUPABASE_URL = 'https://cxhclxtbtrsyfigqleeg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_N4pRAlpCzjTEoKR7TCYOEA_Irj7mCrv';
const TURNSTILE_SITE_KEY = '0x4AAAAAAF-RWWgVowvnilq4';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let captchaToken = null;
let turnstileWidgetId = null;
let competitionsCache = [];
let productsCache = [];
let entriesCache = [];
let paymentsCache = [];
let challengeResultsCache = [];
let currentAdmin = null;

// ------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');

const adminEmail = document.getElementById('adminEmail');
const connectionStatus = document.getElementById('connectionStatus');
const logoutButton = document.getElementById('logoutButton');

const competitionTableBody = document.getElementById('competitionsTableBody');
const competitionMessage = document.getElementById('competitionMessage');
const competitionModal = document.getElementById('competitionModal');
const competitionForm = document.getElementById('competitionForm');
const competitionFormMessage = document.getElementById('competitionFormMessage');

const competitionId = document.getElementById('competitionId');
const competitionName = document.getElementById('competitionName');
const competitionPrize = document.getElementById('competitionPrize');
const competitionProduct = document.getElementById('competitionProduct');
const competitionImage = document.getElementById('competitionImage');
const competitionPrice = document.getElementById('competitionPrice');
const competitionClosingDate = document.getElementById('competitionClosingDate');
const competitionStatus = document.getElementById('competitionStatus');
const competitionFeatured = document.getElementById('competitionFeatured');

const saveCompetitionButton = document.getElementById('saveCompetitionButton');
const productImagePreview = document.getElementById('productImagePreview');
const productImagePreviewImage = document.getElementById('productImagePreviewImage');
// Entries management elements
const entriesTableBody = document.getElementById('entriesTableBody');
const entriesMessage = document.getElementById('entriesMessage');
const entriesSearch = document.getElementById('entriesSearch');
const entriesCompetitionFilter = document.getElementById('entriesCompetitionFilter');
const entriesPaymentFilter = document.getElementById('entriesPaymentFilter');
const entriesTypeFilter = document.getElementById('entriesTypeFilter');
const entriesResultCount = document.getElementById('entriesResultCount');

const entriesTotalCount = document.getElementById('entriesTotalCount');
const entriesPaidCount = document.getElementById('entriesPaidCount');
const entriesPendingCount = document.getElementById('entriesPendingCount');

// ------------------------------------------------------
// PAYMENTS MANAGEMENT ELEMENTS
// ------------------------------------------------------

const paymentsTableBody = document.getElementById('paymentsTableBody');
const paymentsMessage = document.getElementById('paymentsMessage');
const paymentsSearch = document.getElementById('paymentsSearch');
const paymentsStatusFilter = document.getElementById('paymentsStatusFilter');
const paymentsResultCount = document.getElementById('paymentsResultCount');

const paymentsTotalCount = document.getElementById('paymentsTotalCount');
const paymentsPaidCount = document.getElementById('paymentsPaidCount');
const paymentsPendingCount = document.getElementById('paymentsPendingCount');
const paymentsRevenueTotal = document.getElementById('paymentsRevenueTotal');
// ------------------------------------------------------
// CUSTOMERS MANAGEMENT ELEMENTS
// ------------------------------------------------------

const customersTableBody = document.getElementById('customersTableBody');
const customersMessage = document.getElementById('customersMessage');
const customersSearch = document.getElementById('customersSearch');
const customersStatusFilter = document.getElementById('customersStatusFilter');
const customersResultCount = document.getElementById('customersResultCount');

const customersTotalCount = document.getElementById('customersTotalCount');
const customersActiveCount = document.getElementById('customersActiveCount');
const customersPausedCount = document.getElementById('customersPausedCount');

let customersCache = [];

const referralsTableBody = document.getElementById('referralsTableBody');
const referralsMessage = document.getElementById('referralsMessage');
const referralSearch = document.getElementById('referralSearch');

const totalReferrals = document.getElementById('totalReferrals');
const qualifiedReferrals = document.getElementById('qualifiedReferrals');
const rewardsIssued = document.getElementById('rewardsIssued');
const rewardsRedeemed = document.getElementById('rewardsRedeemed');

const referralDetailsPanel = document.getElementById('referralDetailsPanel');
const referralDetailsContent = document.getElementById('referralDetailsContent');

let referralsCache = [];
// ------------------------------------------------------
// WINNERS MANAGEMENT ELEMENTS
// ------------------------------------------------------

const winnersMessage = document.getElementById('winnersMessage');
const winnerPeriodInput = document.getElementById('winnerPeriodInput');

const winnersLeaderboardBody = document.getElementById('winnersLeaderboardBody');
const previousWinnersTableBody = document.getElementById('previousWinnersTableBody');

const totalWinners = document.getElementById('totalWinners');
const pendingWinners = document.getElementById('pendingWinners');
const confirmedWinners = document.getElementById('confirmedWinners');
const deliveredWinners = document.getElementById('deliveredWinners');

let winnersLeaderboardCache = [];
let previousWinnersCache = [];

// ------------------------------------------------------
// CUSTOMER SUPPORT MANAGEMENT ELEMENTS
// ------------------------------------------------------

const supportMessage = document.getElementById('supportMessage');
const supportTableBody = document.getElementById('supportTableBody');
const supportSearch = document.getElementById('supportSearch');
const supportStatusFilter = document.getElementById('supportStatusFilter');

const totalSupportRequests = document.getElementById('totalSupportRequests');
const openSupportRequests = document.getElementById('openSupportRequests');
const inProgressSupportRequests = document.getElementById('inProgressSupportRequests');
const resolvedSupportRequests = document.getElementById('resolvedSupportRequests');

const supportDetailsPanel = document.getElementById('supportDetailsPanel');
const supportDetailsContent = document.getElementById('supportDetailsContent');
const supportNewStatus = document.getElementById('supportNewStatus');
const updateSupportStatusBtn = document.getElementById('updateSupportStatusBtn');
const supportUpdateMessage = document.getElementById('supportUpdateMessage');

let selectedSupportRequestId = null;

let supportRequestsCache = [];

// CHALLENGE RESULTS ELEMENTS
const resultsTableBody = document.getElementById('resultsTableBody');
const resultsMessage = document.getElementById('resultsMessage');
const resultsSearch = document.getElementById('resultsSearch');
const resultsCompetitionFilter = document.getElementById('resultsCompetitionFilter');
const resultsStatusFilter = document.getElementById('resultsStatusFilter');
const resultsResultCount = document.getElementById('resultsResultCount');

const resultsTotalCount = document.getElementById('resultsTotalCount');
const resultsSubmittedCount = document.getElementById('resultsSubmittedCount');
const resultsInProgressCount = document.getElementById('resultsInProgressCount');
const resultsDisqualifiedCount = document.getElementById('resultsDisqualifiedCount');

const attemptDetailsPanel = document.getElementById('attemptDetailsPanel');
const attemptDetailsSubtitle = document.getElementById('attemptDetailsSubtitle');
const attemptDetailsMessage = document.getElementById('attemptDetailsMessage');
const attemptDetailsTableBody = document.getElementById('attemptDetailsTableBody');

// ------------------------------------------------------
// CLOUDFLARE TURNSTILE
// ------------------------------------------------------

window.onTurnstileLoad = function () {
  if (!window.turnstile) {
    loginMessage.textContent =
      'Security verification could not load. Please refresh the page.';
    return;
  }

  turnstileWidgetId = window.turnstile.render(
    '#pixelPickTurnstile',
    {
      sitekey: TURNSTILE_SITE_KEY,

      callback: function (token) {
        captchaToken = token;
      },

      'expired-callback': function () {
        captchaToken = null;
      },

      'error-callback': function () {
        captchaToken = null;
        loginMessage.textContent =
          'Security verification encountered an error. Please try again.';
      }
    }
  );
};

function resetCaptcha() {
  captchaToken = null;

  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

// ------------------------------------------------------
// GENERAL HELPERS
// ------------------------------------------------------

function showMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle('success', isSuccess);
}

function setConnectionStatus(message, isError = false) {
  connectionStatus.textContent = message;
  connectionStatus.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}

function formatCurrency(cents) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(Number(cents || 0) / 100);
}

function formatDate(value) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toLocalDateTimeInput(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = number => String(number).padStart(2, '0');

  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes())
  );
}

function getStatusClass(status) {
  const allowedStatuses = ['draft', 'open', 'closed', 'completed'];

  if (!allowedStatuses.includes(status)) return 'status-draft';

  return `status-${status}`;
}
function getChallengeResultStatusClass(status) {
  const allowedStatuses = ['submitted', 'in_progress', 'disqualified'];

  if (!allowedStatuses.includes(status)) return 'status-draft';

  return `status-${status}`;
}

// ------------------------------------------------------
// ADMIN AUTHENTICATION
// ------------------------------------------------------

async function verifyAdmin(session) {
  if (!session || !session.user) {
    showLoginScreen();
    return false;
  }

  setConnectionStatus('Verifying administrator...');

  const { data, error } = await supabaseClient
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Admin verification error:', error);
    setConnectionStatus('Admin verification failed', true);
    showLoginScreen(
      'We could not verify administrator access. Please try again.'
    );
    return false;
  }

  if (!data) {
    await supabaseClient.auth.signOut();
    showLoginScreen(
      'This account does not have administrator access.'
    );
    return false;
  }

  currentAdmin = session.user;
  adminEmail.textContent = session.user.email || 'Administrator';

  loginScreen.classList.add('hidden');
  adminApp.classList.remove('hidden');

  setConnectionStatus('Connected');

  await loadProducts();
  await loadCompetitions();

  return true;
}

function showLoginScreen(message = '') {
  currentAdmin = null;
  adminApp.classList.add('hidden');
  loginScreen.classList.remove('hidden');

  if (message) {
    showMessage(loginMessage, message);
  }
}

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showMessage(loginMessage, 'Please enter your email address and password.');
    return;
  }

  if (!captchaToken) {
    showMessage(loginMessage, 'Please complete the security verification.');
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';
  showMessage(loginMessage, '');

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken: captchaToken
      }
    });

    if (error) throw error;

    const verified = await verifyAdmin(data.session);

    if (!verified) {
      return;
    }

    loginForm.reset();
    showMessage(loginMessage, '');
  } catch (error) {
    console.error('Login error:', error);
    showMessage(loginMessage, error.message || 'Unable to sign in. Please try again.');
    resetCaptcha();
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in';
  }
});

logoutButton.addEventListener('click', async function () {
  logoutButton.disabled = true;

  const { error } = await supabaseClient.auth.signOut();

  logoutButton.disabled = false;

  if (error) {
    console.error('Logout error:', error);
    alert('Unable to sign out. Please try again.');
  }
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  // Run after the auth event callback has completed.
  setTimeout(() => {
    if (session) {
      verifyAdmin(session);
    } else {
      showLoginScreen();
    }
  }, 0);
});

// Check whether an existing session is available.
async function checkExistingSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error('Session check error:', error);
    showLoginScreen('Unable to check your login session. Please refresh.');
    return;
  }

  if (data.session) {
    await verifyAdmin(data.session);
  } else {
    showLoginScreen();
  }
}

// ------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------

const pageTitles = {
  dashboard: 'Dashboard',
  competitions: 'Competitions',
  entries: 'Entries',
  payments: 'Payments',
  customers: 'Customers',
  results: 'Challenge results',
  referrals: 'Referrals',
  winners: 'Winners',
  support: 'Customer support'
};

function showSection(sectionName) {
  const section = pageTitles[sectionName]
    ? sectionName
    : 'dashboard';

  document.querySelectorAll('.page-section').forEach(element => {
    element.classList.add('hidden');
  });

  const target = document.getElementById(`section-${section}`);

  if (target) {
    target.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle(
      'active',
      link.dataset.section === section
    );
  });

  document.getElementById('pageTitle').textContent =
    pageTitles[section];

  if (section === 'competitions' && currentAdmin) {
  loadCompetitions();
}

if (section === 'entries' && currentAdmin) {
  loadAdminEntries();
}
  if (section === 'payments' && currentAdmin) {
  loadAdminPayments();
}
  if (section === 'customers' && currentAdmin) {
  loadAdminCustomers();
}
  if (section === 'results' && currentAdmin) {
  loadAdminChallengeResults();
}
  if (section === 'referrals' && currentAdmin) {
  loadAdminReferrals();
}
  if (section === 'winners' && currentAdmin) {
  loadAdminWinners();
}
  if (section === 'support' && currentAdmin) {
  loadAdminSupport();
}
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showSection(link.dataset.section);
    history.replaceState(null, '', `#${link.dataset.section}`);
  });
});

document.querySelectorAll('[data-go-section]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.dataset.goSection;
    showSection(section);
    history.replaceState(null, '', `#${section}`);
  });
});

// ------------------------------------------------------
// PRODUCTS
// ------------------------------------------------------

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select(
      'id,name,brand,model,storage,colour,size,image_url,is_active'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Products loading error:', error);
    productsCache = [];
    populateProductDropdown();
    return;
  }

  productsCache = data || [];
  populateProductDropdown();
}

function populateProductDropdown(selectedId = '') {
  const currentSelection = selectedId || competitionProduct.value;

  competitionProduct.innerHTML =
    '<option value="">No product selected</option>';

  productsCache.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;

    const productName = [
      product.brand,
      product.name,
      product.model,
      product.storage,
      product.colour,
      product.size
    ].filter(Boolean).join(' ');

    option.textContent = productName;
    competitionProduct.appendChild(option);
  });

  if (
    currentSelection &&
    productsCache.some(product => product.id === currentSelection)
  ) {
    competitionProduct.value = currentSelection;
  }
}

competitionProduct.addEventListener('change', function () {
  const selectedProduct = productsCache.find(
    product => product.id === competitionProduct.value
  );

  if (selectedProduct && selectedProduct.image_url) {
    competitionImage.value = selectedProduct.image_url;
  }

  updateImagePreview();
});

competitionImage.addEventListener('input', updateImagePreview);

function updateImagePreview() {
  const imageUrl = competitionImage.value.trim();

  if (!imageUrl) {
    productImagePreview.classList.add('hidden');
    productImagePreviewImage.removeAttribute('src');
    return;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid image URL');
    }

    productImagePreviewImage.src = imageUrl;
    productImagePreview.classList.remove('hidden');
  } catch {
    productImagePreview.classList.add('hidden');
    productImagePreviewImage.removeAttribute('src');
  }
}

productImagePreviewImage.addEventListener('error', function () {
  productImagePreview.classList.add('hidden');
});

// ------------------------------------------------------
// COMPETITION LIST AND ENTRY COUNTS
// ------------------------------------------------------

async function loadCompetitions() {
  if (!currentAdmin) return;

  competitionTableBody.innerHTML =
    '<tr><td colspan="7" class="empty-state">Loading competitions...</td></tr>';

  showMessage(competitionMessage, '');

  const [competitionResult, countResult] = await Promise.all([
    supabaseClient
      .from('competitions')
      .select(
        'id,name,prize_description,entry_price_cents,status,closes_at,created_at,product_id,product_image_url,is_featured'
      )
      .order('created_at', { ascending: false }),

    supabaseClient.rpc('get_admin_competition_entry_counts')
  ]);

  if (competitionResult.error) {
    console.error('Competition loading error:', competitionResult.error);

    competitionTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">Could not load competitions. Please refresh.</td></tr>';

    showMessage(
      competitionMessage,
      competitionResult.error.message || 'Could not load competitions.'
    );

    setConnectionStatus('Competition loading failed', true);
    return;
  }

  competitionsCache = competitionResult.data || [];

  let countsAvailable = true;
  const entryCounts = {};

  if (countResult.error) {
    countsAvailable = false;
    console.error('Entry count error:', countResult.error);
    showMessage(
      competitionMessage,
      'Competitions loaded, but entry counts could not be retrieved: ' +
      countResult.error.message
    );
  } else {
    (countResult.data || []).forEach(row => {
      entryCounts[row.competition_id] = Number(row.entry_count || 0);
    });
  }

  renderCompetitions(entryCounts, countsAvailable);
  updateDashboardStats(entryCounts, countsAvailable);

  setConnectionStatus('Connected');
}

function renderCompetitions(entryCounts, countsAvailable) {
  if (competitionsCache.length === 0) {
    competitionTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">No competitions have been created yet.</td></tr>';
    return;
  }

  competitionTableBody.innerHTML = competitionsCache.map(competition => {
    const count = countsAvailable
      ? (entryCounts[competition.id] || 0).toLocaleString('en-ZA')
      : '—';

    const status = escapeHtml(competition.status);
    const featured = competition.is_featured ? 'Yes' : 'No';

    return `
      <tr>
        <td>
          <strong>${escapeHtml(competition.name)}</strong>
          <span class="table-subtext">${escapeHtml(competition.prize_description)}</span>
        </td>
        <td>${formatCurrency(competition.entry_price_cents)}</td>
        <td>${count}</td>
        <td>${escapeHtml(formatDate(competition.closes_at))}</td>
        <td>
          <span class="status-pill ${getStatusClass(competition.status)}">${status}</span>
        </td>
        <td>${featured}</td>
        <td>
          <button
            type="button"
            class="table-action"
            data-edit-competition="${escapeHtml(competition.id)}"
          >Edit</button>
        </td>
      </tr>
    `;
  }).join('');

  competitionTableBody
    .querySelectorAll('[data-edit-competition]')
    .forEach(button => {
      button.addEventListener('click', () => {
        openEditCompetition(button.dataset.editCompetition);
      });
    });
}

function updateDashboardStats(entryCounts, countsAvailable) {
  const totalCompetitions = competitionsCache.length;

  const openCompetitions = competitionsCache.filter(
    competition => competition.status === 'open'
  ).length;

  const totalEntries = countsAvailable
    ? Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    : null;

  document.getElementById('totalCompetitions').textContent =
    totalCompetitions.toLocaleString('en-ZA');

  document.getElementById('openCompetitions').textContent =
    openCompetitions.toLocaleString('en-ZA');

  document.getElementById('totalEntries').textContent =
    totalEntries === null
      ? '—'
      : totalEntries.toLocaleString('en-ZA');
}

document.getElementById('refreshCompetitionsButton')
  .addEventListener('click', loadCompetitions);

// ------------------------------------------------------
// CREATE AND EDIT COMPETITIONS
// ------------------------------------------------------

function openCreateCompetition() {
  competitionForm.reset();
  competitionId.value = '';
  competitionStatus.value = 'draft';
  populateProductDropdown('');
  updateImagePreview();

  document.getElementById('competitionModalTitle').textContent =
    'Create competition';

  saveCompetitionButton.textContent = 'Create competition';
  showMessage(competitionFormMessage, '');

  competitionModal.classList.remove('hidden');
}

function openEditCompetition(id) {
  const competition = competitionsCache.find(
    item => item.id === id
  );

  if (!competition) {
    showMessage(competitionMessage, 'Competition could not be found.');
    return;
  }

  competitionForm.reset();

  competitionId.value = competition.id;
  competitionName.value = competition.name || '';
  competitionPrize.value = competition.prize_description || '';
  competitionPrice.value =
    (Number(competition.entry_price_cents || 0) / 100).toFixed(2);

  competitionClosingDate.value =
    toLocalDateTimeInput(competition.closes_at);

  competitionStatus.value = competition.status || 'draft';
  competitionFeatured.checked = Boolean(competition.is_featured);

  populateProductDropdown(competition.product_id || '');

  competitionImage.value = competition.product_image_url || '';
  updateImagePreview();

  document.getElementById('competitionModalTitle').textContent =
    'Edit competition';

  saveCompetitionButton.textContent = 'Save changes';
  showMessage(competitionFormMessage, '');

  competitionModal.classList.remove('hidden');
}

document.getElementById('newCompetitionButton')
  .addEventListener('click', openCreateCompetition);

function closeCompetitionModal() {
  competitionModal.classList.add('hidden');
  competitionForm.reset();
  showMessage(competitionFormMessage, '');
}

document.getElementById('closeCompetitionModal')
  .addEventListener('click', closeCompetitionModal);

document.getElementById('cancelCompetitionButton')
  .addEventListener('click', closeCompetitionModal);

competitionModal.addEventListener('click', event => {
  if (event.target === competitionModal) {
    closeCompetitionModal();
  }
});

// ------------------------------------------------------
// SAVE COMPETITION
// ------------------------------------------------------

competitionForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  if (!currentAdmin) {
    showMessage(competitionFormMessage, 'Please sign in again.');
    return;
  }

  const name = competitionName.value.trim();
  const prizeDescription = competitionPrize.value.trim();
  const priceInRand = Number(competitionPrice.value);
  const status = competitionStatus.value;
  const productId = competitionProduct.value || null;
  const imageUrl = competitionImage.value.trim() || null;
  const closingDateValue = competitionClosingDate.value;
const isEditing = Boolean(competitionId.value);
  const allowedStatuses = ['draft', 'open', 'closed', 'completed'];

  if (!name || !prizeDescription) {
    showMessage(
      competitionFormMessage,
      'Please enter the competition name and prize description.'
    );
    return;
  }

  if (
    !Number.isFinite(priceInRand) ||
    priceInRand < 0 ||
    priceInRand > 21474836.47
  ) {
    showMessage(
      competitionFormMessage,
      'Please enter a valid non-negative entry price.'
    );
    return;
  }

  if (!allowedStatuses.includes(status)) {
    showMessage(
      competitionFormMessage,
      'Please select a valid competition status.'
    );
    return;
  }

  let closingDate = null;

  if (closingDateValue) {
    const parsedDate = new Date(closingDateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      showMessage(
        competitionFormMessage,
        'Please enter a valid closing date and time.'
      );
      return;
    }

    closingDate = parsedDate.toISOString();
  }

  const payload = {
    name,
    prize_description: prizeDescription,
    entry_price_cents: Math.round(priceInRand * 100),
    status,
    closes_at: closingDate,
    product_id: productId,
    product_image_url: imageUrl,
    is_featured: competitionFeatured.checked
  };

  saveCompetitionButton.disabled = true;
  saveCompetitionButton.textContent = 'Saving...';
  showMessage(competitionFormMessage, '');

  try {
    let result;

    if (isEditing) {
      result = await supabaseClient
        .from('competitions')
        .update(payload)
        .eq('id', competitionId.value)
        .select()
        .single();
    } else {
      result = await supabaseClient
        .from('competitions')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

   closeCompetitionModal();

await loadCompetitions();

showMessage(
  competitionMessage,
  isEditing
    ? 'Competition updated successfully.'
    : 'Competition saved successfully.',
  true
);

  } catch (error) {
    console.error('Saving competition error:', error);

    showMessage(
      competitionFormMessage,
      error.message || 'The competition could not be saved.'
    );
  } finally {
    saveCompetitionButton.disabled = false;
    saveCompetitionButton.textContent = isEditing
  ? 'Save changes'
  : 'Create competition';
  }
});
// ------------------------------------------------------
// ENTRIES MANAGEMENT
// ------------------------------------------------------

async function loadAdminEntries() {
  if (!currentAdmin) return;

  entriesTableBody.innerHTML =
    '<tr><td colspan="6" class="empty-state">Loading entries...</td></tr>';

  showMessage(entriesMessage, '');
  entriesResultCount.textContent = 'Loading entries...';

  const { data, error } = await supabaseClient.rpc('get_admin_entries');

  if (error) {
    console.error('Admin entries loading error:', error);

    entriesCache = [];

    entriesTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Could not load entries.</td></tr>';

    entriesResultCount.textContent = 'Entries could not be loaded.';

    showMessage(
      entriesMessage,
      error.message || 'Unable to retrieve customer entries.'
    );

    return;
  }

  entriesCache = data || [];

  populateEntriesCompetitionFilter();
  updateEntriesStatistics();
  renderAdminEntries();

  showMessage(
    entriesMessage,
    'Entries loaded successfully.',
    true
  );
}


// Populate competition filter
function populateEntriesCompetitionFilter() {
  const currentValue = entriesCompetitionFilter.value;

  entriesCompetitionFilter.innerHTML =
    '<option value="">All competitions</option>';

  const competitions = [
    ...new Map(
      entriesCache.map(entry => [
        entry.competition_id,
        {
          id: entry.competition_id,
          name: entry.competition_name
        }
      ])
    ).values()
  ];

  competitions.sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );

  competitions.forEach(competition => {
    const option = document.createElement('option');

    option.value = competition.id;
    option.textContent = competition.name;

    entriesCompetitionFilter.appendChild(option);
  });

  if (
    currentValue &&
    competitions.some(item => item.id === currentValue)
  ) {
    entriesCompetitionFilter.value = currentValue;
  }
}


// Update entry statistics
function updateEntriesStatistics() {
  const total = entriesCache.length;

  const paid = entriesCache.filter(
    entry => entry.payment_status === 'paid'
  ).length;

  const pending = entriesCache.filter(
    entry => entry.payment_status === 'pending'
  ).length;

  entriesTotalCount.textContent =
    total.toLocaleString('en-ZA');

  entriesPaidCount.textContent =
    paid.toLocaleString('en-ZA');

  entriesPendingCount.textContent =
    pending.toLocaleString('en-ZA');
}


// Format date without changing the calendar day
function formatEntryDate(value) {
  if (!value) return 'Not available';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}


// Render entries
function renderAdminEntries() {
  const searchTerm = entriesSearch.value.trim().toLowerCase();
  const competitionFilter = entriesCompetitionFilter.value;
  const paymentFilter = entriesPaymentFilter.value;
  const typeFilter = entriesTypeFilter.value;

  const filteredEntries = entriesCache.filter(entry => {
    const searchableText = [
      entry.customer_name,
      entry.customer_email,
      entry.competition_name,
      entry.entry_number,
      entry.entry_id
    ].join(' ').toLowerCase();

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    const matchesCompetition =
      !competitionFilter ||
      entry.competition_id === competitionFilter;

    const matchesPayment =
      !paymentFilter ||
      entry.payment_status === paymentFilter;

    const matchesType =
      !typeFilter ||
      entry.entry_type === typeFilter;

    return (
      matchesSearch &&
      matchesCompetition &&
      matchesPayment &&
      matchesType
    );
  });

  entriesResultCount.textContent =
    `Showing ${filteredEntries.length.toLocaleString('en-ZA')} of ` +
    `${entriesCache.length.toLocaleString('en-ZA')} entries`;

  if (filteredEntries.length === 0) {
    entriesTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No entries match your search or filters.</td></tr>';

    return;
  }

  entriesTableBody.innerHTML = filteredEntries.map(entry => {
    const paymentStatus = String(
      entry.payment_status || 'pending'
    ).toLowerCase();

    const entryType = String(
      entry.entry_type || 'paid'
    ).toLowerCase();

    const allowedPaymentStatuses = [
      'pending',
      'paid',
      'failed',
      'refunded'
    ];

    const safePaymentStatus = allowedPaymentStatuses.includes(paymentStatus)
      ? paymentStatus
      : 'pending';

    const safeEntryType = ['paid', 'referral'].includes(entryType)
      ? entryType
      : 'paid';

    return `
      <tr>
        <td>
          <strong>${escapeHtml(entry.customer_name || 'Name not provided')}</strong>
          <span class="table-subtext">${escapeHtml(entry.customer_email || 'No email')}</span>
        </td>

        <td>
          ${escapeHtml(entry.competition_name || 'Unknown competition')}
        </td>

        <td>
          ${escapeHtml(entry.entry_number)}
        </td>

        <td>
          ${escapeHtml(safeEntryType === 'referral' ? 'Referral' : 'Paid')}
        </td>

        <td>
          <span class="status-pill status-${safePaymentStatus}">
            ${escapeHtml(safePaymentStatus)}
          </span>
        </td>

        <td>
          ${escapeHtml(formatEntryDate(entry.entry_date))}
        </td>
      </tr>
    `;
  }).join('');
}


// Entry search and filters
entriesSearch.addEventListener('input', renderAdminEntries);

entriesCompetitionFilter.addEventListener(
  'change',
  renderAdminEntries
);

entriesPaymentFilter.addEventListener(
  'change',
  renderAdminEntries
);

entriesTypeFilter.addEventListener(
  'change',
  renderAdminEntries
);


// Clear entry filters
document.getElementById('clearEntriesFiltersButton')
  .addEventListener('click', function () {
    entriesSearch.value = '';
    entriesCompetitionFilter.value = '';
    entriesPaymentFilter.value = '';
    entriesTypeFilter.value = '';

    renderAdminEntries();
  });


// Refresh entries
document.getElementById('refreshEntriesButton')
  .addEventListener('click', loadAdminEntries);

// ------------------------------------------------------
// PAYMENTS MANAGEMENT
// ------------------------------------------------------

// Load real payment records from Supabase
async function loadAdminPayments() {
  if (!currentAdmin) return;

  paymentsTableBody.innerHTML =
    '<tr><td colspan="6" class="empty-state">Loading payments...</td></tr>';

  paymentsResultCount.textContent = 'Loading payments...';
  showMessage(paymentsMessage, '');

  const { data, error } = await supabaseClient.rpc('get_admin_payments');

  if (error) {
    console.error('Admin payments loading error:', error);

    paymentsCache = [];

    paymentsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Could not load payments.</td></tr>';

    paymentsResultCount.textContent = 'Payments could not be loaded.';

    showMessage(
      paymentsMessage,
      error.message || 'Unable to retrieve payment records.'
    );

    return;
  }

  paymentsCache = data || [];

  updatePaymentsStatistics();
  renderAdminPayments();

  showMessage(
    paymentsMessage,
    'Payments loaded successfully.',
    true
  );
}


// Update payment summary cards
function updatePaymentsStatistics() {
  const total = paymentsCache.length;

  const paid = paymentsCache.filter(
    payment => payment.status === 'paid'
  );

  const pending = paymentsCache.filter(
    payment => payment.status === 'pending'
  );

  // Revenue only includes successfully paid payments.
  const revenue = paid.reduce(
    (sum, payment) => sum + Number(payment.amount_cents || 0),
    0
  );

  paymentsTotalCount.textContent =
    total.toLocaleString('en-ZA');

  paymentsPaidCount.textContent =
    paid.length.toLocaleString('en-ZA');

  paymentsPendingCount.textContent =
    pending.length.toLocaleString('en-ZA');

  paymentsRevenueTotal.textContent =
    formatCurrency(revenue);
}


// Render payment records and apply search and filters
function renderAdminPayments() {
  const searchTerm = paymentsSearch.value.trim().toLowerCase();
  const statusFilter = paymentsStatusFilter.value;

  const filteredPayments = paymentsCache.filter(payment => {
    const searchableText = [
      payment.customer_name,
      payment.customer_email,
      payment.competition_name,
      payment.payfast_payment_id,
      payment.payment_id,
      payment.entry_id
    ].join(' ').toLowerCase();

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    const matchesStatus =
      !statusFilter || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  paymentsResultCount.textContent =
    `Showing ${filteredPayments.length.toLocaleString('en-ZA')} of ` +
    `${paymentsCache.length.toLocaleString('en-ZA')} payments`;

  if (filteredPayments.length === 0) {
    paymentsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No payments match your search or filters.</td></tr>';

    return;
  }

  const allowedStatuses = [
    'pending',
    'paid',
    'failed',
    'cancelled',
    'refunded'
  ];

  paymentsTableBody.innerHTML = filteredPayments.map(payment => {
    const rawStatus = String(payment.status || 'pending').toLowerCase();

    const safeStatus = allowedStatuses.includes(rawStatus)
      ? rawStatus
      : 'pending';

    const paymentDate = payment.paid_at || payment.created_at;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(payment.customer_name || 'Name not provided')}</strong>
          <span class="table-subtext">${escapeHtml(payment.customer_email || 'No email')}</span>
        </td>

        <td>
          ${escapeHtml(payment.competition_name || 'Unknown competition')}
        </td>

        <td>
          ${escapeHtml(formatCurrency(payment.amount_cents))}
        </td>

        <td>
          <span class="status-pill status-${safeStatus}">
            ${escapeHtml(safeStatus)}
          </span>
        </td>

        <td>
          ${escapeHtml(payment.payfast_payment_id || 'Not available')}
        </td>

        <td>
          ${escapeHtml(formatDate(paymentDate))}
        </td>
      </tr>
    `;
  }).join('');
}


// Payments search
paymentsSearch.addEventListener('input', renderAdminPayments);


// Payment status filter
paymentsStatusFilter.addEventListener(
  'change',
  renderAdminPayments
);


// Refresh payments
document.getElementById('refreshPaymentsButton')
  .addEventListener('click', loadAdminPayments);


// ------------------------------------------------------
// CUSTOMERS MANAGEMENT
// ------------------------------------------------------

// Load real customer records from Supabase
async function loadAdminCustomers() {
  if (!currentAdmin) return;

  customersTableBody.innerHTML =
    '<tr><td colspan="5" class="empty-state">Loading customers...</td></tr>';

  customersResultCount.textContent = 'Loading customers...';
  showMessage(customersMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_customer_directory'
  );

  if (error) {
    console.error('Admin customers loading error:', error);

    customersCache = [];

    customersTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Could not load customers.</td></tr>';

    customersResultCount.textContent = 'Customers could not be loaded.';

    showMessage(
      customersMessage,
      error.message || 'Unable to retrieve customer records.'
    );

    return;
  }

  customersCache = data || [];

  updateCustomersStatistics();
  renderAdminCustomers();

  showMessage(
    customersMessage,
    'Customers loaded successfully.',
    true
  );
}

// ------------------------------------------------------
// REFERRALS MANAGEMENT
// ------------------------------------------------------

// Load real referral records from Supabase
async function loadAdminReferrals() {
  if (!currentAdmin) return;

  referralsTableBody.innerHTML =
    '<tr><td colspan="6" class="empty-state">Loading referrals...</td></tr>';

  showMessage(referralsMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_referral_dashboard'
  );

  if (error) {
    console.error('Admin referrals loading error:', error);

    referralsCache = [];

    referralsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Could not load referrals.</td></tr>';

    showMessage(
      referralsMessage,
      error.message || 'Unable to retrieve referral records.'
    );

    return;
  }

  const dashboard = data || {};

  referralsCache = dashboard.referrals || [];

  if (totalReferrals) {
    totalReferrals.textContent =
      dashboard.summary?.total_referrals ?? 0;
  }

  if (qualifiedReferrals) {
    qualifiedReferrals.textContent =
      dashboard.summary?.qualified_referrals ?? 0;
  }

  if (rewardsIssued) {
    rewardsIssued.textContent =
      dashboard.rewards_summary?.rewards_issued ?? 0;
  }

  if (rewardsRedeemed) {
    rewardsRedeemed.textContent =
      dashboard.rewards_summary?.rewards_redeemed ?? 0;
  }

  renderAdminReferrals();

  showMessage(
    referralsMessage,
    'Referrals loaded successfully.',
    true
  );
}

// ------------------------------------------------------
// WINNERS MANAGEMENT
// ------------------------------------------------------

// Load monthly winner leaderboard from Supabase
async function loadWinnerLeaderboard() {
  if (!currentAdmin) return;

  const period = winnerPeriodInput?.value;

  if (!period) {
    showMessage(
      winnersMessage,
      'Please select a monthly period.'
    );
    return;
  }

  winnersLeaderboardBody.innerHTML =
    '<tr><td colspan="8">Loading leaderboard...</td></tr>';

  showMessage(winnersMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_monthly_winner_leaderboard',
    {
      p_monthly_period_start: period
    }
  );

  if (error) {
    console.error('Winner leaderboard error:', error);

    winnersLeaderboardCache = [];

    winnersLeaderboardBody.innerHTML =
      '<tr><td colspan="8">Could not load leaderboard.</td></tr>';

    showMessage(
      winnersMessage,
      error.message || 'Unable to load monthly results.'
    );

    return;
  }

  winnersLeaderboardCache = data || [];

  renderWinnerLeaderboard();

  showMessage(
    winnersMessage,
    'Monthly leaderboard loaded successfully.',
    true
  );
}

// Load Winners dashboard statistics and previous winners
async function loadAdminWinners() {
  if (!currentAdmin) return;

  if (previousWinnersTableBody) {
    previousWinnersTableBody.innerHTML =
      '<tr><td colspan="6">Loading previous winners...</td></tr>';
  }

  showMessage(winnersMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_monthly_winners'
  );

  if (error) {
    console.error('Admin winners error:', error);

    previousWinnersCache = [];

    if (previousWinnersTableBody) {
      previousWinnersTableBody.innerHTML =
        '<tr><td colspan="6">Could not load previous winners.</td></tr>';
    }

    showMessage(
      winnersMessage,
      error.message || 'Unable to load winners.'
    );

    return;
  }

  previousWinnersCache = data || [];

  totalWinners.textContent = previousWinnersCache.length;

  pendingWinners.textContent =
    previousWinnersCache.filter(w => w.status === 'pending_confirmation').length;

  confirmedWinners.textContent =
    previousWinnersCache.filter(w => w.status === 'confirmed').length;

  deliveredWinners.textContent =
    previousWinnersCache.filter(w => w.status === 'delivered').length;

  renderPreviousWinners();

  showMessage(
    winnersMessage,
    'Winners dashboard loaded successfully.',
    true
  );
}

 // Select and save the monthly winner
async function selectAdminMonthlyWinner(attemptId) {
  if (!currentAdmin) return;

  const period = winnerPeriodInput?.value;

  if (!period) {
    showMessage(winnersMessage, 'Please select a monthly period.');
    return;
  }

  const winner = winnersLeaderboardCache.find(
    item => item.attempt_id === attemptId
  );

  if (!winner) {
    showMessage(winnersMessage, 'Winner details could not be found.');
    return;
  }

  const customerName = [
    winner.first_name,
    winner.last_name
  ].filter(Boolean).join(' ') || 'Unknown customer';

  const completionTime =
    (Number(winner.completion_time_ms) / 1000).toFixed(3);

  const confirmation = window.confirm(
    'CONFIRM MONTHLY WINNER SELECTION\n\n' +
    'Customer: ' + customerName + '\n' +
    'Email: ' + (winner.email || 'Not available') + '\n' +
    'Competition: ' + winner.competition_name + '\n' +
    'Entry number: ' + winner.entry_number + '\n' +
    'Score: ' + winner.total_score + '\n' +
    'Accuracy: ' + winner.accuracy + '%\n' +
    'Completion time: ' + completionTime + ' seconds\n\n' +
    'Are you sure you want to select this customer as the monthly winner?'
  );

  if (!confirmation) return;

  showMessage(winnersMessage, 'Saving selected winner...');

  const { data, error } = await supabaseClient.rpc(
    'select_admin_monthly_winner',
    {
      p_monthly_period_start: period,
      p_attempt_id: attemptId
    }
  );

  if (error) {
    console.error('Winner selection error:', error);

    showMessage(
      winnersMessage,
      error.message || 'Could not save the selected winner.'
    );

    return;
  }

  await loadAdminWinners();
  await loadWinnerLeaderboard();

  showMessage(
    winnersMessage,
    'Winner selected successfully! Status: Pending confirmation.',
    true
  );
}


// Display previous winners
function renderPreviousWinners() {
  if (!previousWinnersTableBody) return;

  if (!previousWinnersCache.length) {
    previousWinnersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No winners have been selected yet.
        </td>
      </tr>
    `;
    return;
  }

  previousWinnersTableBody.innerHTML =
    previousWinnersCache.map(winner => {
      const customerName = [
        winner.first_name,
        winner.last_name
      ].filter(Boolean).join(' ') || 'Unknown customer';

      return `
        <tr>
          <td>${escapeHtml(winner.monthly_period_start)}</td>

          <td>
            ${escapeHtml(customerName)}
            <br>
            <small>${escapeHtml(winner.email || '')}</small>
          </td>

          <td>${escapeHtml(winner.competition_name)}</td>

          <td>${escapeHtml(winner.total_score)}</td>

          <td>${escapeHtml(winner.status.replaceAll('_', ' '))}</td>

          <td>${escapeHtml(formatDate(winner.selected_at))}</td>
        </tr>
      `;
    }).join('');
}


// Display monthly leaderboard
function renderWinnerLeaderboard() {
  if (!winnersLeaderboardBody) return;

  if (!winnersLeaderboardCache.length) {
    winnersLeaderboardBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No eligible participants found for this monthly period.
        </td>
      </tr>
    `;
    return;
  }

  winnersLeaderboardBody.innerHTML =
    winnersLeaderboardCache.map(winner => {
      const customerName = [
        winner.first_name,
        winner.last_name
      ].filter(Boolean).join(' ') || 'Unknown customer';

      return `
        <tr>
          <td>${escapeHtml(winner.ranking_position)}</td>

          <td>
            ${escapeHtml(customerName)}
            <br>
            <small>${escapeHtml(winner.email || '')}</small>
          </td>

          <td>${escapeHtml(winner.competition_name)}</td>

          <td>${escapeHtml(winner.entry_number)}</td>

          <td>${escapeHtml(winner.total_score)}</td>

          <td>${escapeHtml(winner.accuracy)}%</td>

          <td>
            ${escapeHtml(
              (Number(winner.completion_time_ms) / 1000).toFixed(3)
            )} sec
          </td>

          <td>
            <button
              type="button"
              class="btn btn-primary"
              data-select-winner="${escapeHtml(winner.attempt_id)}"
            >
              Select winner
            </button>
          </td>
        </tr>
      `;
    }).join('');
}

// ------------------------------------------------------
// CUSTOMER SUPPORT MANAGEMENT
// ------------------------------------------------------

// Load support requests from Supabase
async function loadAdminSupport() {
  if (!currentAdmin) return;

  supportTableBody.innerHTML =
    '<tr><td colspan="6">Loading support requests...</td></tr>';

  showMessage(supportMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_support_requests'
  );

  if (error) {
    console.error('Support requests error:', error);

    supportRequestsCache = [];

    supportTableBody.innerHTML =
      '<tr><td colspan="6">Could not load support requests.</td></tr>';

    showMessage(
      supportMessage,
      error.message || 'Unable to load support requests.'
    );

    return;
  }

  supportRequestsCache = data || [];

  renderAdminSupport();

  showMessage(
    supportMessage,
    'Support requests loaded successfully.',
    true
  );
}



// Render support request table
function renderAdminSupport() {
  if (!supportTableBody) return;

  const searchTerm = (supportSearch?.value || '').toLowerCase();
  const selectedStatus = supportStatusFilter?.value || 'all';

  const filteredRequests = supportRequestsCache.filter(request => {
    const customerName = [
      request.first_name,
      request.last_name
    ].filter(Boolean).join(' ');

    const searchText = [
      request.ticket_number,
      customerName,
      request.email,
      request.topic,
      request.message
    ].join(' ').toLowerCase();

    const matchesSearch = searchText.includes(searchTerm);

    const matchesStatus =
      selectedStatus === 'all' ||
      request.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  totalSupportRequests.textContent = supportRequestsCache.length;

  openSupportRequests.textContent =
    supportRequestsCache.filter(r => r.status === 'open').length;

  inProgressSupportRequests.textContent =
    supportRequestsCache.filter(r => r.status === 'in_progress').length;

  resolvedSupportRequests.textContent =
    supportRequestsCache.filter(r => r.status === 'resolved').length;

  if (!filteredRequests.length) {
    supportTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          No matching support requests found.
        </td>
      </tr>
    `;
    return;
  }

  supportTableBody.innerHTML = filteredRequests.map(request => {
    const customerName = [
      request.first_name,
      request.last_name
    ].filter(Boolean).join(' ') || 'Unknown customer';

    return `
      <tr>
        <td><strong>#${escapeHtml(request.ticket_number)}</strong></td>
        <td>${escapeHtml(customerName)}</td>
        <td>${escapeHtml(request.email)}</td>
        <td>${escapeHtml(request.topic)}</td>
        <td>${escapeHtml(formatDate(request.created_at))}</td>
        <td>${escapeHtml(request.status.replaceAll('_', ' '))}</td>
        <td>
          <button
            type="button"
            class="btn btn-primary"
            data-view-support="${escapeHtml(request.request_id)}"
          >
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// View individual customer support request
function showSupportDetails(requestId) {
  selectedSupportRequestId = requestId;
  const request = supportRequestsCache.find(
    item => item.request_id === requestId
  );

  if (!request) {
    showMessage(supportMessage, 'Support request could not be found.');
    return;
  }

  const customerName = [
    request.first_name,
    request.last_name
  ].filter(Boolean).join(' ') || 'Unknown customer';

  supportDetailsContent.innerHTML = `
    <div class="detail-group">
      <h4>Customer</h4>
      <p>${escapeHtml(customerName)}</p>
    </div>

    <div class="detail-group">
      <h4>Email address</h4>
      <p>${escapeHtml(request.email)}</p>
    </div>

    <div class="detail-group">
      <h4>Topic</h4>
      <p>${escapeHtml(request.topic)}</p>
    </div>

    <div class="detail-group">
      <h4>Message</h4>
      <p style="white-space: pre-wrap;">${escapeHtml(request.message)}</p>
    </div>

    <div class="detail-group">
      <h4>Status</h4>
      <p>${escapeHtml(request.status.replaceAll('_', ' '))}</p>
    </div>

    <div class="detail-group">
      <h4>Date submitted</h4>
      <p>${escapeHtml(formatDate(request.created_at))}</p>
    </div>
  `;

  supportDetailsPanel.hidden = false;
  supportDetailsPanel.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

async function updateAdminSupportStatus() {
  if (!selectedSupportRequestId) {
    showMessage(supportUpdateMessage, 'Please select a support request.');
    return;
  }

  const newStatus = supportNewStatus.value;

  updateSupportStatusBtn.disabled = true;
  updateSupportStatusBtn.textContent = 'Updating...';

  showMessage(supportUpdateMessage, 'Updating support request...');

  try {
    const { error } = await supabaseClient.rpc(
      'update_admin_support_status',
      {
        p_request_id: selectedSupportRequestId,
        p_status: newStatus
      }
    );

    if (error) throw error;

    showMessage(
      supportUpdateMessage,
      'Support request status updated successfully.',
      true
    );

    await loadAdminSupport();

    showSupportDetails(selectedSupportRequestId);

  } catch (error) {
    console.error('Support status update error:', error);

    showMessage(
      supportUpdateMessage,
      error.message || 'Could not update support request status.'
    );

  } finally {
    updateSupportStatusBtn.disabled = false;
    updateSupportStatusBtn.textContent = 'Update status';
  }
}

// Render referral activity table
function renderAdminReferrals() {
  if (!referralsTableBody) return;

  const searchTerm = (referralSearch?.value || '')
    .trim()
    .toLowerCase();

  const filteredReferrals = referralsCache.filter(referral => {
    const referrer = referral.referrer || {};
    const referred = referral.referred || {};

    const searchableText = [
      referral.referral_code,
      referral.status,
      referrer.first_name,
      referrer.last_name,
      referrer.email,
      referred.first_name,
      referred.last_name,
      referred.email
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  });

  if (!filteredReferrals.length) {
    referralsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No referral records found.
        </td>
      </tr>
    `;
    return;
  }

  referralsTableBody.innerHTML = filteredReferrals.map(referral => {
    const referrer = referral.referrer || {};
    const referred = referral.referred || {};

    const referrerName = [
      referrer.first_name,
      referrer.last_name
    ].filter(Boolean).join(' ') || 'Unknown customer';

    const referredName = [
      referred.first_name,
      referred.last_name
    ].filter(Boolean).join(' ') || 'Unknown customer';

    const status = referral.status || 'Unknown';

    return `
      <tr>
        <td>${escapeHtml(referral.referral_code || '—')}</td>
        <td>
          ${escapeHtml(referrerName)}
          <br>
          <small>${escapeHtml(referrer.email || '')}</small>
        </td>
        <td>
          ${escapeHtml(referredName)}
          <br>
          <small>${escapeHtml(referred.email || '')}</small>
        </td>
        <td>
          <span class="status-badge">
            ${escapeHtml(status)}
          </span>
        </td>
        <td>${escapeHtml(formatDate(referral.created_at))}</td>
        <td>
          <button
            type="button"
            class="btn btn-secondary"
            data-referral-id="${escapeHtml(referral.id)}"
          >
            View details
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Display full referral details
function showReferralDetails(referralId) {
  const referral = referralsCache.find(
    item => item.id === referralId
  );

  if (!referral) return;

  const referrer = referral.referrer || {};
  const referred = referral.referred || {};
  const rewards = referral.rewards || [];

  const customerName = customer => {
    return [
      customer.first_name,
      customer.last_name
    ].filter(Boolean).join(' ') || 'Unknown customer';
  };

  const rewardDetails = rewards.length
    ? rewards.map(reward => `
        <div class="detail-item">
          <strong>Reward status:</strong>
          ${escapeHtml(reward.status || 'Unknown')}
          <br>
          <strong>Created:</strong>
          ${escapeHtml(reward.created_at ? formatDate(reward.created_at) : '—')}
          <br>
          <strong>Expires:</strong>
          ${escapeHtml(reward.expires_at ? formatDate(reward.expires_at) : '—')}
          <br>
          <strong>Redeemed:</strong>
          ${escapeHtml(reward.redeemed_at ? formatDate(reward.redeemed_at) : '—')}
        </div>
      `).join('')
    : '<p>No rewards recorded for this referral.</p>';

  referralDetailsContent.innerHTML = `
    <div class="detail-item">
      <h4>Referral information</h4>
      <p><strong>Referral code:</strong> ${escapeHtml(referral.referral_code || '—')}</p>
      <p><strong>Status:</strong> ${escapeHtml(referral.status || 'Unknown')}</p>
      <p><strong>Created:</strong> ${escapeHtml(referral.created_at ? formatDate(referral.created_at) : '—')}</p>
      <p><strong>Qualified:</strong> ${escapeHtml(referral.qualified_at ? formatDate(referral.qualified_at) : '—')}</p>
    </div>

    <div class="detail-item">
      <h4>Referring customer</h4>
      <p><strong>Name:</strong> ${escapeHtml(customerName(referrer))}</p>
      <p><strong>Email:</strong> ${escapeHtml(referrer.email || '—')}</p>
    </div>

    <div class="detail-item">
      <h4>Referred customer</h4>
      <p><strong>Name:</strong> ${escapeHtml(customerName(referred))}</p>
      <p><strong>Email:</strong> ${escapeHtml(referred.email || '—')}</p>
    </div>

    <div class="detail-item">
      <h4>Referral rewards</h4>
      ${rewardDetails}
    </div>
  `;

  referralDetailsPanel.classList.remove('hidden');

  referralDetailsPanel.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Handle referral detail button clicks
referralsTableBody.addEventListener('click', event => {
  const button = event.target.closest('[data-referral-id]');

  if (!button) return;

  showReferralDetails(button.dataset.referralId);
});


// Update customer summary cards
function updateCustomersStatistics() {
  const total = customersCache.length;

  const active = customersCache.filter(
    customer => customer.account_status === 'active'
  ).length;

  const paused = customersCache.filter(
    customer => customer.account_status === 'paused'
  ).length;

  customersTotalCount.textContent =
    total.toLocaleString('en-ZA');

  customersActiveCount.textContent =
    active.toLocaleString('en-ZA');

  customersPausedCount.textContent =
    paused.toLocaleString('en-ZA');
}


// Render customers and apply search and filters
function renderAdminCustomers() {
  const searchTerm = customersSearch.value.trim().toLowerCase();
  const statusFilter = customersStatusFilter.value;

  const filteredCustomers = customersCache.filter(customer => {
    const searchableText = [
      customer.first_name,
      customer.last_name,
      customer.email,
      customer.phone_number,
      customer.user_id
    ].join(' ').toLowerCase();

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    const matchesStatus =
      !statusFilter || customer.account_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  customersResultCount.textContent =
    `Showing ${filteredCustomers.length.toLocaleString('en-ZA')} of ` +
    `${customersCache.length.toLocaleString('en-ZA')} customers`;

  if (filteredCustomers.length === 0) {
    customersTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No customers match your search or filter.</td></tr>';

    return;
  }

  customersTableBody.innerHTML = filteredCustomers.map(customer => {
    const fullName = [
      customer.first_name,
      customer.last_name
    ].filter(Boolean).join(' ') || 'Name not provided';

    const status = customer.account_status === 'paused'
      ? 'paused'
      : 'active';

    const statusLabel = status === 'paused' ? 'Paused' : 'Active';

    const statusClass = status === 'paused'
      ? 'status-closed'
      : 'status-open';

    const actionLabel = status === 'paused'
      ? 'Reactivate'
      : 'Pause account';

    const entries = Number(customer.total_entries || 0);
    const payments = Number(customer.total_payments || 0);

    const accountDetails =
      `${entries} entries · ${payments} payment orders`;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(fullName)}</strong>
          <span class="table-subtext">
            ${escapeHtml(customer.user_id)}
          </span>
          <span class="table-subtext">
            ${escapeHtml(customer.phone_number || 'No phone number')}
          </span>
          <span class="table-subtext">
            ${escapeHtml(accountDetails)}
          </span>
        </td>

        <td>
          ${escapeHtml(customer.email || 'No email')}
        </td>

        <td>
          ${escapeHtml(formatDate(customer.registration_date))}
        </td>

        <td>
          <span class="status-pill ${statusClass}">
            ${statusLabel}
          </span>
          ${
            status === 'paused'
              ? `<span class="table-subtext">
                  ${escapeHtml(customer.pause_reason || 'No reason provided')}
                </span>`
              : ''
          }
        </td>

        <td>
          <button
            type="button"
            class="table-action"
            data-customer-status="${escapeHtml(customer.user_id)}"
            data-next-status="${status === 'paused' ? 'active' : 'paused'}"
          >
            ${actionLabel}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Connect the Pause and Reactivate buttons
  customersTableBody
    .querySelectorAll('[data-customer-status]')
    .forEach(button => {
      button.addEventListener('click', async () => {
        await changeCustomerStatus(
          button.dataset.customerStatus,
          button.dataset.nextStatus,
          button
        );
      });
    });
}


// Pause or reactivate a customer
async function changeCustomerStatus(userId, newStatus, button) {
  if (!currentAdmin) {
    showMessage(customersMessage, 'Please sign in again.');
    return;
  }

  const customer = customersCache.find(
    item => item.user_id === userId
  );

  if (!customer) {
    showMessage(customersMessage, 'Customer account could not be found.');
    return;
  }

  let reason = null;

  if (newStatus === 'paused') {
    const enteredReason = prompt(
      `Why are you pausing ${customer.email}?`
    );

    if (enteredReason === null) return;

    reason = enteredReason.trim() || 'Paused by administrator';

    const confirmed = confirm(
      `Are you sure you want to mark ${customer.email} as paused?`
    );

    if (!confirmed) return;

  } else {
    const confirmed = confirm(
      `Are you sure you want to reactivate ${customer.email}?`
    );

    if (!confirmed) return;
  }

  button.disabled = true;
  button.textContent = 'Updating...';

  showMessage(customersMessage, '');

  try {
    const { data, error } = await supabaseClient.rpc(
      'set_admin_customer_status',
      {
        p_user_id: userId,
        p_status: newStatus,
        p_reason: reason
      }
    );

    if (error) throw error;

    if (data !== true) {
      throw new Error('The account status could not be updated.');
    }

    await loadAdminCustomers();

    showMessage(
      customersMessage,
      newStatus === 'paused'
        ? 'Customer account status changed to paused.'
        : 'Customer account successfully reactivated.',
      true
    );

  } catch (error) {
    console.error('Customer status update error:', error);

    showMessage(
      customersMessage,
      error.message || 'Unable to update customer account status.'
    );

    button.disabled = false;
    button.textContent =
      newStatus === 'paused' ? 'Pause account' : 'Reactivate';
  }
}


// Customer search
customersSearch.addEventListener(
  'input',
  renderAdminCustomers
);


// Customer status filter
customersStatusFilter.addEventListener(
  'change',
  renderAdminCustomers
);


// Refresh customers
document.getElementById('refreshCustomersButton')
  .addEventListener('click', loadAdminCustomers);

// Referral search
if (referralSearch) {
  referralSearch.addEventListener(
    'input',
    renderAdminReferrals
  );
}

// Refresh referrals
document.getElementById('refreshReferralsBtn')
  ?.addEventListener('click', loadAdminReferrals);
// Winners leaderboard button
document.getElementById('loadWinnerLeaderboardBtn')
  ?.addEventListener('click', loadWinnerLeaderboard);

// Handle Select winner buttons
winnersLeaderboardBody?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-select-winner]');

  if (!button) return;

  await selectAdminMonthlyWinner(button.dataset.selectWinner);
});

// Refresh winners leaderboard
document.getElementById('refreshWinnersBtn')
  ?.addEventListener('click', loadWinnerLeaderboard);

// ------------------------------------------------------
// CUSTOMER SUPPORT EVENT LISTENERS
// ------------------------------------------------------

// Refresh support requests
document.getElementById('refreshSupportBtn')
  ?.addEventListener('click', loadAdminSupport);

// Search support requests
supportSearch?.addEventListener('input', renderAdminSupport);

// Filter support requests by status
supportStatusFilter?.addEventListener('change', renderAdminSupport);

// Open individual support request
supportTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view-support]');

  if (!button) return;

  showSupportDetails(button.dataset.viewSupport);
});
// Update support request status
updateSupportStatusBtn?.addEventListener(
  'click',
  updateAdminSupportStatus
);

// ==========================================
// CHALLENGE RESULTS
// ==========================================

async function loadAdminChallengeResults() {
  showMessage(resultsMessage, 'Loading challenge results...');

  resultsTableBody.innerHTML = `
    <tr>
      <td colspan="10" class="empty-state">
        Loading challenge results...
      </td>
    </tr>
  `;

  const { data, error } = await supabaseClient.rpc(
    'get_admin_challenge_results'
  );

  if (error) {
    console.error('Challenge results error:', error);

    showMessage(
      resultsMessage,
      'Unable to load challenge results: ' + error.message
    );

    resultsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          Could not load challenge results.
        </td>
      </tr>
    `;

    return;
  }

  challengeResultsCache = data || [];

    updateChallengeResultStats();
  populateResultsCompetitionFilter();
  renderChallengeResults();

  showMessage(resultsMessage, 'Challenge results loaded successfully.', true);
}

function updateChallengeResultStats() {
  resultsTotalCount.textContent = challengeResultsCache.length;

  resultsSubmittedCount.textContent =
    challengeResultsCache.filter(
      item => item.attempt_status === 'submitted'
    ).length;

  resultsInProgressCount.textContent =
    challengeResultsCache.filter(
      item => item.attempt_status === 'in_progress'
    ).length;

  resultsDisqualifiedCount.textContent =
    challengeResultsCache.filter(
      item => item.attempt_status === 'disqualified'
    ).length;
}

function populateResultsCompetitionFilter() {
  const selectedValue = resultsCompetitionFilter.value;

  const competitions = [
    ...new Map(
      challengeResultsCache.map(item => [
        item.competition_id,
        item.competition_name
      ])
    ).entries()
  ];

  resultsCompetitionFilter.innerHTML =
    '<option value="">All competitions</option>';

  competitions.forEach(([id, name]) => {
    const option = document.createElement('option');

    option.value = id;
    option.textContent = name || 'Unnamed competition';

    resultsCompetitionFilter.appendChild(option);
  });

  resultsCompetitionFilter.value = selectedValue;
}

function renderChallengeResults() {
  const searchTerm = resultsSearch.value.trim().toLowerCase();
  const competitionFilter = resultsCompetitionFilter.value;
  const statusFilter = resultsStatusFilter.value;

  const filteredResults = challengeResultsCache.filter(item => {
    const matchesSearch =
      !searchTerm ||
      (item.customer_name || '').toLowerCase().includes(searchTerm) ||
      (item.competition_name || '').toLowerCase().includes(searchTerm) ||
      String(item.entry_number || '').toLowerCase().includes(searchTerm);

    const matchesCompetition =
      !competitionFilter ||
      item.competition_id === competitionFilter;

    const matchesStatus =
      !statusFilter ||
      item.attempt_status === statusFilter;

    return matchesSearch && matchesCompetition && matchesStatus;
  });

  resultsResultCount.textContent =
    `${filteredResults.length} of ${challengeResultsCache.length} attempts`;

  if (filteredResults.length === 0) {
    resultsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          No matching challenge attempts found.
        </td>
      </tr>
    `;

    return;
  }

  resultsTableBody.innerHTML = filteredResults.map(item => {
    const status = ['submitted', 'in_progress', 'disqualified']
      .includes(item.attempt_status)
      ? item.attempt_status
      : 'unknown';

    const completionTime = item.completion_time_ms != null
      ? formatCompletionTime(item.completion_time_ms)
      : '—';

    return `
      <tr>
        <td>${escapeHtml(item.customer_name || 'Name not provided')}</td>
        <td>${escapeHtml(item.competition_name || 'Unknown competition')}</td>
        <td>${escapeHtml(item.entry_number ?? '—')}</td>
        <td>${escapeHtml(item.total_score ?? 0)}</td>
        <td>${escapeHtml(item.correct_answers ?? 0)}</td>
        <td>${escapeHtml(item.accuracy ?? 0)}%</td>
        <td>
          <span class="status-badge ${escapeHtml(getChallengeResultStatusClass(status))}">
            ${escapeHtml(status.replace('_', ' '))}
          </span>
        </td>
        <td>${escapeHtml(formatDate(item.started_at))}</td>
        <td>${escapeHtml(completionTime)}</td>
        <td>
          <button
            class="secondary-button"
            type="button"
            data-view-attempt="${escapeHtml(item.attempt_id)}"
          >
            View answers
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function formatCompletionTime(milliseconds) {
  const totalSeconds = Math.floor(Number(milliseconds) / 1000);

  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '—';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ==========================================
// INDIVIDUAL CHALLENGE ATTEMPT DETAILS
// ==========================================

async function loadChallengeAttemptDetails(attemptId) {
  attemptDetailsPanel.classList.remove('hidden');

  attemptDetailsSubtitle.textContent =
    'Loading individual challenge answers...';

  attemptDetailsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
        Loading answers...
      </td>
    </tr>
  `;

  showMessage(attemptDetailsMessage, '');

  const { data, error } = await supabaseClient.rpc(
    'get_admin_challenge_attempt_details',
    {
      p_attempt_id: attemptId
    }
  );

  if (error) {
    console.error('Attempt details error:', error);

    showMessage(
      attemptDetailsMessage,
      'Unable to load attempt details: ' + error.message
    );

    attemptDetailsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          Could not load individual answers.
        </td>
      </tr>
    `;

    return;
  }

  const details = data || [];

  attemptDetailsSubtitle.textContent =
    `${details.length} challenge tasks in this attempt`;

  if (details.length === 0) {
    attemptDetailsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          No task details found.
        </td>
      </tr>
    `;

    return;
  }

  attemptDetailsTableBody.innerHTML = details.map(task => {
    let resultText = 'Not answered';
    let resultClass = '';

    if (task.is_correct === true) {
      resultText = 'Correct';
      resultClass = 'success';
    } else if (task.is_correct === false) {
      resultText = 'Incorrect';
      resultClass = 'danger';
    }

    return `
      <tr>
        <td>${escapeHtml(task.task_number ?? '—')}</td>
        <td>${escapeHtml(task.instruction || 'No instruction available')}</td>
        <td>${escapeHtml(task.selected_answer_key || 'Not answered')}</td>
        <td>${escapeHtml(task.correct_answer_key || '—')}</td>
        <td>
          <span class="status-badge ${resultClass}">
            ${resultText}
          </span>
        </td>
        <td>${escapeHtml(task.points_awarded ?? 0)}</td>
        <td>
          ${task.answered_at
            ? escapeHtml(formatDate(task.answered_at))
            : '—'}
        </td>
      </tr>
    `;
  }).join('');

  showMessage(attemptDetailsMessage, 'Challenge answers loaded successfully.', true);
}


// ==========================================
// CHALLENGE RESULTS EVENT LISTENERS
// ==========================================

// Search results
resultsSearch.addEventListener('input', renderChallengeResults);

// Filter by competition
resultsCompetitionFilter.addEventListener('change', renderChallengeResults);

// Filter by attempt status
resultsStatusFilter.addEventListener('change', renderChallengeResults);

// Refresh results
document.getElementById('refreshResultsButton')
  .addEventListener('click', loadAdminChallengeResults);

// Clear filters
document.getElementById('clearResultsFiltersButton')
  .addEventListener('click', () => {
    resultsSearch.value = '';
    resultsCompetitionFilter.value = '';
    resultsStatusFilter.value = '';

    renderChallengeResults();
  });

// View individual answers
resultsTableBody.addEventListener('click', event => {
  const button = event.target.closest('[data-view-attempt]');

  if (!button) {
    return;
  }

  const attemptId = button.dataset.viewAttempt;

  loadChallengeAttemptDetails(attemptId);
});

// Close challenge answers modal
document.getElementById('closeAttemptDetailsButton')
  .addEventListener('click', () => {
    attemptDetailsPanel.classList.add('hidden');
  });

// Close challenge answers modal when clicking outside
attemptDetailsPanel.addEventListener('click', event => {
  if (event.target === attemptDetailsPanel) {
    attemptDetailsPanel.classList.add('hidden');
  }
});

// Close referral details modal
document.getElementById('closeReferralDetailsButton')
  .addEventListener('click', () => {
    referralDetailsPanel.classList.add('hidden');
  });

// Close referral details modal when clicking outside
referralDetailsPanel.addEventListener('click', event => {
  if (event.target === referralDetailsPanel) {
    referralDetailsPanel.classList.add('hidden');
  }
});
// ------------------------------------------------------
// INITIAL STARTUP
// ------------------------------------------------------

checkExistingSession();
