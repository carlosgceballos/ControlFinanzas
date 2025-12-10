class PresupuestosUI {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.modal = app.modal;
    this.categoriaService = app.categoriaService;
    this.presupuestoService = new PresupuestoService(app.db);
    
    this.mesActual = new Date().getMonth() + 1;
    this.anioActual = new Date().getFullYear();
    this.tipoFiltro = 'mensual';
  }

  inicializar() {
    this.configurarEventos();
    this.cargarSelectoresPeriodo();
    this.configurarFiltroTipo();
    this.mostrarPresupuestosBasico();
  }

  cargarSelectoresPeriodo() {
    var selectMes = document.getElementById('budget-month');
    var selectAnio = document.getElementById('budget-year');
    
    if (!selectMes || !selectAnio) return;

    // Cargar meses
    var meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    selectMes.innerHTML = '';
    for (var i = 0; i < meses.length; i++) {
      var option = document.createElement('option');
      option.value = i + 1;
      option.textContent = meses[i];
      if (i + 1 === this.mesActual) {
        option.selected = true;
      }
      selectMes.appendChild(option);
    }

    // Cargar años (rango 2020-2030)
    selectAnio.innerHTML = '';
    for (var j = 2020; j <= 2030; j++) {
      var optionAnio = document.createElement('option');
      optionAnio.value = j;
      optionAnio.textContent = j;
      if (j === this.anioActual) {
        optionAnio.selected = true;
      }
      selectAnio.appendChild(optionAnio);
    }
  }
}