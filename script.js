
const SUPABASE_URL =
  'https://cxhclxtbtrsyfigqleeg.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_N4pRAlpCzjTEoKR7TCYOEA_Irj7mCrv';

const TURNSTILE_SITE_KEY =
  '0x4AAAAAAF-RWWgVowvnilq4';

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

let captchaToken = null;
let turnstileWidgetId = null;


// CLOUDFlARE TURNSTILE INITIALISATION
// This function is called when Cloudflare has loaded.

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

        console.log(
          'Cloudflare verification received:',
          Boolean(captchaToken)
        );
      },

      'expired-callback': function () {
        captchaToken = null;

        console.log('Cloudflare verification expired.');
      },

      'error-callback': function () {
        captchaToken = null;

        loginMessage.textContent =
          'Security verification encountered an error. Please try again.';

        console.error('Cloudflare Turnstile error.');
      }
    }
  );
};


// SHOW LOGIN
function showLogin(message = '') {
  loginScreen.hidden = false;
  adminApp.hidden = true;
  loginMessage.textContent = message;
}


// SHOW DASHBOARD
function showDashboard(user) {
  loginScreen.hidden = true;
  adminApp.hidden = false;

  document.getElementById('adminEmail').textContent =
    user.email || 'Administrator';
}


// VERIFY ADMINISTRATOR ACCESS
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


// RESET CAPTCHA
function resetCaptcha() {
  captchaToken = null;

  if (
    window.turnstile &&
    turnstileWidgetId !== null
  ) {
    window.turnstile.reset(turnstileWidgetId);
  }
}


// ADMINISTRATOR LOGIN
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  loginMessage.textContent = '';

  if (!captchaToken) {
    loginMessage.textContent =
      'Please complete the Cloudflare security verification first.';
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';

  const email =
    document.getElementById('email').value.trim();

  const password =
    document.getElementById('password').value;

  try {
    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken
        }
      });

    if (error) {
      loginMessage.textContent =
        error.message || 'Sign-in failed. Please try again.';

      console.error('Login error:', error);

    } else {
      loginMessage.textContent =
        'Login successful. Checking administrator access...';
    }

  } catch (error) {
    loginMessage.textContent =
      error.message || 'Could not connect. Please try again.';

    console.error('Login failed:', error);

  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in';

    resetCaptcha();
  }
});


// LOGOUT
document.getElementById('logoutButton').addEventListener(
  'click',
  async () => {
    const button =
      document.getElementById('logoutButton');

    button.disabled = true;

    const { error } =
      await supabaseClient.auth.signOut();

    button.disabled = false;

    if (error) {
      alert('Could not sign out. Please try again.');
      console.error(error);
    }
  }
);


// UPDATE SELECTED NAVIGATION LINK
document.querySelectorAll('aside nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('aside nav a').forEach((item) => {
      item.classList.remove('active');
    });

    link.classList.add('active');
  });
});


// LISTEN FOR LOGIN AND LOGOUT CHANGES
supabaseClient.auth.onAuthStateChange((event, session) => {
  setTimeout(() => {
    if (session?.user) {
      verifyAdminAccess(session);
    } else {
      showLogin();
    }
  }, 0);
});


// CHECK EXISTING LOGIN SESSION
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
