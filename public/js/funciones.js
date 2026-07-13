let parametros = new URLSearchParams(window.location.search);

let idPelicula = parametros.get("id");

fetch("/api/peliculas/" + idPelicula)

.then(function(respuesta){

return respuesta.json();

})

.then(function(pelicula){

document.getElementById("txtTitulo").textContent =
pelicula.titulo;

document.getElementById("txtGenero").textContent =
pelicula.genero;

document.getElementById("txtDuracion").textContent =
pelicula.duracion;

document.getElementById("txtSinopsis").textContent =
pelicula.sinopsis;

document.getElementById("imgPoster").src =
pelicula.imagen;

if(pelicula.estreno){

document.getElementById("txtEstreno").textContent =
"ESTRENO";

}else{

document.getElementById("txtEstreno").style.display =
"none";

}

});

fetch("/api/funciones/" + idPelicula)

.then(function(respuesta){

return respuesta.json();

})

.then(function(funciones){

let lista =
document.getElementById("listaHorarios");

lista.innerHTML = "";

funciones.forEach(function(funcion){

let boton =
document.createElement("div");

boton.className =
"btn-horario";

boton.textContent =
funcion.horario;

boton.onclick = function(){

// Ajustado con ../ para salir de la carpeta html y encontrar el archivo hermano
window.location.href =
"../Asientos.html?id=" +
idPelicula +
"&funcion=" +
funcion.id +
"&hora=" +
encodeURIComponent(funcion.horario);

};

lista.appendChild(boton);

});

});