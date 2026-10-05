(() => {
  const phone = '+79057925010';
  let dialog;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'messenger-dialog';
    dialog.className = 'messenger-dialog';
    dialog.setAttribute('aria-labelledby', 'messenger-dialog-title');
    dialog.innerHTML = '<button class="messenger-close" type="button" aria-label="Закрыть">×</button><p class="eyebrow">НА СВЯЗИ</p><h2 id="messenger-dialog-title">Куда написать Елене?</h2><p class="messenger-dialog-copy">Выберите удобный мессенджер. В MAX найдите Елену по номеру телефона.</p><div class="messenger-options"><a class="button button-primary" data-telegram-link href="https://t.me/elenabelova77" target="_blank" rel="noreferrer">Открыть Telegram ↗</a><div class="messenger-max"><strong>MAX</strong><span data-contact-phone>+7 905 792-50-10</span><button type="button" class="text-link" data-copy-phone>Скопировать номер</button><a class="button button-outline" href="https://max.ru/" target="_blank" rel="noreferrer">Открыть MAX ↗</a></div></div><p class="messenger-copy-status" data-copy-status aria-live="polite"></p><div class="messenger-message-tools" hidden><p>Для MAX можно скопировать текст обращения:</p><button type="button" class="button button-outline" data-copy-message>Скопировать сообщение</button></div>';
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('.messenger-close')) dialog.close();
      if (event.target.closest('a')) dialog.close();
      if (event.target.closest('[data-copy-phone]')) copy(phone, 'Номер телефона');
      if (event.target.closest('[data-copy-message]')) copy(dialog.dataset.message || '', 'Текст обращения');
    });
    dialog.addEventListener('close', () => { dialog.dataset.message = ''; });
    document.body.append(dialog);
    return dialog;
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      const status = dialog.querySelector('[data-copy-status]');
      if (status) status.textContent = `${label} скопирован.`;
    } catch {
      window.prompt(`Скопируйте ${label.toLowerCase()}:`, text);
    }
  }

  function openChooser(message = '') {
    const modal = ensureDialog();
    const telegramLink = modal.querySelector('[data-telegram-link]');
    telegramLink.href = `https://t.me/elenabelova77${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    modal.dataset.message = message;
    modal.querySelector('.messenger-message-tools').hidden = !message;
    if (!modal.open) modal.showModal();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-messenger-chooser], a[href^="https://t.me/"]');
    if (!link || link.closest('#messenger-dialog')) return;
    event.preventDefault();
    openChooser(link.dataset.message || '');
  });
  document.querySelectorAll('a[href^="https://t.me/"]').forEach((link) => {
    link.setAttribute('title', 'Выбрать мессенджер для связи с Еленой');
    link.setAttribute('aria-label', 'Связаться с Еленой в Telegram или MAX');
  });
  window.addEventListener('massagefamily:contact', (event) => openChooser(event.detail?.message || ''));
  window.massagefamilyMessengerReady = true;
})();
