let parametros = new URLSearchParams(window.location.search);
let id = parametros.get("id");

let titulo = document.getElementById("titulo");
let genero = document.getElementById("genero");
let duracion = document.getElementById("duracion");
let sinopsis = document.getElementById("sinopsis");
let imagen = document.getElementById("imagen");

let contenedorHorarios = document.getElementById("horarios");

async function cargarDetalle() {

    let respuesta = await fetch("/api/detalle/" + id);

    let datos = await respuesta.json();

    titulo.textContent = datos.pelicula.titulo;
    genero.textContent = datos.pelicula.genero;
    duracion.textContent = datos.pelicula.duracion;
    sinopsis.textContent = datos.pelicula.sinopsis;
    imagen.src = datos.pelicula.imagen;

    contenedorHorarios.innerHTML = "";

    for (let i = 0; i < datos.funciones.length; i++) {

        let boton = document.createElement("button");

        boton.textContent = datos.funciones[i].horario;

        boton.onclick = function () {

            location.href =
            "asientos.html?id=" +
            id +
            "&funcion=" +
            datos.funciones[i].id;

        };

        contenedorHorarios.appendChild(boton);

    }

}

cargarDetalle();