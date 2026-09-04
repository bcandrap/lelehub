const GOOGLE_FORM_ID = '1FAIpQLSdzVs52Ge2peu64C2nOZEB1_h7XMYl77seB5y0Fk45Xm-Lv-A';

const FIELDS = {
  email: 'entry.2105015209',
  phone: 'entry.211829700',
  rating: 'entry.1915206390',
  comment: 'entry.564337398',
  wish: 'entry.1498932458'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function isValidEmail(value) {
  const email = String(value || '').trim();
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(value) {
  const phone = String(value || '').trim().replace(/[\s().-]/g, '');
  return /^\+628[1-9][0-9]{7,10}$/.test(phone);
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed.' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (_) {
    return json(400, { success: false, message: 'Request tidak valid.' });
  }

  // Honeypot anti-spam.
  if (String(data.website || '').trim()) {
    return json(200, { success: true });
  }

  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const rating = String(data.rating || '').trim();
  const comment = String(data.comment || '').trim();
  const wish = String(data.wish || '').trim();

  if (!isValidEmail(email)) return json(400, { success: false, message: 'Email tidak valid.' });
  if (!isValidPhone(phone)) return json(400, { success: false, message: 'Nomor HP tidak valid.' });
  if (!['1','2','3','4','5'].includes(rating)) return json(400, { success: false, message: 'Rating tidak valid.' });
  if (!comment || comment.length > 4000) return json(400, { success: false, message: 'Comment tidak valid.' });
  if (!wish || wish.length > 4000) return json(400, { success: false, message: 'Wish tidak valid.' });

  const body = new URLSearchParams();
  body.set(FIELDS.email, email);
  body.set(FIELDS.phone, phone);
  body.set(FIELDS.rating, rating);
  body.set(FIELDS.comment, comment);
  body.set(FIELDS.wish, wish);

  const endpoint = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'LeleHub-Survey/1.0'
      },
      body: body.toString(),
      redirect: 'follow'
    });

    // Google Forms commonly returns 200 after redirects. Any 2xx/3xx means submission accepted/redirected.
    if (!(response.ok || (response.status >= 300 && response.status < 400))) {
      console.error('Google Form response:', response.status, await response.text());
      return json(502, { success: false, message: 'Google Form menolak pengiriman.' });
    }

    return json(200, { success: true, message: 'Survey tersimpan.' });
  } catch (error) {
    console.error('Survey proxy error:', error);
    return json(502, { success: false, message: 'Tidak dapat terhubung ke Google Form.' });
  }
};
