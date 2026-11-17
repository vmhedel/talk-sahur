import { joinRoom } from "https://esm.run/trystero@0.27.0";

const status = document.querySelector("#chat-status");
const form = document.querySelector("#message-form");
const nameInput = document.querySelector("#name-input");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const messages = document.querySelector("#messages");
const maxVisibleMessages = 100;

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

let room;
let chat;

function updateConnectionStatus() {
  const connected = Object.keys(room.getPeers()).length > 0;
  status.textContent = connected ? "Ao vivo" : "Aguardando alguém";
  sendButton.disabled = !connected;
}

try {
  room = joinRoom(
    { appId: "vmhedel/talk-sahur", identity: "none" },
    "tung-tung-sahur"
  );
  chat = room.makeAction("chat-message");
  chat.onMessage((message) => renderMessage(message));
  room.onPeerJoin(updateConnectionStatus, { replay: true });
  room.onPeerLeave(updateConnectionStatus);
  room.onError((error) => {
    console.error("Falha na conexão P2P:", error);
    status.textContent = "Falha na conexão";
    sendButton.disabled = true;
  });
} catch (error) {
  console.error("Falha ao entrar na sala:", error);
  status.textContent = "Falha na conexão";
  sendButton.disabled = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = {
    name: nameInput.value.trim(),
    text: messageInput.value.trim(),
  };
  if (!message.name || !message.text || sendButton.disabled) {
    return;
  }

  sendButton.disabled = true;
  try {
    await chat.send(message);
    renderMessage(message);
    messageInput.value = "";
    messageInput.focus();
  } catch (error) {
    console.error("Falha ao enviar mensagem:", error);
    status.textContent = "Falha ao enviar";
  } finally {
    updateConnectionStatus();
  }
});
