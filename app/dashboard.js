auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "index.html";
  cargarDatos();
});

const METAS_KEY = "hidratify_metas";
const RADIO = 60;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function getMetas() {
  try {
    const raw = localStorage.getItem(METAS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return { orina: 1500 };
}
function setMeta(tipo, valor) {
  const metas = getMetas();
  metas[tipo] = valor;
  localStorage.setItem(METAS_KEY, JSON.stringify(metas));
}

const COLAPSO_KEY = "hidratify_colapso";

function getColapsos() {
  try {
    const raw = localStorage.getItem(COLAPSO_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return { orina: false };
}

function aplicarColapso(tipo) {
  const colapsado = getColapsos()[tipo];
  const body = document.getElementById('bodyOrina');
  const chevron = document.getElementById('chevronOrina');
  body.style.display = colapsado ? 'none' : 'flex';
  chevron.style.transform = colapsado ? 'rotate(180deg)' : 'rotate(0deg)';
}

function toggleSeccion(tipo) {
  const colapsos = getColapsos();
  colapsos[tipo] = !colapsos[tipo];
  localStorage.setItem(COLAPSO_KEY, JSON.stringify(colapsos));
  aplicarColapso(tipo);
}

function editarMeta(tipo) {
  const metas = getMetas();
  const nuevo = prompt("Meta diaria (ml):", metas[tipo]);
  const val = parseInt(nuevo);
  if (isNaN(val) || val <= 0) return;
  setMeta(tipo, val);
  cargarDatos();
}

function formatearFecha(fecha) {
  const f = new Date(fecha);
  return f.toLocaleDateString("es-AR");
}
function formatearHora(fecha) {
  const f = new Date(fecha);
  return f.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: true });
}

function guardarRegistroInput(tipo) {
  const input = document.getElementById('mlInputOrina');
  const cantidad = parseInt(input.value);
  if (isNaN(cantidad) || cantidad <= 0) return;
  guardarRegistro(tipo, cantidad, () => { input.value = ""; });
}

function guardarRegistro(tipo, cantidad, onDone) {
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
    if (onDone) onDone();
    cargarDatos();
  });
}

function cargarDatos() {
  const user = auth.currentUser;
  aplicarColapso("orina");
  cargarLista(user, "orina", "listaOrina", "totalOrina", "ringOrina", "metaOrinaLabel");
}

function cargarLista(user, tipo, listaId, totalId, ringId, metaLabelId) {
  const lista = document.getElementById(listaId);
  const total = document.getElementById(totalId);
  const ring = document.getElementById(ringId);
  const metaLabel = document.getElementById(metaLabelId);
  const meta = getMetas()[tipo];

  lista.innerHTML = `<div class="empty-state">Cargando...</div>`;

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  db.collection("users").doc(user.uid).collection(tipo)
    .where("timestamp", ">=", inicioHoy)
    .where("timestamp", "<=", finHoy)
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      lista.innerHTML = "";
      let suma = 0;

      snapshot.forEach(doc => {
        const d = doc.data();
        suma += d.ml;

        const row = document.createElement("div");
        row.className = "entry-row";
        row.innerHTML = `
          <div class="entry-info">
            <div class="entry-ml">${d.ml} ml</div>
            <div class="entry-time">${d.hora}</div>
          </div>
          <button class="btn-edit" onclick="editar('${tipo}', '${doc.id}', ${d.ml})"><i class="fa-solid fa-pencil"></i></button>
          <button class="btn-delete" onclick="eliminar('${tipo}', '${doc.id}')"><i class="fa-solid fa-trash"></i></button>
        `;
        lista.appendChild(row);
      });

      if (snapshot.empty) {
        lista.innerHTML = `<div class="empty-state">Sin registros hoy</div>`;
      }

      total.innerText = suma;
      metaLabel.innerText = `de ${meta} ml`;

      const pct = Math.min(1, meta > 0 ? suma / meta : 0);
      ring.setAttribute("stroke-dasharray", `${CIRCUNFERENCIA} ${CIRCUNFERENCIA}`);
      ring.setAttribute("stroke-dashoffset", CIRCUNFERENCIA * (1 - pct));
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
    .then(() => { window.location.href = 'index.html'; })
    .catch((error) => { console.error('Error al cerrar sesión:', error); });
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
