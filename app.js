const status = document.querySelector("#chat-status");
const form = document.querySelector("#message-form");
const nameInput = document.querySelector("#name-input");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const messages = document.querySelector("#messages");
const maxVisibleMessages = 100;
const room = "tung-tung-sahur";
const channel = "BroadcastChannel" in window ? new BroadcastChannel(room) : null;

status.textContent = channel ? "Só neste navegador" : "Só nesta aba";
sendButton.disabled = false;

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

  const name = document.createElement("strong");
  name.className = "message-name";
  name.textContent = message.name;

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.text;

  item.append(name, text);
  messages.append(item);

  while (messages.childElementCount > maxVisibleMessages) {
    messages.firstElementChild.remove();
  }

  messages.scrollTop = messages.scrollHeight;
}

if (channel) {
  channel.addEventListener("message", (event) => renderMessage(event.data));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = {
    name: nameInput.value.trim(),
    text: messageInput.value.trim(),
  };
  if (!message.name || !message.text) {
    return;
  }

  renderMessage(message);
  channel?.postMessage(message);
  messageInput.value = "";
  messageInput.focus();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("Falha ao habilitar modo offline:", error);
  });
}
