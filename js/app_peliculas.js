
const tabla = document.getElementById("tabla-peliculas");
const form = document.getElementById("formAgregar");
const btnSubmit = document.getElementById("btnSubmit");

let peliculas = [];
let peliculaEnEdicion = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarPeliculasDesdeStorage();
  actualizarSelectorPelicula();
  actualizarPromedios();
});

// === Submit formulario ===
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const ano = parseInt(document.getElementById("anoDeEstreno").value);
  const duracion = parseInt(document.getElementById("duracion").value);
  const genero = document.getElementById("genero").value;
  const cartelera = document.getElementById("enCartelera").value;
  const antiguedad = new Date().getFullYear() - ano;

//Validación del formulario
if (!validarFormulario()) return;


  const nuevaPelicula = { titulo, director, ano, duracion, genero, cartelera, antiguedad };

  if (peliculaEnEdicion) {
    borrarPeliculaDelStorage(peliculaEnEdicion);
    // BORRAR VISUALMENTE LA FILA ANTERIOR
const filas = tabla.querySelectorAll("tbody tr");
filas.forEach(fila => {
  if (fila.dataset.titulo === peliculaEnEdicion.titulo) {
    fila.remove();
  }
});

    agregarPeliculaATabla(nuevaPelicula);
    guardarPeliculaEnStorage(nuevaPelicula);
  } else {
    agregarPeliculaATabla(nuevaPelicula);
    guardarPeliculaEnStorage(nuevaPelicula);
  }

  actualizarEstadisticas();
  actualizarSelectorPelicula();
  actualizarPromedios();
  form.reset();
  peliculaEnEdicion = null;
  btnSubmit.textContent = "Agregar Película";
});

// === Tabla ===
function agregarPeliculaATabla(pelicula) {
  const fila = tabla.insertRow();

  // Agregamos identificador para poder eliminarla visualmente al editar
  fila.dataset.titulo = pelicula.titulo;

  const celdas = [
    pelicula.titulo,
    pelicula.director,
    pelicula.ano,
    pelicula.duracion,
    pelicula.genero,
    pelicula.cartelera,
    pelicula.antiguedad + " años"
  ];

  celdas.forEach((valor, index) => {
  const celda = fila.insertCell();
  celda.textContent = valor;

   // Centrar ciertas columnas
  if ([2, 3, 5].includes(index)) {
    celda.classList.add("text-center");
  }

  //  Aplicar estilo condicional a la última celda (antigüedad)
  if (index === celdas.length - 1) {
    const años = parseInt(pelicula.antiguedad);

    if (años <= 5) {
      celda.classList.add("bg-success", "text-white");
    } else if (años <= 20) {
      celda.classList.add("bg-warning");
    } else {
      celda.classList.add("bg-danger", "text-white");
    }
  }
});


  const celdaAcciones = fila.insertCell();

  const btnEditar = crearBoton("Editar", "btn-warning me-1", () => {
    llenarFormularioConPelicula(pelicula);
    peliculaEnEdicion = pelicula;
    btnSubmit.textContent = "Guardar Cambios";
  });

 const btnEliminar = crearBoton("Borrar", "btn-danger", function () {
    // Eliminar esta misma fila
    fila.remove();
    borrarPeliculaDelStorage(pelicula);
    actualizarEstadisticas();
    actualizarSelectorPelicula();
    actualizarPromedios();
  });

  celdaAcciones.appendChild(btnEditar);
  celdaAcciones.appendChild(btnEliminar);
}


function crearBoton(texto, clases, accion) {
  const boton = document.createElement("button");
  boton.textContent = texto;
  boton.className = "btn btn-sm " + clases;
  boton.addEventListener("click", accion);
  return boton;
}

// === Storage ===
function obtenerPeliculasDesdeStorage() {
  const data = localStorage.getItem("peliculas");
  return data ? JSON.parse(data) : [];
}

function guardarPeliculaEnStorage(pelicula) {
  const lista = obtenerPeliculasDesdeStorage();
  lista.push(pelicula);
  localStorage.setItem("peliculas", JSON.stringify(lista));
}

function borrarPeliculaDelStorage(pelicula) {
  let lista = obtenerPeliculasDesdeStorage();
  const index = lista.findIndex(p =>
    Object.entries(pelicula).every(([key, val]) => p[key] === val)
  );
  if (index !== -1) {
    lista.splice(index, 1);
    localStorage.setItem("peliculas", JSON.stringify(lista));
  }
}

function cargarPeliculasDesdeStorage() {
  peliculas = obtenerPeliculasDesdeStorage();
  peliculas.forEach(agregarPeliculaATabla);
  actualizarEstadisticas();
  actualizarSelectorPelicula();
}

// === Formulario edición ===
function llenarFormularioConPelicula(p) {
  document.getElementById("titulo").value = p.titulo;
  document.getElementById("director").value = p.director;
  document.getElementById("anoDeEstreno").value = p.ano;
  document.getElementById("duracion").value = p.duracion;
  document.getElementById("genero").value = p.genero;
  document.getElementById("enCartelera").value = p.cartelera;
}

// === Validación del formulario ===
function validarFormulario() {
  const titulo = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const ano = parseInt(document.getElementById("anoDeEstreno").value);
  const duracion = parseInt(document.getElementById("duracion").value);
  const genero = document.getElementById("genero").value;
  const cartelera = document.getElementById("enCartelera").value;

  const errores = [];

  if (titulo.length < 2) {
    errores.push("– Título (mínimo 2 caracteres)");
  }

  if (director.length < 3) {
    errores.push("– Director (mínimo 3 caracteres)");
  }

  const anioActual = new Date().getFullYear();
  if (isNaN(ano) || ano < 1900 || ano > anioActual) {
    errores.push(`– Año de estreno (entre 1900 y ${anioActual})`);
  }

  if (isNaN(duracion) || duracion <= 0) {
    errores.push("– Duración (en minutos, entero > 0)");
  }

  if (genero === "Seleccionar...") {
    errores.push("– Debe seleccionar un género");
  }

  if (cartelera === "Seleccionar...") {
    errores.push("– Debe indicar si está en cartelera");
  }

  if (errores.length > 0) {
    alert("No ha ingresado valores válidos. Por favor corrija:\n\n" + errores.join("\n"));
    return false;
  }

  return true;
}


// === Estadísticas ===
function actualizarEstadisticas() {
  const lista = obtenerPeliculasDesdeStorage();
  document.getElementById("total-peliculas").textContent = lista.length;

  const carteleraSi = lista.filter(p => p.cartelera === "si").length;
  const carteleraNo = lista.length - carteleraSi;
  document.getElementById("en-cartelera-si").textContent = carteleraSi;
  document.getElementById("en-cartelera-no").textContent = carteleraNo;

  const conteoPorGenero = {};
  lista.forEach(p => {
    conteoPorGenero[p.genero] = (conteoPorGenero[p.genero] || 0) + 1;
  });

  const ul = document.getElementById("estadisticas-genero");
  ul.innerHTML = "";
  for (const genero in conteoPorGenero) {
    const li = document.createElement("li");
    li.textContent = genero + ": " + conteoPorGenero[genero];
    ul.appendChild(li);
  }
}

// === Puntuación ===
function actualizarSelectorPelicula() {
  const lista = obtenerPeliculasDesdeStorage();
  const selector = document.getElementById("peliculaSeleccionada");
  if (!selector) return;

  selector.innerHTML = '<option selected disabled>Seleccione una película</option>';
  lista.forEach(p => {
    const option = document.createElement("option");
    option.value = p.titulo;
    option.textContent = p.titulo;
    selector.appendChild(option);
  });
}

document.getElementById("formPuntuar").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreUsuario").value;
  const titulo = document.getElementById("peliculaSeleccionada").value;
  // Si aún está en la opción por defecto
if (titulo === "Seleccione una película") {
  alert("Por favor seleccioná una película antes de puntuar.");
  return;
}
  const puntaje = parseInt(document.querySelector("input[name='puntuacion']:checked").value);

  const nuevaPuntuacion = { nombre, titulo, puntaje };
  const votos = obtenerPuntuaciones();
  votos.push(nuevaPuntuacion);
  localStorage.setItem("puntuaciones", JSON.stringify(votos));

  this.reset();
  actualizarPromedios();
});

function obtenerPuntuaciones() {
  const data = localStorage.getItem("puntuaciones");
  return data ? JSON.parse(data) : [];
}

function actualizarPromedios() {
  const votos = obtenerPuntuaciones();
  const porPelicula = {};

  votos.forEach(v => {
    if (!porPelicula[v.titulo]) porPelicula[v.titulo] = [];
    porPelicula[v.titulo].push(v.puntaje);
  });

  const tbody = document.getElementById("tablaPromedios");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (const titulo in porPelicula) {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = titulo;
    const td2 = document.createElement("td");
    const promedio = (porPelicula[titulo].reduce((a, b) => a + b) / porPelicula[titulo].length).toFixed(2);
    td2.textContent = promedio;
    td2.classList.add("text-center");
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  }
}
function eliminarTodasLasPuntuaciones() {
  if (confirm("¿Estás seguro que querés borrar TODAS las puntuaciones?\nEsta acción no se puede deshacer.")) {
    localStorage.removeItem("puntuaciones");
    actualizarPromedios();

    alert("Las puntuaciones han sido eliminadas.");
  }
}

