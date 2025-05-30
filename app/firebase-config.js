const firebaseConfig = {
  apiKey: "AIzaSyA1llF67FcOQXXP319kEn0MXtEmjkweWTk",
  authDomain: "hidratify.firebaseapp.com",
  projectId: "hidratify",
  storageBucket: "hidratify.firebasestorage.app",
  messagingSenderId: "122573889836",
  appId: "1:122573889836:web:8dff40a0dd54855edd8c89"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


