import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const status = document.querySelector("#chat-status");
const form = document.querySelector("#message-form");
const nameInput = document.querySelector("#name-input");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const messages = document.querySelector("#messages");
const config = window.CHAT_CONFIG;
const maxVisibleMessages = 100;
let connected = false;

function setStatus(message) {
  status.textContent = message;
}

function renderMessage(message) {
  if (
    typeof message?.name !== "string" ||
    typeof message?.text !== "string" ||
    message.name.length > 24 ||
    message.text.length > 500
  ) {
    return;
  }

  const item = document.createElement("article");
  item.className = "message";

  const heading = document.createElement("div");
  heading.className = "message-heading";

  const name = document.createElement("strong");
  name.className = "message-name";
  name.textContent = message.name;

  const time = document.createElement("time");
  time.className = "message-time";
  const date = new Date(message.createdAt);
  time.textContent = Number.isNaN(date.getTime())
    ? "agora"
    : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.text;

  heading.append(name, time);
  item.append(heading, text);
  messages.append(item);

  while (messages.childElementCount > maxVisibleMessages) {
    messages.firstElementChild.remove();
  }

  messages.scrollTop = messages.scrollHeight;
}

if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
  setStatus(
    "A sala precisa ser configurada: adicione a URL e a chave pública do Supabase em config.js."
  );
} else {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    realtime: { params: { eventsPerSecond: 5 } },
  });
  const channel = supabase.channel("sala-aberta", {
    config: { private: false, broadcast: { self: false } },
  });

  channel.on("broadcast", { event: "message" }, ({ payload }) => {
    renderMessage(payload);
  });

  channel.subscribe((subscriptionStatus) => {
    connected = subscriptionStatus === "SUBSCRIBED";
    sendButton.disabled = !connected;

    if (connected) {
      setStatus("Conectado. As mensagens aparecem apenas enquanto a sala está aberta.");
    } else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
      setStatus("Não foi possível conectar. Confira a configuração e tente recarregar a página.");
    } else if (subscriptionStatus === "CLOSED") {
      setStatus("A conexão com a sala foi encerrada.");
    } else {
      setStatus("Conectando à sala...");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const text = messageInput.value.trim();
    if (!connected || !name || !text) {
      return;
    }

    sendButton.disabled = true;
    const message = { name, text, createdAt: new Date().toISOString() };

    try {
      const result = await channel.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });

      if (result !== "ok") {
        setStatus("A mensagem não foi enviada. Tente novamente.");
        return;
      }

      renderMessage(message);
      messageInput.value = "";
      messageInput.focus();
      setStatus("Conectado. As mensagens aparecem apenas enquanto a sala está aberta.");
    } catch (error) {
      console.error("Falha ao enviar mensagem:", error);
      setStatus("Não foi possível enviar a mensagem. Confira sua conexão e tente novamente.");
    } finally {
      sendButton.disabled = !connected;
    }
  });
}
