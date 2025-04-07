const webpush = require("web-push");
require("dotenv").config();

// Configurar chaves VAPID
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL}`,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

// Enviar notificação push
const sendPushNotification = async (subscription, title, body, data = {}) => {
  try {
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: "/logo.png",
        vibrate: [100, 50, 100],
        data
      }
    });

    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação push:", error);
    return false;
  }
};

// Enviar notificação para vários assinantes
const sendNotificationToMany = async (subscriptions, title, body, data = {}) => {
  const results = [];
  for (const subscription of subscriptions) {
    try {
      const result = await sendPushNotification(subscription, title, body, data);
      results.push({ subscription, success: result });
    } catch (error) {
      results.push({ subscription, success: false, error: error.message });
    }
  }
  return results;
};

module.exports = {
  sendPushNotification,
  sendNotificationToMany
};