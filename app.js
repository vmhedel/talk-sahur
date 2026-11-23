const status = document.querySelector("#chat-status");
const form = document.querySelector("#message-form");
const nameInput = document.querySelector("#name-input");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const messages = document.querySelector("#messages");
const maxVisibleMessages = 100;
const topic = "talk-sahur/vmhedel/tung-tung-sahur/messages";
const senderId =
  typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const mqttLib = window.mqtt;
let client;
let connected = false;

function getNameColor(senderId) {
  let hash = 0;
  for (const character of senderId) {
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  }

  const hue = hash % 360;
  const saturation = 70 + ((hash >>> 9) % 21);
  const lightness = 65 + ((hash >>> 17) % 13);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function getImageUrl(text) {
  if (text !== text.trim() || /\s/.test(text)) {
    return null;
  }

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderMessage(message) {
  if (
    typeof message?.name !== "string" ||
    typeof message?.text !== "string" ||
    typeof message?.senderId !== "string" ||
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
  name.style.color = getNameColor(message.senderId);

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.text;

  item.append(name);

  const imageUrl = getImageUrl(message.text);
  if (imageUrl) {
    text.hidden = true;

    const imageLink = document.createElement("a");
    imageLink.href = imageUrl;
    imageLink.target = "_blank";
    imageLink.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.className = "message-image";
    image.alt = "Imagem enviada";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      imageLink.remove();
      text.hidden = false;
    }, { once: true });
    image.src = imageUrl;

    imageLink.append(image);
    item.append(imageLink);
  }

  item.append(text);
  messages.append(item);

  while (messages.childElementCount > maxVisibleMessages) {
    messages.firstElementChild.remove();
  }

  messages.scrollTop = messages.scrollHeight;
}

if (!mqttLib) {
  status.textContent = "Falha ao carregar o chat";
  sendButton.disabled = true;
} else {
  try {
    client = mqttLib.connect("wss://broker.emqx.io:8084/mqtt", {
      clientId: `talk-sahur-${senderId}`,
      clean: true,
      connectTimeout: 10000,
      keepalive: 30,
      protocolVersion: 5,
      reconnectPeriod: 3000,
    });

    client.on("connect", () => {
      status.textContent = "Conectando...";
      sendButton.disabled = true;
      client.subscribe(topic, { qos: 0, rh: 2 }, (error) => {
        if (error) {
          console.error("Falha ao entrar na sala:", error);
          status.textContent = "Falha ao entrar";
          return;
        }

        connected = true;
        status.textContent = "Ao vivo";
        sendButton.disabled = false;
      });
    });

    client.on("message", (receivedTopic, payload, packet) => {
      if (receivedTopic !== topic || packet.retain) {
        return;
      }

      try {
        const message = JSON.parse(payload.toString());
        if (message.senderId !== senderId) {
          renderMessage(message);
        }
      } catch (error) {
        console.error("Mensagem recebida inválida:", error);
      }
    });

    client.on("reconnect", () => {
      connected = false;
      status.textContent = "Reconectando...";
      sendButton.disabled = true;
    });
    client.on("offline", () => {
      connected = false;
      status.textContent = "Sem conexão";
      sendButton.disabled = true;
    });
    client.on("close", () => {
      connected = false;
      status.textContent = "Sem conexão";
      sendButton.disabled = true;
    });
    client.on("error", (error) => {
      console.error("Falha na conexão do chat:", error);
      status.textContent = "Sem conexão";
      sendButton.disabled = true;
    });
  } catch (error) {
    console.error("Falha ao iniciar o chat:", error);
    status.textContent = "Falha na conexão";
    sendButton.disabled = true;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = {
    senderId,
    name: nameInput.value.trim(),
    text: messageInput.value.trim(),
  };
  if (!connected || !message.name || !message.text) {
    return;
  }

  sendButton.disabled = true;
  client.publish(topic, JSON.stringify(message), { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error("Falha ao enviar mensagem:", error);
      status.textContent = "Falha ao enviar";
    } else {
      renderMessage(message);
      messageInput.value = "";
      messageInput.focus();
    }

    sendButton.disabled = !connected;
  });
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("Falha ao atualizar o cache offline:", error);
  });
}
