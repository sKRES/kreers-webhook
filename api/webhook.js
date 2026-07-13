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
    const { source, question, contact_optional, honeypot } = req.body;

    // Защита от спам-ботов
    if (honeypot) {
      return res.status(200).json({ success: true, message: 'Спасибо!' });
    }

    // Валидация
    if (!question || question.length < 10 || question.length > 2000) {
      return res.status(400).json({ error: 'Вопрос должен быть от 10 до 2000 символов' });
    }

    // Формирование сообщения
    const message = ` *Новый вопрос (${source})*\n\n${question}\n\n${
      contact_optional ? `📧 Контакт: ${contact_optional}` : '🔒 Полностью анонимно'
    }`;

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

    return res.status(200).json({ success: true, message: 'Вопрос успешно отправлен' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}
