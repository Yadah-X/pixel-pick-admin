
const SUPABASE_URL =
  'https://cxhclxtbtrsyfigqleeg.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_N4pRAlpCzjTEoKR7TCYOEA_Irj7mCrv';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const connectionStatus =
  document.getElementById('connectionStatus');

let checkingAdmin = false;

function showLogin(message = '') {
  loginScreen.hidden = false;
  adminApp.hidden = true;
  loginMessage.textContent = message;
}

function showDashboard(user) {
  loginScreen.hidden = true;
  adminApp.hidden = false;

  document.getElementById('adminEmail').textContent =
    user.email || 'Administrator';
}

async function verifyAdminAccess(session) {
  if (checkingAdmin) return;

  if (!session?.user) {
    showLogin();
    return;
  }

  checkingAdmin = true;
  connectionStatus.textContent =
    'Verifying administrator permissions...';

  try {
    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Admin verification error:', error);

      showLogin(
        'Could not verify administrator access. Please try again.'
      );

      return;
    }

    if (!data) {
      await supabaseClient.auth.signOut();

      showLogin(
        'This account is not authorised to access Pixel Pick Admin.'
      );

      return;
    }

    showDashboard(session.user);

    connectionStatus.textContent =
      'Administrator access verified successfully. Your dashboard is ready for the next development stage.';
  } catch (error) {
    console.error('Admin verification failed:', error);

    showLogin(
      'A connection problem occurred. Please try again.'
    );
  } finally {
    checkingAdmin = false;
  }
}

// Administrator login
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  loginMessage.textContent = '';
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const captchaToken = document.querySelector(
  '[name="cf-turnstile-response"]'
)?.value;

if (!captchaToken) {
  loginMessage.textContent =
    'Please complete the security verification first.';
  return;
}

const { error } = await supabaseClient.auth.signInWithPassword({
  email,
  password,
  options: {
    captchaToken
  }
});

    if (error) {
      loginMessage.textContent =
  error.message || 'Unknown sign-in error';

      console.error('Login error:', error);
    } else {
      loginMessage.textContent =
        'Login successful. Checking administrator access...';
    }
  } catch (error) {
    loginMessage.textContent =
      'Could not connect. Please try again.';

    console.error(error);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in';
  }
});

// Logout
document.getElementById('logoutButton').addEventListener(
  'click',
  async () => {
    const button = document.getElementById('logoutButton');

    button.disabled = true;

    const { error } = await supabaseClient.auth.signOut();

    button.disabled = false;

    if (error) {
      alert('Could not sign out. Please try again.');
      console.error(error);
    }
  }
);

// Update the selected navigation link
document.querySelectorAll('aside nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('aside nav a').forEach((item) => {
      item.classList.remove('active');
    });

    link.classList.add('active');
  });
});

// Listen for login and logout changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  setTimeout(() => {
    if (session?.user) {
      verifyAdminAccess(session);
    } else {
      showLogin();
    }
  }, 0);
});

// Check whether an existing session is available
async function initialiseAdmin() {
  showLogin();

  const { data, error } =
    await supabaseClient.auth.getSession();

  if (error) {
    showLogin('Could not check your login session.');
    console.error(error);
    return;
  }

  if (data.session) {
    await verifyAdminAccess(data.session);
  }
}

initialiseAdmin();
