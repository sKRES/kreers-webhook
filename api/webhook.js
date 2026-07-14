export default async function handler(req, res) {
  // Разрешаем CORS для обоих сайтов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const body = req.body || {};
    
    // Защита от спама
    const honeypot = body.honeypot || body.website_url || '';
    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    // Определяем источник (сайт)
    const source = body.source || 'unknown';
    const siteName = {
      'kreers_psychology': '🧠 Психология (kreers.ru)',
      'electro_epilation': '⚡ Электроэпиляция',
      'tilda_form': 'Tilda (неизвестный сайт)'
    }[source] || `📩 ${source}`;

    let message = '';

    // Форма записи на консультацию (психология)
    if (body.name && body.phone && source === 'kreers_psychology') {
      message = `📅 *Новая запись: Психология*\n\n` +
                `👤 Имя: ${body.name}\n` +
                `📞 Телефон: ${body.phone}\n` +
                (body.comment ? `💬 Комментарий: ${body.comment}\n` : '') +
                `\n ${new Date().toLocaleString('ru-RU')}`;
    }
    
    // Анонимный вопрос (психология)
    else if (body.question && source === 'kreers_psychology') {
      message = ` *Анонимный вопрос: Психология*\n\n` +
                `${body.question}\n\n` +
                (body.email ? ` Контакт: ${body.email}` : ' Полностью анонимно');
    }
    
    // Форма записи на электроэпиляцию
    else if (body.name && body.phone && source === 'electro_epilation') {
      message = `💉 *Новая запись: Электроэпиляция*\n\n` +
                `👤 Имя: ${body.name}\n` +
                `📞 Телефон: ${body.phone}\n` +
                (body.zone ? `📍 Зона: ${body.zone}\n` : '') +
                (body.comment ? `💬 Комментарий: ${body.comment}\n` : '') +
                `\n⏰ ${new Date().toLocaleString('ru-RU')}`;
    }
    
    // Универсальная обработка
    else {
      message = `📨 *Новое сообщение: ${siteName}*\n\n` +
                JSON.stringify(body, null, 2);
    }

    // Отправка в Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) throw new Error('Telegram API error');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}
