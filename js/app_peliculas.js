// === Referencias a elementos del DOM ===
const tabla = document.getElementById("tabla-peliculas");
const form = document.getElementById("formAgregar");
const btnSubmit = document.getElementById("btnSubmit");

// === Variables globales ===
let peliculas = []; // Lista de películas cargadas
let peliculaEnEdicion = null; // Película en proceso de edición-null agrego una nueva película

// === Inicialización al cargar el DOM ===
document.addEventListener("DOMContentLoaded", () => {
  cargarPeliculasDesdeStorage(); // Cargar películas almacenadas
  actualizarSelectorPelicula(); // Cargar películas en el selector de puntuación
  actualizarPromedios(); // Mostrar promedios
});

// === Manejo del envío del formulario principal ===
form.addEventListener("submit", function (e) {
  e.preventDefault();//Evita que el formulario se envíe de forma tradicional y recargue la página y pierda los datos.

  // Obtiene los datos ingresados por el usuario
  const titulo = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const ano = parseInt(document.getElementById("anoDeEstreno").value);
  const duracion = parseInt(document.getElementById("duracion").value);
  const genero = document.getElementById("genero").value;
  const cartelera = document.getElementById("enCartelera").value;
  const antiguedad = new Date().getFullYear() - ano;//Calculo la antiguedad de la película

  if (!validarFormulario()) return;//Si devuelve false hay errores en el formulario, no se agrega la película

  // Validación de duplicado de título (excepto si se está editando el mismo título)
  const peliculasExistentes = obtenerPeliculasDesdeStorage();
  const tituloEnUso = peliculasExistentes.some(p =>
    p.titulo.toLowerCase() === titulo.toLowerCase() &&
    (!peliculaEnEdicion || p.titulo.toLowerCase() !== peliculaEnEdicion.titulo.toLowerCase())
  );

  if (tituloEnUso) {
    alert("Ya existe una película con ese título. Por favor, elija otro título.");
    return;
  }

  //Creo el Objeto Nueva Película con los datos del formulario
  const nuevaPelicula = { titulo, director, ano, duracion, genero, cartelera, antiguedad };

  // Si hay una película en edición, la reemplazo
  if (peliculaEnEdicion) {
    borrarPeliculaDelStorage(peliculaEnEdicion);
    const filas = tabla.querySelectorAll("tbody tr");
    filas.forEach(fila => {
      if (fila.dataset.titulo === peliculaEnEdicion.titulo) {
        fila.remove();
      }
    });
  }
  agregarPeliculaATabla(nuevaPelicula);
  guardarPeliculaEnStorage(nuevaPelicula);
  actualizarEstadisticas();
  actualizarSelectorPelicula();
  actualizarPromedios();
  form.reset();
  peliculaEnEdicion = null;
  btnSubmit.textContent = "Agregar Película";
});

// === Agregar una nueva fila (película) a la tabla ===
function agregarPeliculaATabla(pelicula) {
  const fila = tabla.insertRow(); //Ctrea una nueva fila en la tabla
  fila.dataset.titulo = pelicula.titulo;// Asigno el título como data-atributo para identificar la fila
  //Creo el Array con los datos de la película
  const celdas = [
    pelicula.titulo,
    pelicula.director,
    pelicula.ano,
    pelicula.duracion,
    pelicula.genero,
    pelicula.cartelera,
    pelicula.antiguedad + " años"
  ];
  //Recorro el Array y creo las celdas correspondientes y le pone contenido
  celdas.forEach((valor, index) => {
    const celda = fila.insertCell();
    celda.textContent = valor;

    //Centro algunas columnas
    if ([2, 3, 5].includes(index)) {
      celda.classList.add("text-center");
    }

    //A la última celda (antigüedad), le aplicamos color:
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

  //Creamos una celda vacía para colocar los botones "Editar" y "Borrar".
  const celdaAcciones = fila.insertCell();
  celdaAcciones.classList.add("celda-acciones");
  //Crear Botón "Editar" y "Borrar"
  const btnEditar = crearBoton("Editar", "btn-warning me-1", () => {
    llenarFormularioConPelicula(pelicula);//leno el formulario con los datos de la película}
    peliculaEnEdicion = pelicula;// Asigno el valor a peliculaEnEdicion
    if (confirm("¿Estás seguro que querés modificar esta película?")) {
      btnSubmit.textContent = "Guardar Cambios";//Cambio mel texto del botón a "Guardar Cambios"
    }
  }, "bi bi-pencil-square");

  const btnEliminar = crearBoton("Borrar", "btn-danger", function () {
    if (confirm("¿Estás seguro que querés borrar esta película?")) {
      fila.remove();
      borrarPeliculaDelStorage(pelicula);
      actualizarEstadisticas();
      actualizarSelectorPelicula();
      actualizarPromedios();
      alert("La película ha sido eliminada.");
    }
  }, "bi bi-trash");
  //Agregamos los botones a la Celda de acciones
  celdaAcciones.appendChild(btnEditar);
  celdaAcciones.appendChild(btnEliminar);
}

// === Crear botón con icono ===
function crearBoton(texto, clases, accion, iconoClase) {
  const boton = document.createElement("button");
  boton.className = "btn btn-md " + clases;
  boton.addEventListener("click", accion);

  if (iconoClase) {
    const icono = document.createElement("i");
    icono.className = iconoClase + " icono-" + texto.toLowerCase();
    boton.appendChild(icono);
    boton.append(" " + texto);
  } else {
    boton.textContent = texto;
  }

  return boton;
}

// === Funciones de localStorage ===
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
    Object.entries(pelicula).every(([key, val]) => p[key] === val)//Convierte el objeto pelicula en un array de pares clave/valor.
  );
  //findIndex recorre la lista y devuelve el índice (posición) de la primera película que cumpla esa condición.
  //Si no encuentra coincidencia exacta, devuelve -1
  if (index !== -1) {
    lista.splice(index, 1);//Elimina 1 elemento del array lista, en la posición index
    //Actualiza el localStorage con la lista sin la película eliminada
    localStorage.setItem("peliculas", JSON.stringify(lista));
  }
}

function cargarPeliculasDesdeStorage() {
  peliculas = obtenerPeliculasDesdeStorage();
  peliculas.forEach(agregarPeliculaATabla);
  actualizarEstadisticas();
  actualizarSelectorPelicula();
}

// === Llenar formulario con datos de película ===
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

  if (titulo.length < 2) errores.push("– Título (mínimo 2 caracteres)");
  if (director.length < 3) errores.push("– Director (mínimo 3 caracteres)");

  const anioActual = new Date().getFullYear();
  if (isNaN(ano) || ano < 1900 || ano > anioActual)
    errores.push(`– Año de estreno (entre 1900 y ${anioActual})`);

  if (isNaN(duracion) || duracion <= 0)
    errores.push("– Duración (en minutos, entero > 0)");

  if (genero === "Seleccionar...") errores.push("– Debe seleccionar un género");
  if (cartelera === "Seleccionar...") errores.push("– Debe indicar si está en cartelera");

  if (errores.length > 0) {
    alert("No ha ingresado valores válidos. Por favor corrija:\n\n" + errores.join("\n"));
    return false;
  }

  return true;
}

// === Estadísticas ===

//Actualiza dinámicamente la sección de estadísticas del sistema
function actualizarEstadisticas() {
  const lista = obtenerPeliculasDesdeStorage();
  document.getElementById("total-peliculas").textContent = lista.length;//Muestra total de películas

  //Muestra las que están en Cartelera y las que no
  const carteleraSi = lista.filter(p => p.cartelera === "si").length;
  const carteleraNo = lista.length - carteleraSi;
  document.getElementById("en-cartelera-si").textContent = carteleraSi;
  document.getElementById("en-cartelera-no").textContent = carteleraNo;

  //Por Género
  const conteoPorGenero = {};//Crea un objeto vacío para guardar el conteo de películas por género
  lista.forEach(p => {
    conteoPorGenero[p.genero] = (conteoPorGenero[p.genero] || 0) + 1;
  });

  const ul = document.getElementById("estadisticas-genero");
  ul.innerHTML = "";
  //Recorre el objeto conteoPorGenero y crea un elemento <li> por cada género
  for (const genero in conteoPorGenero) {
    const li = document.createElement("li");
    li.textContent = genero + ": " + conteoPorGenero[genero];
    ul.appendChild(li);
  }
}

// === Actualiza selector de puntuación ===
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

// === Manejo del formulario de puntuación ===
document.getElementById("formPuntuar").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreUsuario").value;
  const titulo = document.getElementById("peliculaSeleccionada").value;

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

// === Obtener puntuaciones desde el storage ===
function obtenerPuntuaciones() {
  const data = localStorage.getItem("puntuaciones");
  return data ? JSON.parse(data) : [];
}

// === Calcular y mostrar promedios ===
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
  // Convertir el objeto a un array de pares [titulo, promedio]
  const promediosOrdenados = Object.entries(porPelicula).map(([titulo, puntajes]) => {
    const promedio = puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
    return [titulo, promedio];
  });

  // Ordenar de mayor a menor promedio
  promediosOrdenados.sort((a, b) => b[1] - a[1]);

  // Recorrer promedios ya ordenados
  promediosOrdenados.forEach(([titulo, promedio]) => {
    const tr = document.createElement("tr");

    const td1 = document.createElement("td");
    td1.textContent = titulo;

    const td2 = document.createElement("td");
    td2.textContent = promedio.toFixed(2);
    td2.classList.add("text-center");

    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
}

// === Eliminar todas las películas ===
document.getElementById("btnEliminarTodas").addEventListener("click", function () {
  if (confirm("¿Estás seguro que querés borrar TODAS las películas?\nEsta acción no se puede deshacer.")) {
    localStorage.removeItem("peliculas");//Elimina todas las películas almacenadas en localStorage
   //Selecciona todas las filas (<tr>) que están dentro del <tbody> de la tabla de películas.
    const filas = tabla.querySelectorAll("tbody tr");
    filas.forEach(fila => fila.remove());//Recorre y remueve cada una de las filas de la tabla.
    peliculas = [];
    peliculaEnEdicion = null;
    //Recalcula y actualiza todo lo relacionado con los datos que ya no existen:
    actualizarEstadisticas();
    actualizarSelectorPelicula();
    actualizarPromedios();

    alert("Todas las películas han sido eliminadas.");
  }
});

// === Eliminar todas las puntuaciones ===
function eliminarTodasLasPuntuaciones() {
  if (confirm("¿Estás seguro que querés borrar TODAS las puntuaciones?\nEsta acción no se puede deshacer.")) {
    localStorage.removeItem("puntuaciones");
    actualizarPromedios();
    alert("Las puntuaciones han sido eliminadas.");
  }
}
