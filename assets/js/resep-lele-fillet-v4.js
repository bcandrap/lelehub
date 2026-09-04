(function(){
  'use strict';

  // =============================
  // Recipe carousel
  // =============================
  const carousel = document.getElementById('recipeCarousel');
  const slides = carousel ? Array.from(carousel.querySelectorAll('.recipe-slide')) : [];
  const dotsWrap = document.getElementById('recipeDots');
  const prevBtn = document.getElementById('recipePrev');
  const nextBtn = document.getElementById('recipeNext');
  let currentIndex = 0;

  function renderDots(){
    if (!dotsWrap || !slides.length) return;
    dotsWrap.innerHTML = '';
    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'recipe-dot' + (index === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Lihat resep ke-' + (index + 1));
      dot.addEventListener('click', () => goToSlide(index));
      dotsWrap.appendChild(dot);
    });
  }

  function updateActiveState(index){
    currentIndex = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    if (!dotsWrap) return;
    Array.from(dotsWrap.children).forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function goToSlide(index){
    if (!carousel || !slides.length) return;
    const bounded = Math.max(0, Math.min(index, slides.length - 1));
    const target = slides[bounded];
    carousel.scrollTo({ left: target.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
    updateActiveState(bounded);
  }

  function syncSlideFromScroll(){
    if (!carousel || !slides.length) return;
    const scrollLeft = carousel.scrollLeft;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - scrollLeft - carousel.offsetLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    updateActiveState(nearestIndex);
  }

  if (carousel && slides.length) {
    renderDots();
    carousel.addEventListener('scroll', () => window.requestAnimationFrame(syncSlideFromScroll));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    document.addEventListener('keydown', (event) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (event.key === 'ArrowLeft') goToSlide(currentIndex - 1);
      if (event.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });
  }

  // =====================================================
  // SURVEY BACKEND VIA NETLIFY FUNCTION (same-origin)
  // Browser only connects to this site's own domain, so
  // CSP "connect-src 'self'" is sufficient.
  // Netlify Function forwards the data server-side to Google Form.
  // =====================================================
  const SURVEY_ENDPOINT = '/.netlify/functions/survey';

  const surveyForm = document.getElementById('surveyForm');
  const surveyStatus = document.getElementById('surveyStatus');
  const ratingText = document.getElementById('ratingText');
  const ratingInputs = Array.from(document.querySelectorAll('input[name="rating"]'));
  const emailInput = document.getElementById('surveyEmail');
  const phoneInput = document.getElementById('surveyPhone');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');

  const ratingMessages = {
    '1': '1 bintang — masih banyak yang perlu ditingkatkan.',
    '2': '2 bintang — cukup, tetapi belum sesuai harapan.',
    '3': '3 bintang — lumayan dan masih bisa ditingkatkan.',
    '4': '4 bintang — bagus dan cukup memuaskan.',
    '5': '5 bintang — sangat suka dan sangat memuaskan.'
  };

  ratingInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (ratingText) ratingText.textContent = ratingMessages[input.value] || 'Pilih penilaian Anda dari 1 sampai 5 bintang.';
    });
  });

  function getFormValues(){
    if (!surveyForm) return null;
    const formData = new FormData(surveyForm);
    return {
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      rating: String(formData.get('rating') || '').trim(),
      comment: String(formData.get('comment') || '').trim(),
      wish: String(formData.get('wish') || '').trim(),
      website: String(formData.get('website') || '').trim()
    };
  }

  function isValidEmail(value){
    const email = String(value || '').trim();
    if (!email || email.length > 254) return false;
    return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(email);
  }

  function cleanPhone(value){
    return String(value || '').trim().replace(/[\s().-]/g, '');
  }

  function isValidIndonesianMobile(value){
    return /^(?:\+62|62|0)8[1-9][0-9]{7,10}$/.test(cleanPhone(value));
  }

  function normalizeIndonesianMobile(value){
    let phone = cleanPhone(value);
    if (phone.startsWith('+62')) return phone;
    if (phone.startsWith('62')) return '+' + phone;
    if (phone.startsWith('0')) return '+62' + phone.slice(1);
    return phone;
  }

  function setFieldState(input, errorElement, message){
    if (!input || !errorElement) return;
    const hasValue = String(input.value || '').trim().length > 0;
    input.classList.toggle('is-invalid', Boolean(message));
    input.classList.toggle('is-valid', !message && hasValue);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorElement.textContent = message || '';
    errorElement.classList.toggle('show', Boolean(message));
  }

  function validateEmailField(showEmptyError){
    if (!emailInput) return '';
    const value = emailInput.value.trim();
    let message = '';
    if (!value && showEmptyError) message = 'Email wajib diisi.';
    else if (value && !isValidEmail(value)) message = 'Format email belum valid. Contoh: nama@email.com';
    setFieldState(emailInput, emailError, message);
    return message;
  }

  function validatePhoneField(showEmptyError){
    if (!phoneInput) return '';
    const value = phoneInput.value.trim();
    let message = '';
    if (!value && showEmptyError) message = 'Nomor HP wajib diisi.';
    else if (value && !isValidIndonesianMobile(value)) message = 'Nomor HP belum valid. Gunakan format 08…, 628…, atau +628…';
    setFieldState(phoneInput, phoneError, message);
    return message;
  }

  function validateSurvey(values){
    const emailMessage = validateEmailField(true);
    if (emailMessage) return emailMessage;
    const phoneMessage = validatePhoneField(true);
    if (phoneMessage) return phoneMessage;
    if (!values.rating || !['1','2','3','4','5'].includes(values.rating)) return 'Silakan pilih rating bintang 1–5.';
    if (!values.comment) return 'Comment wajib diisi.';
    if (!values.wish) return 'Wish wajib diisi.';
    return '';
  }

  async function submitSurvey(values){
    const response = await fetch(SURVEY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: values.email,
        phone: normalizeIndonesianMobile(values.phone),
        rating: values.rating,
        comment: values.comment,
        wish: values.wish,
        website: values.website
      })
    });

    let result = null;
    try { result = await response.json(); } catch (_) { /* ignore */ }
    if (!response.ok || !result || result.success !== true) {
      const message = result && result.message ? result.message : 'Server survey belum dapat menerima data.';
      throw new Error(message);
    }
    return result;
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => validateEmailField(true));
    emailInput.addEventListener('input', () => validateEmailField(false));
  }

  if (phoneInput) {
    phoneInput.addEventListener('blur', () => validatePhoneField(true));
    phoneInput.addEventListener('input', () => validatePhoneField(false));
  }

  if (surveyForm) {
    surveyForm.addEventListener('reset', () => {
      if (ratingText) ratingText.textContent = 'Pilih penilaian Anda dari 1 sampai 5 bintang.';
      if (surveyStatus) surveyStatus.textContent = '';
      window.setTimeout(() => {
        setFieldState(emailInput, emailError, '');
        setFieldState(phoneInput, phoneError, '');
      }, 0);
    });

    surveyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = getFormValues();
      if (!values) return;

      // Honeypot: bots often fill this hidden field. Pretend success without submitting.
      if (values.website) {
        surveyForm.reset();
        if (surveyStatus) {
          surveyStatus.textContent = 'Terima kasih. Masukan Anda telah dikirim.';
          surveyStatus.style.color = '#046957';
        }
        return;
      }

      const validationMessage = validateSurvey(values);
      if (validationMessage) {
        if (surveyStatus) {
          surveyStatus.textContent = validationMessage;
          surveyStatus.style.color = '#b42318';
        }
        if (emailInput && emailInput.getAttribute('aria-invalid') === 'true') emailInput.focus();
        else if (phoneInput && phoneInput.getAttribute('aria-invalid') === 'true') phoneInput.focus();
        return;
      }

      const submitButton = surveyForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Mengirim...';
      }

      try {
        if (surveyStatus) {
          surveyStatus.textContent = 'Mengirim survey Anda...';
          surveyStatus.style.color = '#046957';
        }

        await submitSurvey(values);
        surveyForm.reset();
        if (surveyStatus) {
          surveyStatus.textContent = 'Terima kasih. Masukan Anda telah berhasil disimpan.';
          surveyStatus.style.color = '#046957';
        }
      } catch (error) {
        if (surveyStatus) {
          surveyStatus.textContent = 'Survey belum berhasil dikirim. Silakan coba kembali beberapa saat lagi.';
          surveyStatus.style.color = '#b42318';
        }
        console.error('Survey submit error:', error);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || 'Kirim Survey';
        }
      }
    });
  }
})();
