auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "index.html";
  cargarDatos();
});

function formatearFecha(fecha) {
  const f = new Date(fecha);
  return f.toLocaleDateString("es-AR");
}

function formatearHora(fecha) {
  const f = new Date(fecha);
  return f.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: true });
}

function guardarRegistro(tipo) {
  const cantidad = parseInt(document.getElementById("mlInput").value);
  if (isNaN(cantidad) || cantidad <= 0) return;

  const ahora = new Date();
  const data = {
    fecha: formatearFecha(ahora),
    hora: formatearHora(ahora),
    ml: cantidad,
    timestamp: ahora
  };

  const user = auth.currentUser;
  db.collection("users").doc(user.uid).collection(tipo).add(data).then(() => {
    document.getElementById("mlInput").value = "";
    cargarDatos();
  });
}

function cargarDatos() {
  const user = auth.currentUser;
  cargarTabla(user, "agua", "tablaAgua", "totalAgua");
  cargarTabla(user, "orina", "tablaOrina", "totalOrina");
}

function cargarTabla(user, tipo, tablaId, totalId) {
  db.collection("users").doc(user.uid).collection(tipo).orderBy("timestamp", "desc").get()
    .then(snapshot => {
      const tabla = document.getElementById(tablaId);
      const total = document.getElementById(totalId);
      tabla.innerHTML = "";
      let suma = 0;

      snapshot.forEach(doc => {
        const d = doc.data();
        suma += d.ml;

        tabla.innerHTML += `
          <tr>
            <td>${d.fecha}</td>
            <td>${d.hora}</td>
            <td>${d.ml}</td>
            <td>
              <button onclick="editar('${tipo}', '${doc.id}', ${d.ml})">✏️</button>
              <button onclick="eliminar('${tipo}', '${doc.id}')">🗑️</button>
            </td>
          </tr>
        `;
      });

      total.innerText = suma + " ml";
    });
}

function eliminar(tipo, id) {
  const user = auth.currentUser;
  db.collection("users").doc(user.uid).collection(tipo).doc(id).delete().then(() => cargarDatos());
}

function editar(tipo, id, actual) {
  const nuevo = prompt("Editar valor (ml):", actual);
  const nuevoInt = parseInt(nuevo);
  if (isNaN(nuevoInt)) return;

  const user = auth.currentUser;
  db.collection("users").doc(user.uid).collection(tipo).doc(id).update({
    ml: nuevoInt
  }).then(() => cargarDatos());
}

document.getElementById('btnLogout').addEventListener('click', () => {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
});

