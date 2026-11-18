
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
// INITIAL STARTUP
// ------------------------------------------------------

checkExistingSession();
