// funciones.js
console.log("✅ funciones.js cargado correctamente");

let parametros = new URLSearchParams(window.location.search);
let idPelicula = parametros.get("id");
console.log("ID Película:", idPelicula);

// Cargar película
fetch("/api/peliculas/" + idPelicula)
    .then(res => res.json())
    .then(pelicula => {
        document.getElementById("txtTitulo").textContent = pelicula.titulo;
        document.getElementById("txtGenero").textContent = pelicula.genero || "Género no disponible";
        document.getElementById("txtSinopsis").textContent = pelicula.sinopsis || "Sin sinopsis disponible";
        document.getElementById("imgPoster").src = pelicula.imagen || "https://via.placeholder.com/170x250";
        document.getElementById("imgPoster").alt = pelicula.titulo;
    })
    .catch(error => console.error("Error al cargar película:", error));

// Cargar funciones
fetch("/api/funciones/" + idPelicula)
    .then(res => res.json())
    .then(funciones => {
        let contenedor = document.getElementById("listaHorarios");
        contenedor.innerHTML = "";
        if (funciones.length === 0) {
            contenedor.innerHTML = "<p>No hay funciones disponibles para hoy.</p>";
            return;
        }
        funciones.forEach(f => {
            console.log("Función:", f);
            let div = document.createElement("div");
            div.className = "btn-horario";
            div.textContent = f.horario;
            // ✅ AQUÍ ESTÁ LA CLAVE: PASAMOS LA HORA
            div.onclick = function() {
                let url = "Asientos.html?id=" + idPelicula +
                          "&funcion=" + f.id +
                          "&hora=" + encodeURIComponent(f.horario);
                console.log("Redirigiendo a:", url);
                window.location.href = url;
            };
            contenedor.appendChild(div);
        });
    })
    .catch(error => {
        console.error("Error al cargar funciones:", error);
        document.getElementById("listaHorarios").innerHTML = "<p style='color:red;'>Error al cargar los horarios.</p>";
    });