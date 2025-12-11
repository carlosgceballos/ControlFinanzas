// Aplicacion principal - Sistema de Finanzas Personales
class App {
  constructor() {
    this.seccionActual = 'dashboard';
    this.modal = new ModalManager();
    this.db = new FinanzasDB();
    
    // Servicios
    this.categoriaService = null;
    this.transaccionService = null;
    this.presupuestoService = null;
    
    // Componentes UI
    this.categoriasUI = null;
    this.transaccionesUI = null;
    this.presupuestosUI = null;
    this.dashboardUI = null;
    
    this.inicializar();
  }

  async inicializar() {
    try {
      await this.db.inicializar();
      await this.db.inicializarCategoriasPredefinidas();
      
      // Inicializar servicios
      this.categoriaService = new CategoriaService(this.db);
      this.transaccionService = new TransaccionService(this.db);
      this.presupuestoService = new PresupuestoService(this.db);
      
      // Inicializar componentes UI
      this.categoriasUI = new CategoriasUI(this);
      this.transaccionesUI = new TransaccionesUI(this);
      this.presupuestosUI = new PresupuestosUI(this);
      this.dashboardUI = new DashboardUI(this);
      
      this.configurarNavegacion();
      
      // Inicializar dashboard por defecto
      this.dashboardUI.inicializar();
      
      console.log('Aplicacion inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la aplicacion:', error);
    }
  }

  configurarNavegacion() {
    var self = this;
    var navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var seccion = this.getAttribute('data-section');
        self.cambiarSeccion(seccion);
      });
    });
  }

  cambiarSeccion(nombreSeccion) {
    // Ocultar todas las secciones
    var secciones = document.querySelectorAll('.content-section');
    secciones.forEach(function(seccion) {
      seccion.classList.remove('active');
    });

    // Mostrar seccion seleccionada
    var seccionActiva = document.getElementById(nombreSeccion);
    if (seccionActiva) {
      seccionActiva.classList.add('active');
    }

    // Actualizar navegacion activa
    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === nombreSeccion) {
        link.classList.add('active');
      }
    });

    this.seccionActual = nombreSeccion;
    
    // Inicializar UI de la seccion actual
    switch(nombreSeccion) {
      case 'categorias':
        if (this.categoriasUI) {
          this.categoriasUI.inicializar();
        }
        break;
      case 'transacciones':
        if (this.transaccionesUI) {
          this.transaccionesUI.inicializar();
        }
        break;
      case 'presupuestos':
        if (this.presupuestosUI) {
          this.presupuestosUI.inicializar();
        }
        break;
      case 'dashboard':
        if (this.dashboardUI) {
          this.dashboardUI.actualizarDashboard();
        }
        break;
    }
  }
}

// Inicializar aplicacion cuando el DOM este listo
document.addEventListener('DOMContentLoaded', function() {
  var app = new App();
  window.app = app;
});