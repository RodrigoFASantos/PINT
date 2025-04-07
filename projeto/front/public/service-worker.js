self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
      body: data.notification.body,
      icon: data.notification.icon,
      vibrate: data.notification.vibrate,
      data: data.notification.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Redirecionar para uma URL específica quando a notificação for clicada
    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    }
  });