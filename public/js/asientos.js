let parametros = new URLSearchParams(window.location.search);
let idPelicula = parametros.get("id");
let idFuncion = parametros.get("funcion");
let hora = parametros.get("hora");
console.log("Parametros en Asientos:", { idPelicula, idFuncion, hora });


document.getElementById("volver").href = "Funciones.html?id=" + idPelicula;

let sala = document.getElementById("sala");
let textoAsientos = document.getElementById("asientosSeleccionados");
let textoTotal = document.getElementById("total");

let seleccionados = [];
let precio = 20;

async function cargarAsientos() {
    try {
        let respuesta = await fetch("/api/asientos/" + idFuncion);
        let datos = await respuesta.json();
        console.log("Datos de asientos:", datos);

        sala.innerHTML = "";
        let letras = ["A","B","C","D","E","F","G","H"];

        let matriz = datos.matriz || [];
        for (let fila = 0; fila < 8; fila++) {
            for (let columna = 0; columna < 8; columna++) {
                let boton = document.createElement("button");
                boton.className = "asiento";
                boton.textContent = letras[fila] + (columna + 1);

                let ocupado = (matriz[fila] && matriz[fila][columna] === 1);
                if (ocupado) {
                    boton.classList.add("ocupado");
                } else {
                    boton.classList.add("disponible");
                    boton.onclick = function() {
                        if (boton.classList.contains("seleccionado")) {
                            boton.classList.remove("seleccionado");
                            boton.classList.add("disponible");
                            for (let i = 0; i < seleccionados.length; i++) {
                                if (seleccionados[i].fila == fila && seleccionados[i].columna == columna) {
                                    seleccionados.splice(i, 1);
                                    break;
                                }
                            }
                        } else {
                            boton.classList.remove("disponible");
                            boton.classList.add("seleccionado");
                            seleccionados.push({
                                fila: fila,
                                columna: columna,
                                nombre: letras[fila] + (columna + 1)
                            });
                        }
                        actualizar();
                    };
                }
                sala.appendChild(boton);
            }
        }
        actualizar();
    } catch (error) {
        console.error("Error al cargar asientos:", error);
        sala.innerHTML = "<p style='color:red;'>Error al cargar los asientos.</p>";
    }
}

function actualizar() {
    if (seleccionados.length === 0) {
        textoAsientos.textContent = "Asientos: Ninguno";
        textoTotal.textContent = "Total: 0 Bs";
        return;
    }
    let nombres = seleccionados.map(function(a) { return a.nombre; });
    textoAsientos.textContent = "Asientos: " + nombres.join(", ");
    textoTotal.textContent = "Total: " + (seleccionados.length * precio) + " Bs";
}

document.getElementById("continuar").onclick = function() {
    if (seleccionados.length === 0) {
        alert("Seleccione al menos un asiento");
        return;
    }

    let reserva = {
        idPelicula: idPelicula,
        idFuncion: idFuncion,
        hora: hora,
        asientos: seleccionados,
        total: seleccionados.length * precio
    };
    console.log("Guardando reserva en localStorage:", reserva);
    localStorage.setItem("reserva", JSON.stringify(reserva));
    

    location.href = "Compra.html";
};

cargarAsientos();