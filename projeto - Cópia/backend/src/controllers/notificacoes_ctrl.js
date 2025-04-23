const PushSubscription = require("../database/models/PushSubscription");
const { sendPushNotification } = require("../utils/pushNotifications");

// Registrar assinatura de notificação push
const registerPushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id_utilizador;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: "Dados de assinatura inválidos" });
    }

    // Verificar se já existe essa assinatura
    const existingSubscription = await PushSubscription.findOne({
      where: {
        id_utilizador: userId,
        endpoint: subscription.endpoint
      }
    });

    if (existingSubscription) {
      return res.json({ message: "Assinatura já registrada" });
    }

    // Criar nova assinatura
    await PushSubscription.create({
      id_utilizador: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    });

    res.status(201).json({ message: "Assinatura registrada com sucesso" });
  } catch (error) {
    console.error("Erro ao registrar assinatura:", error);
    res.status(500).json({ message: "Erro ao registrar assinatura" });
  }
};

// Testar envio de notificação
const testPushNotification = async (req, res) => {
  try {
    const userId = req.user.id_utilizador;

    // Buscar assinaturas do usuário
    const subscriptions = await PushSubscription.findAll({
      where: { id_utilizador: userId }
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: "Nenhuma assinatura encontrada" });
    }

    // Enviar notificação de teste
    const subscription = {
      endpoint: subscriptions[0].endpoint,
      keys: {
        p256dh: subscriptions[0].p256dh,
        auth: subscriptions[0].auth
      }
    };

    const success = await sendPushNotification(
      subscription,
      "Teste de Notificação",
      "Esta é uma notificação de teste. Se você está vendo isso, as notificações estão funcionando!"
    );

    if (success) {
      res.json({ message: "Notificação de teste enviada com sucesso" });
    } else {
      res.status(500).json({ message: "Falha ao enviar notificação de teste" });
    }
  } catch (error) {
    console.error("Erro ao testar notificação:", error);
    res.status(500).json({ message: "Erro ao testar notificação" });
  }
};

module.exports = {
  registerPushSubscription,
  testPushNotification
};