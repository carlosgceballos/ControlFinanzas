class PresupuestosUI {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.modal = app.modal;
    this.categoriaService = app.categoriaService;
    this.presupuestoService = app.presupuestoService;
    
    this.mesActual = new Date().getMonth() + 1;
    this.anioActual = new Date().getFullYear();
    this.tipoFiltro = 'mensual';
  }

  inicializar() {
    this.configurarEventos();
    this.cargarSelectoresPeriodo();
    this.configurarFiltroTipo();
    this.configurarCambiosPeriodo();
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

    selectMes.innerHTML = '<option value="">Todos los meses</option>';
    for (var i = 0; i < meses.length; i++) {
      var option = document.createElement('option');
      option.value = i + 1;
      option.textContent = meses[i];
      if (i + 1 === this.mesActual) {
        option.selected = true;
      }
      selectMes.appendChild(option);
    }

    selectAnio.innerHTML = '<option value="">Todos los años</option>';
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

  configurarCambiosPeriodo() {
    var self = this;
    
    var selectMes = document.getElementById('budget-month');
    var selectAnio = document.getElementById('budget-year');
    
    if (selectMes) {
      selectMes.addEventListener('change', function() {
        self.mostrarPresupuestosBasico();
      });
    }
    
    if (selectAnio) {
      selectAnio.addEventListener('change', function() {
        self.mostrarPresupuestosBasico();
      });
    }
  }

  obtenerPeriodoSeleccionado() {
    var selectMes = document.getElementById('budget-month');
    var selectAnio = document.getElementById('budget-year');
    
    var mes = selectMes ? parseInt(selectMes.value) : null;
    var anio = selectAnio ? parseInt(selectAnio.value) : null;

    // Convertir a null si es NaN o vacio
    if (!mes || isNaN(mes)) {
      mes = null;
    }
    if (!anio || isNaN(anio)) {
      anio = null;
    }

    return { mes: mes, anio: anio };
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

    var periodo = this.obtenerPeriodoSeleccionado();

    this.presupuestoService.obtenerPresupuestos()
      .then(function(presupuestos) {
        // Filtrar por periodo si hay filtros activos
        var presupuestosFiltrados = self.filtrarPorPeriodo(presupuestos, periodo.mes, periodo.anio);
        
        // Filtrar por tipo si es necesario
        if (self.tipoFiltro) {
          presupuestosFiltrados = presupuestosFiltrados.filter(function(p) {
            return p.tipo === self.tipoFiltro;
          });
        }
        
        self.categoriaService.obtenerCategorias()
          .then(function(categorias) {
            self.mostrarListaBasica(presupuestosFiltrados, categorias);
          });
      });
  }

  // Filtrar presupuestos segun mes y/o año
  filtrarPorPeriodo(presupuestos, mes, anio) {
    var self = this;
    
    // Si no hay filtros, retornar todos
    if (!mes && !anio) {
      return presupuestos;
    }
    
    return presupuestos.filter(function(p) {
      return self.presupuestoAplicaAFiltro(p, mes, anio);
    });
  }

  // NUEVO: Verificar si un presupuesto aplica al filtro
  presupuestoAplicaAFiltro(presupuesto, mes, anio) {
    var partes = presupuesto.periodo.split('-');
    var inicioAnio = parseInt(partes[0]);
    var inicioMes = parseInt(partes[1]);
    
    if (presupuesto.tipo === 'anual') {
      // Presupuesto anual: solo filtrar por año
      if (anio && inicioAnio !== anio) {
        return false;
      }
      return true;
    } else if (presupuesto.tipo === 'mensual') {
      // Crear fechas para comparacion
      var fechaInicio = new Date(inicioAnio, inicioMes - 1, 1);
      
      // Si hay mes y año, verificar que el presupuesto aplique a esa fecha especifica
      if (mes && anio) {
        var fechaConsulta = new Date(anio, mes - 1, 1);
        return this.presupuestoMensualAplicaAFecha(presupuesto, fechaConsulta, fechaInicio);
      }
      
      // Si solo hay año, verificar que el presupuesto tenga actividad en ese año
      if (anio && !mes) {
        return this.presupuestoMensualAplicaAAnio(presupuesto, anio, inicioAnio);
      }
      
      // Si solo hay mes (sin año), mostrar presupuestos de ese mes de cualquier año
      if (mes && !anio) {
        return this.presupuestoMensualAplicaAMes(presupuesto, mes, inicioMes);
      }
    }
    
    return true;
  }

  // Verificar si presupuesto mensual aplica a una fecha especifica
  presupuestoMensualAplicaAFecha(presupuesto, fechaConsulta, fechaInicio) {
    if (fechaConsulta < fechaInicio) {
      return false;
    }
    
    // Presupuesto unico
    if (!presupuesto.repeticion || presupuesto.repeticion === 'unico') {
      return fechaConsulta.getMonth() === fechaInicio.getMonth() && 
             fechaConsulta.getFullYear() === fechaInicio.getFullYear();
    }
    
    // Presupuesto recurrente
    if (presupuesto.repeticion === 'recurrente') {
      return fechaConsulta >= fechaInicio;
    }
    
    // Presupuesto de periodo
    if (presupuesto.repeticion === 'periodo' && presupuesto.mesFin && presupuesto.anioFin) {
      var fechaFin = new Date(presupuesto.anioFin, presupuesto.mesFin - 1, 30);
      return fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin;
    }
    
    return false;
  }

  // Verificar si presupuesto mensual tiene actividad en un año especifico
  presupuestoMensualAplicaAAnio(presupuesto, anioConsulta, inicioAnio) {
    // Presupuesto unico
    if (!presupuesto.repeticion || presupuesto.repeticion === 'unico') {
      return inicioAnio === anioConsulta;
    }
    
    // Presupuesto recurrente (aplica desde su año de inicio en adelante)
    if (presupuesto.repeticion === 'recurrente') {
      return anioConsulta >= inicioAnio;
    }
    
    // Presupuesto de periodo
    if (presupuesto.repeticion === 'periodo' && presupuesto.mesFin && presupuesto.anioFin) {
      return anioConsulta >= inicioAnio && anioConsulta <= presupuesto.anioFin;
    }
    
    return false;
  }

  // NUEVO: Verificar si presupuesto aplica a un mes (cualquier año)
  presupuestoMensualAplicaAMes(presupuesto, mesConsulta, inicioMes) {
    // Presupuesto unico
    if (!presupuesto.repeticion || presupuesto.repeticion === 'unico') {
      return inicioMes === mesConsulta;
    }
    
    // Presupuesto recurrente (cada mes desde inicio, aplica a todos los meses)
    if (presupuesto.repeticion === 'recurrente') {
      return true;
    }
    
    // Presupuesto de periodo (verificar si el mes esta en el rango)
    if (presupuesto.repeticion === 'periodo' && presupuesto.mesFin) {
      // Si el periodo esta en el mismo año, verificar rango simple
      if (presupuesto.anioFin === parseInt(presupuesto.periodo.split('-')[0])) {
        return mesConsulta >= inicioMes && mesConsulta <= presupuesto.mesFin;
      }
      // Si cruza años, aplica a todos los meses
      return true;
    }
    
    return false;
  }

  mostrarListaBasica(presupuestos, categorias) {
    var budgetList = document.getElementById('budget-list');
    if (!budgetList) return;

    if (presupuestos.length === 0) {
      budgetList.innerHTML = '<p>No hay presupuestos ' + (this.tipoFiltro || '') + ' para este periodo</p>';
      return;
    }

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
  
  configurarFormulario(presupuestoId) {
    this.configurarCambioTipo();
    this.configurarCambioRepeticion();
    this.establecerValoresDefecto(presupuestoId);
    this.configurarBotonesFormulario(presupuestoId);
  }

  configurarCambioTipo() {
    var selectTipo = document.getElementById('presupuesto-tipo');
    if (!selectTipo) return;
    
    selectTipo.addEventListener('change', function() {
      var tipo = this.value;
      var camposMensual = document.getElementById('presupuesto-mensual-fields');
      var camposAnual = document.getElementById('presupuesto-anual-fields');
      
      if (tipo === 'mensual') {
        camposMensual.style.display = 'block';
        camposAnual.style.display = 'none';
      } else {
        camposMensual.style.display = 'none';
        camposAnual.style.display = 'block';
      }
    });
  }

  configurarCambioRepeticion() {
    var selectRepeticion = document.getElementById('presupuesto-repeticion');
    if (!selectRepeticion) return;
    
    selectRepeticion.addEventListener('change', function() {
      var repeticion = this.value;
      var camposPeriodo = document.getElementById('presupuesto-periodo-fields');
      
      if (repeticion === 'periodo') {
        camposPeriodo.style.display = 'block';
      } else {
        camposPeriodo.style.display = 'none';
      }
    });
  }

  establecerValoresDefecto(presupuestoId) {
    if (presupuestoId) {
      this.cargarDatosPresupuesto(presupuestoId);
    } else {
      document.getElementById('presupuesto-mes-inicio').value = this.mesActual;
      document.getElementById('presupuesto-mes-fin').value = this.mesActual;
    }
  }

  configurarBotonesFormulario(presupuestoId) {
    var self = this;
    
    setTimeout(function() {
      var btnGuardar = document.getElementById('btn-guardar-presupuesto');
      var btnCancelar = document.getElementById('btn-cancelar-presupuesto');
      
      if (btnGuardar) {
        btnGuardar.addEventListener('click', function() {
          if (presupuestoId) {
            self.actualizarPresupuesto(presupuestoId);
          } else {
            self.guardarPresupuesto();
          }
        });
      }
      
      if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
          self.modal.cerrar();
        });
      }
    }, 100);
  }

  cargarDatosPresupuesto(id) {
    var self = this;
    
    this.presupuestoService.obtenerPresupuestos()
      .then(function(presupuestos) {
        for (var i = 0; i < presupuestos.length; i++) {
          if (presupuestos[i].id === id) {
            self.llenarFormularioEdicion(presupuestos[i]);
            break;
          }
        }
      });
  }

  llenarFormularioEdicion(presupuesto) {
    document.getElementById('presupuesto-tipo').value = presupuesto.tipo || 'mensual';
    
    var eventTipo = new Event('change');
    document.getElementById('presupuesto-tipo').dispatchEvent(eventTipo);
    
    document.getElementById('presupuesto-categoria').value = presupuesto.categoria;
    document.getElementById('presupuesto-monto').value = presupuesto.monto;
    
    var partes = presupuesto.periodo.split('-');
    if (partes.length === 2) {
      var inicioMes = parseInt(partes[1]);
      var inicioAnio = parseInt(partes[0]);
      
      if (presupuesto.tipo === 'mensual') {
        this.cargarDatosMensual(presupuesto, inicioMes, inicioAnio);
      } else if (presupuesto.tipo === 'anual') {
        document.getElementById('presupuesto-anio-anual').value = inicioAnio;
      }
    }
  }

  cargarDatosMensual(presupuesto, inicioMes, inicioAnio) {
    document.getElementById('presupuesto-mes-inicio').value = inicioMes;
    document.getElementById('presupuesto-anio-inicio').value = inicioAnio;
    
    var repeticion = 'unico';
    if (presupuesto.repeticion === 'recurrente') {
      repeticion = 'recurrente';
    } else if (presupuesto.mesFin && presupuesto.anioFin) {
      repeticion = 'periodo';
    }
    
    document.getElementById('presupuesto-repeticion').value = repeticion;
    
    var eventRep = new Event('change');
    document.getElementById('presupuesto-repeticion').dispatchEvent(eventRep);
    
    if (repeticion === 'periodo') {
      document.getElementById('presupuesto-mes-fin').value = presupuesto.mesFin;
      document.getElementById('presupuesto-anio-fin').value = presupuesto.anioFin;
    }
  }

  editarPresupuesto(id) {
    this.mostrarFormularioPresupuesto(id);
  }

  guardarPresupuesto() {
    var datosPresupuesto = this.recolectarDatosFormulario();
    
    if (!this.validarDatosPresupuesto(datosPresupuesto)) {
      return;
    }

    var self = this;
    this.presupuestoService.crearPresupuesto(datosPresupuesto)
      .then(function() {
        self.modal.cerrar();
        self.mostrarPresupuestosBasico();
        alert('Presupuesto creado correctamente');
      })
      .catch(function(error) {
        alert('Error al crear presupuesto: ' + error.message);
      });
  }

  recolectarDatosFormulario() {
    var tipo = document.getElementById('presupuesto-tipo').value;
    var categoria = document.getElementById('presupuesto-categoria').value;
    var monto = parseFloat(document.getElementById('presupuesto-monto').value);
    
    var datosPresupuesto = {
      tipo: tipo,
      categoria: parseInt(categoria),
      monto: monto
    };

    if (tipo === 'mensual') {
      this.agregarDatosMensual(datosPresupuesto);
    } else if (tipo === 'anual') {
      this.agregarDatosAnual(datosPresupuesto);
    }

    return datosPresupuesto;
  }

  agregarDatosMensual(datos) {
    var repeticion = document.getElementById('presupuesto-repeticion').value;
    var mesInicio = parseInt(document.getElementById('presupuesto-mes-inicio').value);
    var anioInicio = parseInt(document.getElementById('presupuesto-anio-inicio').value);
    
    datos.periodo = anioInicio + '-' + (mesInicio < 10 ? '0' + mesInicio : mesInicio);
    datos.repeticion = repeticion;
    
    if (repeticion === 'periodo') {
      datos.mesFin = parseInt(document.getElementById('presupuesto-mes-fin').value);
      datos.anioFin = parseInt(document.getElementById('presupuesto-anio-fin').value);
    }
  }

  agregarDatosAnual(datos) {
    var anio = parseInt(document.getElementById('presupuesto-anio-anual').value);
    datos.periodo = anio + '-01';
  }

  validarDatosPresupuesto(datos) {
    if (!datos.tipo || !datos.categoria || !datos.monto) {
      alert('Por favor complete todos los campos');
      return false;
    }

    if (datos.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return false;
    }

    if (datos.tipo === 'mensual' && datos.repeticion === 'periodo') {
      if (!this.validarPeriodoMensual(datos)) {
        return false;
      }
    }

    return true;
  }

  validarPeriodoMensual(datos) {
    var partes = datos.periodo.split('-');
    var anioInicio = parseInt(partes[0]);
    var mesInicio = parseInt(partes[1]);
    
    var fechaInicio = new Date(anioInicio, mesInicio - 1, 1);
    var fechaFin = new Date(datos.anioFin, datos.mesFin - 1, 30);
    
    if (fechaFin < fechaInicio) {
      alert('La fecha final debe ser posterior a la fecha inicial');
      return false;
    }
    
    return true;
  }

  actualizarPresupuesto(id) {
    var datosPresupuesto = this.recolectarDatosFormulario();
    
    if (!this.validarDatosPresupuesto(datosPresupuesto)) {
      return;
    }

    this.limpiarCamposInnecesarios(datosPresupuesto);

    var self = this;
    this.presupuestoService.actualizarPresupuesto(id, datosPresupuesto)
      .then(function() {
        self.modal.cerrar();
        self.mostrarPresupuestosBasico();
        alert('Presupuesto actualizado correctamente');
      })
      .catch(function(error) {
        alert('Error al actualizar presupuesto: ' + error.message);
      });
  }

  limpiarCamposInnecesarios(datos) {
    if (datos.tipo === 'mensual') {
      if (datos.repeticion !== 'periodo') {
        datos.mesFin = null;
        datos.anioFin = null;
      }
    } else if (datos.tipo === 'anual') {
      datos.repeticion = null;
      datos.mesFin = null;
      datos.anioFin = null;
    }
  }

  eliminarPresupuesto(id) {
    if (!confirm('¿Estas seguro de eliminar este presupuesto?')) {
      return;
    }

    var self = this;
    this.presupuestoService.eliminarPresupuesto(id)
      .then(function() {
        self.mostrarPresupuestosBasico();
        alert('Presupuesto eliminado correctamente');
      })
      .catch(function(error) {
        alert('Error al eliminar presupuesto: ' + error.message);
      });
  }
}