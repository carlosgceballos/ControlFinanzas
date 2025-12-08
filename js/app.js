// Punto de entrada principal de la aplicacion
class App {
  constructor() {
    this.seccionActual = 'dashboard';
    this.modal = new ModalManager(); 
    this.inicializar();
  }

  inicializar() {
    this.configurarNavegacion();
    this.probarModal(); 
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


  probarModal() {
  // Buscar todos los botones que abren modales
    const btnNuevaTransaccion = document.getElementById('btn-nueva-transaccion');
    const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
    const btnNuevoPresupuesto = document.getElementById('btn-nuevo-presupuesto');

    if (btnNuevaTransaccion) {
      btnNuevaTransaccion.addEventListener('click', () => {
        this.modal.abrir('Nueva Transacción', '<p>Formulario de transacción aquí...</p>');
      });
    }

    if (btnNuevaCategoria) {
      btnNuevaCategoria.addEventListener('click', () => {
        this.modal.abrir('Nueva Categoría', '<p>Formulario de categoría aquí...</p>');
      });
    }

    if (btnNuevoPresupuesto) {
      btnNuevoPresupuesto.addEventListener('click', () => {
        this.modal.abrir('Nuevo Presupuesto', '<p>Formulario de presupuesto aquí...</p>');
      });
    }
  }
}

// Inicializar la aplicacion cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.app = app; // Para debugging en consola
});