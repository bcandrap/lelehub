(function(){
  'use strict';

  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  function closeMenu(){
    if (!navMenu || !menuToggle) return;
    navMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (event) => {
      if (!navMenu.classList.contains('open')) return;
      if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
  }

  // Smooth anchor navigation with sticky-header offset. Keeps menu links, Mitra, Kemitraan, and Kontak working consistently.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      const header = document.querySelector('.header');
      const offset = header ? header.offsetHeight + 12 : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', targetId);
      closeMenu();
    });
  });

  // Active menu state.
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === id));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
    sections.forEach(section => observer.observe(section));
  }

  const gallery = document.getElementById('galleryRow');
  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!gallery) return;
      const direction = btn.getAttribute('data-scroll') === 'right' ? 1 : -1;
      gallery.scrollBy({left: direction * 260, behavior: 'smooth'});
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.querySelector('.lightbox-close');
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      if (!lightbox || !lightboxImg) return;
      const src = item.getAttribute('data-img');
      const img = item.querySelector('img');
      lightboxImg.src = src;
      lightboxImg.alt = img ? img.alt : 'Preview galeri farm';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });
  function closeLightbox(){
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  // Partner form: local, safe, no third-party script. Opens official WhatsApp with prepared message.
  const partnerForm = document.getElementById('partnerForm');
  const partnerEmailLink = document.getElementById('partnerEmailLink');
  const formStatus = document.getElementById('formStatus');
  const officialWa = '6281234567890';
  const officialEmail = 'admin@iwakgroup.com';

  function readPartnerForm(){
    if (!partnerForm) return null;
    const data = new FormData(partnerForm);
    return {
      nama: String(data.get('nama') || '').trim(),
      wa: String(data.get('wa') || '').trim(),
      lokasi: String(data.get('lokasi') || '').trim(),
      minat: String(data.get('minat') || '').trim(),
      pesan: String(data.get('pesan') || '').trim()
    };
  }

  function buildMessage(values){
    return [
      'Halo LeleHub Farm, saya ingin mendaftar minat kemitraan.',
      '',
      'Nama: ' + values.nama,
      'Nomor WA: ' + values.wa,
      'Lokasi: ' + values.lokasi,
      'Minat: ' + values.minat,
      'Catatan: ' + (values.pesan || '-')
    ].join('\n');
  }

  function updateEmailLink(){
    if (!partnerEmailLink || !partnerForm) return;
    const values = readPartnerForm();
    if (!values) return;
    const subject = encodeURIComponent('Minat Kemitraan LeleHub Farm - ' + (values.nama || 'Calon Mitra'));
    const body = encodeURIComponent(buildMessage({
      nama: values.nama || '-',
      wa: values.wa || '-',
      lokasi: values.lokasi || '-',
      minat: values.minat || '-',
      pesan: values.pesan || '-'
    }));
    partnerEmailLink.href = 'mailto:' + officialEmail + '?subject=' + subject + '&body=' + body;
  }

  if (partnerForm) {
    partnerForm.addEventListener('input', updateEmailLink);
    partnerForm.addEventListener('change', updateEmailLink);
    partnerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = readPartnerForm();
      if (!values) return;
      if (!values.nama || !values.wa || !values.lokasi || !values.minat) {
        if (formStatus) formStatus.textContent = 'Mohon lengkapi nama, WhatsApp, lokasi, dan minat kemitraan.';
        return;
      }
      const url = 'https://wa.me/' + officialWa + '?text=' + encodeURIComponent(buildMessage(values));
      if (formStatus) formStatus.textContent = 'Pesan kemitraan disiapkan. WhatsApp akan terbuka di tab baru.';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    updateEmailLink();
  }
})();
