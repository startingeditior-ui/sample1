importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDFl9sE8oT5lL0l8x2gGPmVFhR0qKz4Q5s",
  authDomain: "medlink-notification.firebaseapp.com",
  projectId: "medlink-notification",
  storageBucket: "medlink-notification.appspot.com",
  messagingSenderId: "113320880948248735520",
  appId: "1:113320880948248735520:web:a1b2c3d4e5f6g7h8i9j0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'MedLinkID';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/ML.png'
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});