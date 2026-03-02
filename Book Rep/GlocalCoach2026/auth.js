/* ============================================
   GlocalCoach 2026 — Authentication System
   (Firebase Auth + Firestore)
   ============================================ */

// ─── GET INITIALS ───
function getInitials(name) {
    if (!name) return '??';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ─── ROLE MESSAGES ───
var roleMessages = {
    coach: 'Ready to log your next session',
    admin: 'Organization management tools ready',
    athlete: 'Track your development journey'
};

var roleEmojis = {
    coach: '🏆',
    admin: '⚙️',
    athlete: '⚽'
};

// ─── AUTH PARTICLES ───
function createParticles() {
    var container = document.getElementById('authParticles');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < 30; i++) {
        var particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = (Math.random() * 6) + 's';
        particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
        var colors = ['rgba(45,212,191,0.3)', 'rgba(59,130,246,0.3)', 'rgba(232,121,249,0.3)', 'rgba(245,158,11,0.3)'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
}

// ─── PASSWORD STRENGTH ───
function checkPasswordStrength(password) {
    var score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 'weak', color: '#ef4444', width: '20%' };
    if (score <= 2) return { level: 'fair', color: '#f59e0b', width: '40%' };
    if (score <= 3) return { level: 'good', color: '#3b82f6', width: '65%' };
    if (score <= 4) return { level: 'strong', color: '#2dd4bf', width: '85%' };
    return { level: 'excellent', color: '#10b981', width: '100%' };
}

// ─── TOGGLE AUTH FORMS ───
function setAuthMode(mode) {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');
    var forgotForm = document.getElementById('forgotForm');
    var loginToggle = document.getElementById('loginToggle');
    var signupToggle = document.getElementById('signupToggle');
    var slider = document.getElementById('authSlider');
    var authToggle = document.querySelector('.auth-toggle');
    var authError = document.getElementById('authError');

    if (authError) { authError.textContent = ''; authError.classList.remove('show'); }

    // Hide all forms
    if (loginForm) loginForm.classList.remove('active');
    if (signupForm) signupForm.classList.remove('active');
    if (forgotForm) forgotForm.classList.remove('active');

    if (mode === 'signup') {
        signupForm.classList.add('active');
        loginToggle.classList.remove('active');
        signupToggle.classList.add('active');
        if (slider) slider.style.transform = 'translateX(100%)';
        if (authToggle) authToggle.style.display = 'flex';
    } else if (mode === 'forgot') {
        forgotForm.classList.add('active');
        if (authToggle) authToggle.style.display = 'none';
        showForgotStep(1);
    } else {
        loginForm.classList.add('active');
        signupToggle.classList.remove('active');
        loginToggle.classList.add('active');
        if (slider) slider.style.transform = 'translateX(0)';
        if (authToggle) authToggle.style.display = 'flex';
    }
}

// ─── FORGOT PASSWORD STEPS ───
function showForgotStep(step) {
    var steps = document.querySelectorAll('.forgot-step');
    for (var i = 0; i < steps.length; i++) {
        steps[i].classList.remove('active');
    }
    var target = document.getElementById('forgotStep' + step);
    if (target) target.classList.add('active');
}

// ─── SHOW AUTH ERROR ───
function showAuthError(msg) {
    var el = document.getElementById('authError');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 4000);
}

// ─── ENTER THE APP ───
function enterApp(userProfile, isNewLogin) {
    var overlay = document.getElementById('authOverlay');
    var wrapper = document.getElementById('appWrapper');
    var bottomNav = document.getElementById('bottomNav');

    // ★ Load this user's personal data from Firestore
    var firebaseUser = auth.currentUser;
    if (firebaseUser && typeof reloadUserData === 'function') {
        reloadUserData(firebaseUser.uid, userProfile.name);
    }

    // ★ Show/hide admin nav based on role
    if (typeof updateAdminVisibility === 'function') {
        updateAdminVisibility(userProfile.role);
    }

    // Update header
    var initials = getInitials(userProfile.name);
    var avatarEl = document.getElementById('avatarInitials');
    if (avatarEl) avatarEl.textContent = initials;

    var roleBadge = document.getElementById('headerRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
        roleBadge.className = 'header-role-badge role-' + userProfile.role;
    }

    // Update dropdown
    var ddAvatar = document.getElementById('dropdownAvatar');
    if (ddAvatar) ddAvatar.textContent = initials;
    var ddName = document.getElementById('dropdownName');
    if (ddName) ddName.textContent = userProfile.name;
    var ddEmail = document.getElementById('dropdownEmail');
    if (ddEmail) ddEmail.textContent = userProfile.email;
    var ddRole = document.getElementById('dropdownRole');
    if (ddRole) {
        ddRole.textContent = (roleEmojis[userProfile.role] || '') + ' ' + userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
    }

    // Animate out
    if (overlay) overlay.classList.add('hiding');
    setTimeout(function () {
        if (overlay) overlay.style.display = 'none';
        if (wrapper) wrapper.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'flex';

        if (wrapper) {
            wrapper.classList.add('app-entering');
            setTimeout(function () {
                wrapper.classList.remove('app-entering');
            }, 600);
        }

        if (isNewLogin) {
            showWelcomeBanner(userProfile);
        }
    }, 500);
}

// ─── WELCOME BANNER ───
function showWelcomeBanner(user) {
    var banner = document.getElementById('welcomeBanner');
    var welcomeName = document.getElementById('welcomeName');
    var welcomeRole = document.getElementById('welcomeRole');

    if (!banner) return;

    var firstName = user.name.split(' ')[0];
    if (welcomeName) welcomeName.textContent = 'Welcome, ' + firstName + '!';
    if (welcomeRole) {
        var roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        welcomeRole.textContent = roleLabel + ' • ' + (roleMessages[user.role] || 'Ready to go');
    }

    banner.style.display = 'flex';
    banner.classList.add('show');

    setTimeout(function () {
        banner.classList.remove('show');
        setTimeout(function () { banner.style.display = 'none'; }, 400);
    }, 5000);
}

// ─── INIT AUTH ───
document.addEventListener('DOMContentLoaded', function () {
    createParticles();

    // Hide bottom nav initially
    var bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'none';

    // ★★★ FIREBASE AUTH STATE LISTENER ★★★
    auth.onAuthStateChanged(function (firebaseUser) {
        if (firebaseUser) {
            // User is logged in — load their profile from Firestore
            db.collection('users').doc(firebaseUser.uid).get().then(function (doc) {
                if (doc.exists) {
                    var profile = doc.data();
                    enterApp({
                        name: profile.name || '',
                        email: profile.email || firebaseUser.email,
                        role: profile.role || 'coach'
                    }, false);
                } else {
                    // Profile doesn't exist yet — unusual, sign out
                    auth.signOut();
                }
            }).catch(function (err) {
                console.error('Error loading profile:', err);
                auth.signOut();
            });
        } else {
            // Not logged in — show auth screen
            var overlay = document.getElementById('authOverlay');
            var wrapper = document.getElementById('appWrapper');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.classList.remove('hiding');
            }
            if (wrapper) wrapper.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
        }
    });

    // Toggle buttons
    var loginToggle = document.getElementById('loginToggle');
    var signupToggle = document.getElementById('signupToggle');
    var goToSignup = document.getElementById('goToSignup');
    var goToLogin = document.getElementById('goToLogin');

    if (loginToggle) loginToggle.addEventListener('click', function () { setAuthMode('login'); });
    if (signupToggle) signupToggle.addEventListener('click', function () { setAuthMode('signup'); });
    if (goToSignup) goToSignup.addEventListener('click', function (e) { e.preventDefault(); setAuthMode('signup'); });
    if (goToLogin) goToLogin.addEventListener('click', function (e) { e.preventDefault(); setAuthMode('login'); });

    // Password toggle (eye)
    setupPasswordToggle('loginEye', 'loginPassword');
    setupPasswordToggle('signupEye', 'signupPassword');
    setupPasswordToggle('resetEye', 'resetPassword');

    // ─── FORGOT PASSWORD FLOW ───
    var forgotLink = document.getElementById('forgotLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', function (e) {
            e.preventDefault();
            setAuthMode('forgot');
        });
    }

    var forgotBackToLogin = document.getElementById('forgotBackToLogin');
    if (forgotBackToLogin) {
        forgotBackToLogin.addEventListener('click', function (e) {
            e.preventDefault();
            setAuthMode('login');
        });
    }

    var resetBackToLogin = document.getElementById('resetBackToLogin');
    if (resetBackToLogin) {
        resetBackToLogin.addEventListener('click', function (e) {
            e.preventDefault();
            setAuthMode('login');
        });
    }

    var resetGoLogin = document.getElementById('resetGoLogin');
    if (resetGoLogin) {
        resetGoLogin.addEventListener('click', function () {
            setAuthMode('login');
        });
    }

    // ★ Forgot Password: Send reset email via Firebase
    var forgotVerifyBtn = document.getElementById('forgotVerifyBtn');
    if (forgotVerifyBtn) {
        forgotVerifyBtn.addEventListener('click', function () {
            var emailInput = document.getElementById('forgotEmail');
            var email = emailInput ? emailInput.value.trim().toLowerCase() : '';

            if (!email) {
                showAuthError('Please enter your email address');
                return;
            }

            // Show loading
            forgotVerifyBtn.classList.add('loading');
            forgotVerifyBtn.querySelector('span').textContent = 'Sending...';

            auth.sendPasswordResetEmail(email).then(function () {
                forgotVerifyBtn.classList.remove('loading');
                forgotVerifyBtn.querySelector('span').textContent = 'Send Reset Link';
                showForgotStep(3); // Show success step
            }).catch(function (error) {
                forgotVerifyBtn.classList.remove('loading');
                forgotVerifyBtn.querySelector('span').textContent = 'Send Reset Link';
                if (error.code === 'auth/user-not-found') {
                    showAuthError('No account found with this email');
                } else if (error.code === 'auth/invalid-email') {
                    showAuthError('Please enter a valid email address');
                } else {
                    showAuthError(error.message || 'Failed to send reset email');
                }
            });
        });
    }

    // Password strength meter
    var signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', function () {
            var strength = checkPasswordStrength(signupPassword.value);
            var fill = document.getElementById('strengthFill');
            var text = document.getElementById('strengthText');
            if (fill) {
                fill.style.width = strength.width;
                fill.style.background = strength.color;
            }
            if (text) {
                text.textContent = signupPassword.value.length > 0 ? strength.level : '';
                text.style.color = strength.color;
            }
        });
    }

    // Role selector
    var roleCards = document.querySelectorAll('.role-card');
    for (var i = 0; i < roleCards.length; i++) {
        (function (card) {
            card.addEventListener('click', function () {
                for (var j = 0; j < roleCards.length; j++) roleCards[j].classList.remove('active');
                card.classList.add('active');
            });
        })(roleCards[i]);
    }

    // ─── SIGNUP SUBMIT (Firebase Auth + Firestore) ───
    var signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('signupName').value.trim();
            var email = document.getElementById('signupEmail').value.trim().toLowerCase();
            var password = document.getElementById('signupPassword').value;
            var activeRole = document.querySelector('.role-card.active');
            var role = activeRole ? activeRole.getAttribute('data-role') : 'coach';

            if (!name || !email || !password) {
                showAuthError('Please fill in all fields');
                return;
            }
            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters');
                return;
            }

            // Show loading
            var submitBtn = document.getElementById('signupSubmit');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.querySelector('span').textContent = 'Creating account...';
            }

            // ★ Create user with Firebase Auth
            auth.createUserWithEmailAndPassword(email, password).then(function (credential) {
                var uid = credential.user.uid;

                // ★ Store user profile + default data in Firestore
                return db.collection('users').doc(uid).set({
                    name: name,
                    email: email,
                    role: role,
                    createdAt: new Date().toISOString(),
                    coachName: name,
                    coachCity: 'Toronto',
                    sessions: [],
                    totalHours: 0
                });
            }).then(function () {
                // Auth state change will handle enterApp
                // But we want to show welcome for new signups
                setTimeout(function () {
                    showWelcomeBanner({ name: name, email: email, role: role });
                }, 1200);
            }).catch(function (error) {
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.querySelector('span').textContent = 'Create Account';
                }
                if (error.code === 'auth/email-already-in-use') {
                    showAuthError('An account with this email already exists');
                } else if (error.code === 'auth/weak-password') {
                    showAuthError('Password is too weak — use at least 6 characters');
                } else if (error.code === 'auth/invalid-email') {
                    showAuthError('Please enter a valid email address');
                } else {
                    showAuthError(error.message || 'Signup failed');
                }
            });
        });
    }

    // ─── LOGIN SUBMIT (Firebase Auth) ───
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var email = document.getElementById('loginEmail').value.trim().toLowerCase();
            var password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showAuthError('Please fill in all fields');
                return;
            }

            var submitBtn = document.getElementById('loginSubmit');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.querySelector('span').textContent = 'Logging in...';
            }

            // ★ Sign in with Firebase Auth
            auth.signInWithEmailAndPassword(email, password).then(function () {
                // Auth state change will handle enterApp
            }).catch(function (error) {
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.querySelector('span').textContent = 'Log In';
                }
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    showAuthError('Invalid email or password');
                } else if (error.code === 'auth/too-many-requests') {
                    showAuthError('Too many attempts. Please try again later');
                } else {
                    showAuthError(error.message || 'Login failed');
                }
            });
        });
    }

    // ─── PROFILE DROPDOWN ───
    var profileBtn = document.getElementById('profileBtn');
    var profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });
        document.addEventListener('click', function (e) {
            if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
                profileDropdown.classList.remove('open');
            }
        });
    }

    // ─── LOGOUT (Firebase Auth) ───
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            auth.signOut().then(function () {
                // Auth state change will handle hiding the app
                location.reload();
            });
        });
    }

    // ─── WELCOME CLOSE ───
    var welcomeClose = document.getElementById('welcomeClose');
    if (welcomeClose) {
        welcomeClose.addEventListener('click', function () {
            var banner = document.getElementById('welcomeBanner');
            if (banner) {
                banner.classList.remove('show');
                setTimeout(function () { banner.style.display = 'none'; }, 400);
            }
        });
    }
});

// ─── PASSWORD TOGGLE HELPER ───
function setupPasswordToggle(eyeId, inputId) {
    var eyeBtn = document.getElementById(eyeId);
    var input = document.getElementById(inputId);
    if (eyeBtn && input) {
        eyeBtn.addEventListener('click', function () {
            if (input.type === 'password') {
                input.type = 'text';
                eyeBtn.classList.add('visible');
            } else {
                input.type = 'password';
                eyeBtn.classList.remove('visible');
            }
        });
    }
}
