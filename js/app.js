// Punto de entrada principal de la aplicacion
class App {
    constructor() {
        this.seccionActual = 'dashboard';
        this.inicializar();
    }

    inicializar() {
        this.configurarNavegacion();
        console.log('Aplicacion inicializada correctamente');
    }

    configurarNavegacion() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const seccion = link.getAttribute('data-section');
                this.cambiarSeccion(seccion);
            });
        });
    }

    cambiarSeccion(nombreSeccion) {
        // Ocultar todas las secciones
        const secciones = document.querySelectorAll('.content-section');
        secciones.forEach(seccion => {
            seccion.classList.remove('active');
        });

        // Mostrar seccion seleccionada
        const seccionActiva = document.getElementById(nombreSeccion);
        if (seccionActiva) {
            seccionActiva.classList.add('active');
        }

        // Actualizar navegacion activa
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === nombreSeccion) {
                link.classList.add('active');
            }
        });

        this.seccionActual = nombreSeccion;
        console.log(`Seccion cambiada a: ${nombreSeccion}`);
    }
}

// Inicializar la aplicacion cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; // Para debugging en consola
});