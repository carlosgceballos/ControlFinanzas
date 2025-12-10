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

  configurarEventos() {
    var self = this;
    
    var btnNuevo = document.getElementById('btn-nuevo-presupuesto');
    if (btnNuevo) {
      btnNuevo.addEventListener('click', function() {
        self.mostrarFormularioPresupuesto();
      });
    }
  }

  configurarFiltroTipo() {
    var self = this;
    var selectTipo = document.getElementById('budget-type');
    
    if (selectTipo) {
      selectTipo.addEventListener('change', function() {
        self.tipoFiltro = this.value;
        self.mostrarPresupuestosBasico();
      });
    }
  }

  mostrarPresupuestosBasico() {
    var self = this;
    var budgetList = document.getElementById('budget-list');
    if (!budgetList) return;

    budgetList.innerHTML = '<p>Cargando presupuestos...</p>';

    this.presupuestoService.obtenerPresupuestoPorPeriodo(this.mesActual, this.anioActual)
      .then(function(presupuestos) {
        // Filtrar por tipo si es necesario
        if (self.tipoFiltro) {
          presupuestos = presupuestos.filter(function(p) {
            return p.tipo === self.tipoFiltro;
          });
        }
        
        self.categoriaService.obtenerCategorias()
          .then(function(categorias) {
            self.mostrarListaBasica(presupuestos, categorias);
          });
      });
  }

  mostrarListaBasica(presupuestos, categorias) {
    var budgetList = document.getElementById('budget-list');
    if (!budgetList) return;

    if (presupuestos.length === 0) {
      budgetList.innerHTML = '<p>No hay presupuestos ' + this.tipoFiltro + 'es para este periodo</p>';
      return;
    }

    // Crear mapa de categorias para acceso rapido
    var categoriasMap = {};
    for (var i = 0; i < categorias.length; i++) {
      categoriasMap[categorias[i].id] = categorias[i];
    }

    var html = '';
    for (var j = 0; j < presupuestos.length; j++) {
      var presupuesto = presupuestos[j];
      var categoria = categoriasMap[presupuesto.categoria];
      
      var infoPeriodo = this.generarInfoPeriodo(presupuesto);
      
      html += 
        '<div class="budget-item">' +
          '<div class="budget-info">' +
            '<div class="budget-category">' + 
              (categoria ? categoria.nombre : 'Categoria ' + presupuesto.categoria) + 
            '</div>' +
            infoPeriodo +
            '<div class="budget-amounts">' +
              '<span>Presupuesto: $' + presupuesto.monto.toFixed(2) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="budget-actions">' +
            '<button class="btn btn-secondary btn-small" data-id="' + presupuesto.id + '">Editar</button>' +
            '<button class="btn btn-danger btn-small" data-id="' + presupuesto.id + '">Eliminar</button>' +
          '</div>' +
        '</div>';
    }

    budgetList.innerHTML = html;
    this.configurarBotonesAccion(budgetList);
  }

  generarInfoPeriodo(presupuesto) {
    var meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    var infoPeriodo = '';
    
    if (presupuesto.tipo === 'mensual') {
      var partes = presupuesto.periodo.split('-');
      var inicioMes = parseInt(partes[1]);
      var inicioAnio = parseInt(partes[0]);
      
      if (presupuesto.repeticion === 'recurrente') {
        infoPeriodo = '<span class="budget-period">Mensual recurrente desde ' + 
                      meses[inicioMes-1] + ' ' + inicioAnio + '</span>';
      } else if (presupuesto.mesFin && presupuesto.anioFin) {
        infoPeriodo = '<span class="budget-period">Mensual de ' + 
                      meses[inicioMes-1] + ' ' + inicioAnio + ' a ' + 
                      meses[presupuesto.mesFin-1] + ' ' + presupuesto.anioFin + '</span>';
      } else {
        infoPeriodo = '<span class="budget-period">Solo ' + 
                      meses[inicioMes-1] + ' ' + inicioAnio + '</span>';
      }
    } else if (presupuesto.tipo === 'anual') {
      var partes = presupuesto.periodo.split('-');
      var anio = parseInt(partes[0]);
      infoPeriodo = '<span class="budget-period">Anual ' + anio + '</span>';
    }
    
    return infoPeriodo;
  }

  configurarBotonesAccion(budgetList) {
    var self = this;
    var botonesEditar = budgetList.querySelectorAll('.btn-secondary');
    var botonesEliminar = budgetList.querySelectorAll('.btn-danger');

    for (var k = 0; k < botonesEditar.length; k++) {
      botonesEditar[k].addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-id'));
        self.editarPresupuesto(id);
      });
    }

    for (var l = 0; l < botonesEliminar.length; l++) {
      botonesEliminar[l].addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-id'));
        self.eliminarPresupuesto(id);
      });
    }
  }

    mostrarFormularioPresupuesto(presupuestoId) {
    var self = this;
    var titulo = presupuestoId ? 'Editar Presupuesto' : 'Nuevo Presupuesto';
    
    this.categoriaService.obtenerCategorias()
      .then(function(categorias) {
        var categoriasOptions = self.generarOpcionesCategorias(categorias);
        var mesesOptions = self.generarOpcionesMeses();
        var formHTML = self.construirFormularioHTML(categoriasOptions, mesesOptions, presupuestoId);
        
        self.modal.abrir(titulo, formHTML);
        self.configurarFormulario(presupuestoId);
      });
  }

  generarOpcionesCategorias(categorias) {
    var options = '';
    for (var i = 0; i < categorias.length; i++) {
      options += '<option value="' + categorias[i].id + '">' + 
                 categorias[i].nombre + '</option>';
    }
    return options;
  }

  generarOpcionesMeses() {
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var options = '';
    for (var m = 0; m < meses.length; m++) {
      options += '<option value="' + (m + 1) + '">' + meses[m] + '</option>';
    }
    return options;
  }

  construirFormularioHTML(categoriasOptions, mesesOptions, esEdicion) {
    return '<div class="form-group">' +
             '<label for="presupuesto-tipo">Tipo de Presupuesto</label>' +
             '<select id="presupuesto-tipo" class="form-select" required>' +
               '<option value="mensual">Mensual</option>' +
               '<option value="anual">Anual</option>' +
             '</select>' +
           '</div>' +
           '<div class="form-group">' +
             '<label for="presupuesto-categoria">Categoria</label>' +
             '<select id="presupuesto-categoria" class="form-select" required>' +
               '<option value="">Seleccione una categoria</option>' +
               categoriasOptions +
             '</select>' +
           '</div>' +
           '<div class="form-group">' +
             '<label for="presupuesto-monto">Monto Presupuestado</label>' +
             '<input type="number" id="presupuesto-monto" class="form-input" ' +
                    'min="0.01" step="0.01" required>' +
           '</div>' +
           this.construirCamposMensuales(mesesOptions) +
           this.construirCamposAnuales() +
           '<div class="form-actions">' +
             '<button class="btn btn-secondary" id="btn-cancelar-presupuesto">Cancelar</button>' +
             '<button class="btn btn-primary" id="btn-guardar-presupuesto">' +
               (esEdicion ? 'Actualizar' : 'Guardar') +
             '</button>' +
           '</div>';
  }

  construirCamposMensuales(mesesOptions) {
    return '<div id="presupuesto-mensual-fields">' +
             '<div class="form-group">' +
               '<label for="presupuesto-repeticion">Repeticion Mensual</label>' +
               '<select id="presupuesto-repeticion" class="form-select" required>' +
                 '<option value="unico">Solo este mes</option>' +
                 '<option value="recurrente">Recurrente (cada mes)</option>' +
                 '<option value="periodo">Durante un periodo especifico</option>' +
               '</select>' +
             '</div>' +
             '<div class="form-group">' +
               '<label for="presupuesto-mes-inicio">Mes de Inicio</label>' +
               '<select id="presupuesto-mes-inicio" class="form-select" required>' +
                 mesesOptions +
               '</select>' +
             '</div>' +
             '<div id="presupuesto-periodo-fields" style="display:none;">' +
               '<div class="form-group">' +
                 '<label for="presupuesto-mes-fin">Mes Final</label>' +
                 '<select id="presupuesto-mes-fin" class="form-select">' +
                   mesesOptions +
                 '</select>' +
               '</div>' +
               '<div class="form-group">' +
                 '<label for="presupuesto-anio-fin">Año Final</label>' +
                 '<input type="number" id="presupuesto-anio-fin" class="form-input" ' +
                        'min="2020" max="2030" value="' + this.anioActual + '">' +
               '</div>' +
             '</div>' +
             '<div class="form-group">' +
               '<label for="presupuesto-anio-inicio">Año de Inicio</label>' +
               '<input type="number" id="presupuesto-anio-inicio" class="form-input" ' +
                      'min="2020" max="2030" value="' + this.anioActual + '" required>' +
             '</div>' +
           '</div>';
  }

  construirCamposAnuales() {
    return '<div id="presupuesto-anual-fields" style="display:none;">' +
             '<div class="form-group">' +
               '<label for="presupuesto-anio-anual">Año</label>' +
               '<input type="number" id="presupuesto-anio-anual" class="form-input" ' +
                      'min="2020" max="2030" value="' + this.anioActual + '" required>' +
             '</div>' +
           '</div>';
  }
  
}