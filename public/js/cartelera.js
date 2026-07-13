fetch("/api/peliculas")
.then(function(respuesta){
return respuesta.json();
})
.then(function(peliculas){
var contenedor = document.getElementById("contenedorPeliculas");
contenedor.innerHTML = "";

peliculas.forEach(function(pelicula){
var tarjeta = document.createElement("div");
tarjeta.className = "tarjeta";
tarjeta.onclick = function(){
// Corregido con la barra diagonal inicial para que apunte a la ruta raiz del servidor
window.location.href = "/Funciones.html?id=" + pelicula.id;
};

var imagen = document.createElement("img");
imagen.src = pelicula.imagen;

var titulo = document.createElement("h3");
titulo.textContent = pelicula.titulo;

tarjeta.appendChild(imagen);

if(pelicula.estreno){
var estreno = document.createElement("div");
estreno.className = "etiqueta-estreno";
estreno.textContent = "ESTRENO";
tarjeta.appendChild(estreno);
}

tarjeta.appendChild(titulo);
contenedor.appendChild(tarjeta);
});
})
.catch(function(){
document.getElementById("contenedorPeliculas").innerHTML = "<h2>No fue posible cargar la cartelera</h2>";
});