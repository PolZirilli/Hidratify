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
  const tabla = document.getElementById(tablaId);
  const total = document.getElementById(totalId);

  // Skeleton loader
  tabla.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    tabla.innerHTML += `
      <tr>
        <td><div class="h-4 bg-gray-300 animate-pulse rounded w-20"></div></td>
        <td><div class="h-4 bg-gray-300 animate-pulse rounded w-16"></div></td>
        <td><div class="h-4 bg-gray-300 animate-pulse rounded w-10"></div></td>
        <td><div class="h-4 bg-gray-300 animate-pulse rounded w-12"></div></td>
      </tr>
    `;
  }
  total.innerText = "Cargando...";

  // Obtener fecha de hoy en formato local
  const hoy = new Date().toLocaleDateString("es-AR");

  // Traer datos desde Firebase
  db.collection("users").doc(user.uid).collection(tipo).orderBy("timestamp", "desc").get()
    .then(snapshot => {
      tabla.innerHTML = "";
      let suma = 0;
      let hayDatos = false;

      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.fecha === hoy) {
          hayDatos = true;
          suma += d.ml;

          tabla.innerHTML += `
            <tr>
              <td>${d.fecha}</td>
              <td>${d.hora}</td>
              <td>${d.ml}</td>
              <td>
                <button onclick="editar('${tipo}', '${doc.id}', ${d.ml})" class="pr-2 pl-2"><i class="fa-solid fa-pencil"></i></button>
                <button onclick="eliminar('${tipo}', '${doc.id}')" class="pr-2 pl-2"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          `;
        }
      });

      if (!hayDatos) {
        tabla.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500">Sin registros hoy</td></tr>`;
      }

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
async function exportarPDF(tipo) {
  const user = auth.currentUser;
  const snapshot = await db.collection("users").doc(user.uid).collection(tipo).orderBy("timestamp", "desc").get();

  if (snapshot.empty) {
    alert("No hay datos para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const datos = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    datos.push([d.fecha, d.hora, d.ml + " ml"]);
  });

  doc.text(`Historial de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 14, 16);
  doc.autoTable({
    head: [["Fecha", "Hora", "Cantidad"]],
    body: datos,
    startY: 20
  });

  doc.save(`hidratify_${tipo}_historial.pdf`);
}
