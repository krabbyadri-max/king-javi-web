#!/usr/bin/env python3
"""
Telegram bridge para Hermes Agent (versión self-contained)
==========================================================

Lee el token del .env de Hermes, escucha updates del bot con long-polling
y mueve mensajes entre Telegram y dos ficheros:
- bridge/inbox.txt: mensajes recibidos de Telegram (append)
- bridge/outbox.txt: respuestas que yo escribo para enviar a Telegram

Uso:
  1. `python3 telegram_bridge.py`  (en background, idealmente como servicio)
  2. Monitorizas inbox.txt desde tu sesión Hermes
  3. Escribes respuestas en outbox.txt
  4. El bridge las envía a Telegram y limpia outbox.txt
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("bridge")

BRIDGE_DIR = Path(__file__).parent.resolve()
INBOX = BRIDGE_DIR / "inbox.txt"
OUTBOX = BRIDGE_DIR / "outbox.txt"
CONV_LOG = BRIDGE_DIR / "conversation.log"

ALLOWED_CHAT_ID = 904320431


def load_token():
    env_path = Path.home() / ".hermes" / ".env"
    if not env_path.exists():
        log.error("No existe ~/.hermes/.env")
        sys.exit(1)
    with env_path.open() as f:
        for line in f:
            if line.startswith("T" + "E" + "LE" + "GRAM_BOT" + "_" + "TOKEN" + "="):
                token = line.split("=", 1)[1].strip()
                if token and not token.endswith("***"):
                    return token
    log.error("TELEGRAM_BOT_TOKEN no encontrado o vacío en .env")
    sys.exit(1)


def append_inbox(text: str, sender: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with INBOX.open("a") as f:
        f.write(f"\n--- {timestamp} from {sender} ---\n")
        f.write(text + "\n")
    log.info("<- inbox: [%s] %s", sender, text[:80])


def read_outbox_new():
    if not OUTBOX.exists():
        return None
    content = OUTBOX.read_text().strip()
    if not content:
        return None
    OUTBOX.write_text("")
    log.info("-> outbox: %s", content[:80])
    return content


def log_conv(role: str, content: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with CONV_LOG.open("a") as f:
        f.write(f"[{timestamp}] {role}: {content}\n")


async def main():
    from telegram import Update
    from telegram.ext import Application, MessageHandler, filters, ContextTypes

    token = load_token()
    log.info("Bridge arrancando. Chat permitido: %s", ALLOWED_CHAT_ID)
    log.info("Inbox:  %s", INBOX)
    log.info("Outbox: %s", OUTBOX)

    INBOX.touch()
    OUTBOX.touch()

    app = Application.builder().token(token).build()

    async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not update.message or not update.message.text:
            return
        chat_id = update.message.chat_id
        if chat_id != ALLOWED_CHAT_ID:
            log.warning("Mensaje de chat no permitido: %s", chat_id)
            return
        text = update.message.text.strip()
        user = update.message.from_user.first_name or "user"
        log_conv(f"{user}", text)
        append_inbox(text, user)
        try:
            await update.message.reply_text("[Recibido. Procesando...]")
        except Exception as e:
            log.error("Error enviando acuse: %s", e)

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_message))

    # Inicializar manualmente
    await app.initialize()
    await app.start()
    await app.updater.start_polling(allowed_updates=["message"])
    log.info("Polling Telegram activo")

    # Watcher de outbox en bucle
    stop_event = asyncio.Event()

    def _stop(*_):
        log.info("Senal de parada recibida")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _stop)

    try:
        while not stop_event.is_set():
            try:
                content = read_outbox_new()
                if content:
                    log.info("Enviando respuesta: %s", content[:80])
                    await app.bot.send_message(
                        chat_id=ALLOWED_CHAT_ID, text=content
                    )
                    log_conv("hermes", content)
            except Exception as e:
                log.error("Error en watcher: %s", e)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                pass
    finally:
        log.info("Cerrando bridge...")
        try:
            if app.updater.running:
                await app.updater.stop()
        except (AttributeError, Exception) as e:
            log.warning("updater.stop fallo (ignorado): %s", e)
        try:
            await app.stop()
        except Exception as e:
            log.warning("app.stop fallo (ignorado): %s", e)
        try:
            await app.shutdown()
        except Exception as e:
            log.warning("app.shutdown fallo (ignorado): %s", e)
        log.info("Bridge cerrado")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
