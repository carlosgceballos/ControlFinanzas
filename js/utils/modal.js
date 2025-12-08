// Gestor de modales para formularios
class ModalManager {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.btnClose = document.getElementById('modal-close');
        
    this.configurarEventos();
  }

  configurarEventos() {
  // Cerrar con el boton X
    this.btnClose.addEventListener('click', () => this.cerrar());
        
  // Cerrar al hacer clic fuera del modal
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.cerrar();
      }
    });

  // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.cerrar();
      }
    });
  }

  abrir(titulo, contenido) {
    this.modalTitle.textContent = titulo;
    this.modalBody.innerHTML = contenido;
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
  }

  cerrar() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restaurar scroll
        
    // Limpiar contenido despues de la animacion
    setTimeout(() => {
      this.modalBody.innerHTML = '';
      this.modalTitle.textContent = '';
    }, 300);
  }
}