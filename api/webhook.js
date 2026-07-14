export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  res.setHeader('Access-Control-Allow-Origin', 'https://kreers.ru');
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
    
    // Защита от спам-ботов
    const honeypot = body.honeypot || body.website_url || '';
    if (honeypot) {
      console.log('Spam detected');
      return res.status(200).json({ success: true, message: 'Спасибо!' });
    }

    // Определяем тип формы по наличию полей
    const isConsultation = body.name && body.phone;
    const isAnonymousQuestion = body.question;

    let message = '';

    if (isConsultation) {
      // Форма записи на консультацию
      message = `📅 *Новая запись на консультацию*\n\n` +
                `👤 Имя: ${body.name}\n` +
                `📞 Телефон: ${body.phone}\n` +
                (body.comment ? `💬 Комментарий: ${body.comment}\n` : '') +
                `\n⏰ ${new Date().toLocaleString('ru-RU')}`;
    } else if (isAnonymousQuestion) {
      // Анонимный вопрос
      message = `🔔 *Новый анонимный вопрос*\n\n` +
                `${body.question}\n\n` +
                (body.email ? ` Контакт: ${body.email}` : ' Полностью анонимно');
    } else {
      // Универсальная обработка (если поля называются иначе)
      message = `📨 *Новое сообщение*\n\n` +
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

    return res.status(200).json({ success: true, message: 'Данные успешно отправлены' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}
