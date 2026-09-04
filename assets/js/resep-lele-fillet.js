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
  // GOOGLE FORM BACKEND
  // =====================================================
  // Customer tetap mengisi form LeleHUB di halaman ini.
  // JavaScript mengirim nilai secara diam-diam ke Google Form,
  // lalu Google Form menyimpan respons ke Google Spreadsheet.
  //
  // Setelah Google Form selesai dibuat, isi 6 nilai di bawah ini.
  // Contoh FORM_ID: 1FAIpQLScxxxxxxxxxxxxxxxxxxxxxxxx
  // Contoh ENTRY: entry.123456789
  const GOOGLE_FORM = {
    formId: '1FAIpQLSdzVs52Ge2peu64C2nOZEB1_h7XMYl77seB5y0Fk45Xm-Lv-A',
    fields: {
      email:   'entry.2105015209',
      phone:   'entry.211829700',
      rating:  'entry.1915206390',
      comment: 'entry.564337398',
      wish:    'entry.1498932458'
    }
  };

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
      wish: String(formData.get('wish') || '').trim()
    };
  }

  function isValidEmail(value){
    const email = String(value || '').trim();
    if (!email || email.length > 254) return false;
    // Cukup ketat untuk form konsumen, tanpa menolak alamat email valid yang umum.
    return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(email);
  }

  function cleanPhone(value){
    return String(value || '')
      .trim()
      .replace(/[\s().-]/g, '');
  }

  function isValidIndonesianMobile(value){
    const phone = cleanPhone(value);
    // Menerima: 08xxxxxxxx, 628xxxxxxxx, +628xxxxxxxx.
    // Panjang nomor nasional setelah awalan 0: 10–13 digit.
    return /^(?:\+62|62|0)8[1-9][0-9]{7,10}$/.test(phone);
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
    if (!values.rating) return 'Silakan pilih rating bintang 1–5.';
    if (!values.comment) return 'Comment wajib diisi.';
    if (!values.wish) return 'Wish wajib diisi.';
    return '';
  }

  function googleFormConfigured(){
    const values = [
      GOOGLE_FORM.formId,
      GOOGLE_FORM.fields.email,
      GOOGLE_FORM.fields.phone,
      GOOGLE_FORM.fields.rating,
      GOOGLE_FORM.fields.comment,
      GOOGLE_FORM.fields.wish
    ];
    return values.every(value => value && !value.includes('PASTE_'));
  }

  function appendHiddenField(form, name, value){
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  function submitToGoogleForm(values){
    const endpoint = 'https://docs.google.com/forms/d/e/' + GOOGLE_FORM.formId + '/formResponse';
    const targetName = 'lelehubSurveySubmitWindow';

    // Native form POST: avoids fetch/XHR and therefore avoids connect-src CSP.
    const submitWindow = window.open('about:blank', targetName, 'popup=yes,width=420,height=520,left=20,top=20');
    if (!submitWindow) {
      throw new Error('POPUP_BLOCKED');
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;
    form.target = targetName;
    form.style.display = 'none';
    form.acceptCharset = 'UTF-8';

    appendHiddenField(form, GOOGLE_FORM.fields.email, values.email);
    appendHiddenField(form, GOOGLE_FORM.fields.phone, normalizeIndonesianMobile(values.phone));
    appendHiddenField(form, GOOGLE_FORM.fields.rating, values.rating);
    appendHiddenField(form, GOOGLE_FORM.fields.comment, values.comment);
    appendHiddenField(form, GOOGLE_FORM.fields.wish, values.wish);

    document.body.appendChild(form);
    form.submit();
    form.remove();

    window.setTimeout(() => {
      try { submitWindow.close(); } catch (error) { /* ignore */ }
    }, 2800);
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

      if (!googleFormConfigured()) {
        if (surveyStatus) {
          surveyStatus.textContent = 'Koneksi Google Form belum dikonfigurasi. Masukkan Form ID dan entry ID pada file assets/js/resep-lele-fillet.js.';
          surveyStatus.style.color = '#b45309';
        }
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

        submitToGoogleForm(values);
        surveyForm.reset();

        if (surveyStatus) {
          surveyStatus.textContent = 'Terima kasih. Masukan Anda telah dikirim.';
          surveyStatus.style.color = '#046957';
        }
      } catch (error) {
        if (surveyStatus) {
          surveyStatus.textContent = error && error.message === 'POPUP_BLOCKED' ? 'Browser memblokir jendela pengiriman. Izinkan pop-up untuk halaman ini lalu tekan Kirim Survey kembali.' : 'Survey belum berhasil dikirim. Silakan coba kembali.';
          surveyStatus.style.color = '#b42318';
        }
        console.error('Google Form submit error:', error);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || 'Kirim Survey';
        }
      }
    });
  }
})();
