// Función para mostrar mensajes en el popup
function showPopup(message, isError = false) {
  const popup = document.getElementById('popup');
  popup.textContent = message;
  popup.classList.remove('hidden');
  if (isError) {
    popup.classList.remove('text-green-600');
    popup.classList.add('text-red-600');
  } else {
    popup.classList.remove('text-red-600');
    popup.classList.add('text-green-600');
  }
}

// Función para ocultar popup
function hidePopup() {
  const popup = document.getElementById('popup');
  popup.classList.add('hidden');
  popup.textContent = '';
}

// Función para login
function login() {
  hidePopup();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showPopup('Por favor, ingrese email y contraseña.', true);
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Login exitoso, redirige a dashboard
      window.location.href = 'dashboard.html';
    })
    .catch(error => {
      console.log('Error login:', error); // Para depuración

      const msg = error.message.toLowerCase();

      if (error.code === 'auth/user-not-found' || msg.includes('invalid-login-credentials')) {
        showPopup('El usuario no existe. Por favor, regístrese primero.', true);
      } else if (error.code === 'auth/wrong-password') {
        showPopup('Contraseña incorrecta. Intente de nuevo.', true);
      } else if (error.code === 'auth/invalid-email') {
        showPopup('Email inválido.', true);
      } else {
        showPopup(error.message, true);
      }
    });
}


// Función para registro de nuevo usuario
function register() {
  hidePopup();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showPopup('Por favor, ingrese email y contraseña para registrarse.', true);
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      showPopup('Registro exitoso. Ahora puede iniciar sesión.', false);
    })
    .catch(error => {
      if (error.code === 'auth/email-already-in-use') {
        showPopup('El email ya está en uso.', true);
      } else if (error.code === 'auth/invalid-email') {
        showPopup('Email inválido.', true);
      } else if (error.code === 'auth/weak-password') {
        showPopup('La contraseña es muy débil.', true);
      } else {
        showPopup(error.message, true);
      }
    });
}
