// ===== ZYA LAW FIRM - MAIN JAVASCRIPT =====
// Frontend interactivity + API integration

const API_BASE_URL = window.location.protocol === 'file:' || window.location.port === '5500'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`;

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ===== MOBILE MENU TOGGLE =====
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== SCROLL ANIMATIONS (Intersection Observer) =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    fadeObserver.observe(el);
});

// ===== ACTIVE NAV LINK HIGHLIGHTING =====
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

setActiveNavLink();

// ===== CONTACT FORM SUBMISSION (BACKEND INTEGRATED) =====
const consultationForm = document.getElementById('consultationForm');
if (consultationForm) {
    consultationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(consultationForm);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = consultationForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                consultationForm.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="width: 80px; height: 80px; background: rgba(201, 162, 39, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                            <i class="fas fa-check" style="font-size: 36px; color: var(--accent);"></i>
                        </div>
                        <h3 style="font-size: 24px; color: var(--primary); margin-bottom: 12px;">Thank You!</h3>
                        <p style="color: var(--text-medium); font-size: 16px; line-height: 1.7;">${result.message}</p>
                        <div style="margin-top: 24px; padding: 16px; background: var(--bg-light); border-radius: 12px;">
                            <p style="font-size: 14px; color: var(--text-medium); margin: 0;"><i class="fas fa-shield-alt" style="color: var(--accent); margin-right: 8px;"></i><strong>Emergency?</strong> If you're facing deportation or detention, call us immediately at <strong>+1 (226) 505-2867</strong>.</p>
                        </div>
                    </div>
                `;
            } else {
                throw new Error(result.message || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Error: ' + error.message + '\n\nPlease try again or call us directly.');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c ZYA Law Firm ', 'background: #1a365d; color: #c9a227; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');
console.log('%c Canadian Immigration Law | Aderibigbe Zainab Yetunde ', 'color: #1a365d; font-size: 14px; font-weight: 600;');
console.log('%c Frontend loaded successfully. Backend API ready. ', 'color: #718096; font-size: 12px;');
