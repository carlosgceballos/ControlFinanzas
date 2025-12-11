class TransaccionesUI {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.modal = app.modal;
    this.categoriaService = app.categoriaService;
    this.transaccionService = new TransaccionService(app.db);
  }

  inicializar() {
    this.configurarEventos();
    this.cargarFiltros();
    this.mostrarTransacciones();
  }

  configurarEventos() {
    var self = this;

    // Boton nueva transaccion
    var btnNueva = document.getElementById('btn-nueva-transaccion');
    if (btnNueva) {
      btnNueva.addEventListener('click', function () {
        self.mostrarFormularioTransaccion();
      });
    }

    // Filtros
    var filtroTipo = document.getElementById('filter-tipo');
    var filtroCategoria = document.getElementById('filter-categoria');
    var filtroBusqueda = document.getElementById('filter-busqueda');

    if (filtroTipo) {
      filtroTipo.addEventListener('change', function () {
        self.mostrarTransacciones();
      });
    }

    if (filtroCategoria) {
      filtroCategoria.addEventListener('change', function () {
        self.mostrarTransacciones();
      });
    }

    if (filtroBusqueda) {
      filtroBusqueda.addEventListener('input', function () {
        self.mostrarTransacciones();
      });
    }
  }

  cargarFiltros() {
    var self = this;
    this.categoriaService.obtenerCategorias()
      .then(function (categorias) {
        var selectCategoria = document.getElementById('filter-categoria');
        if (selectCategoria) {
          selectCategoria.innerHTML = '<option value="">Todas</option>';
          categorias.forEach(function (cat) {
            var option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            selectCategoria.appendChild(option);
          });
        }
      });
  }

  mostrarTransacciones() {
    var self = this;
    var tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    // Limpiar tabla inmediatamente
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Cargando...</td></tr>';

    this.transaccionService.obtenerTransacciones()
      .then(function (transacciones) {
        // Primero obtener categorias
        return self.categoriaService.obtenerCategorias().then(function (categorias) {
          var categoriasMap = {};
          categorias.forEach(function (cat) {
            categoriasMap[cat.id] = cat.nombre;
          });

          // Aplicar filtros
          var filtroTipo = document.getElementById('filter-tipo').value;
          var filtroCategoria = document.getElementById('filter-categoria').value;
          var filtroBusqueda = document.getElementById('filter-busqueda').value.toLowerCase();

          var transaccionesFiltradas = transacciones.filter(function (t) {
            if (filtroTipo && t.tipo !== filtroTipo) {
              return false;
            }

            if (filtroCategoria && t.categoria != filtroCategoria) {
              return false;
            }

            if (filtroBusqueda) {
              var descripcion = t.descripcion ? t.descripcion.toLowerCase() : '';
              var nombreCategoria = categoriasMap[t.categoria] ? categoriasMap[t.categoria].toLowerCase() : '';
              return descripcion.includes(filtroBusqueda) || nombreCategoria.includes(filtroBusqueda);
            }

            return true;
          });

          // Ordenar por fecha (mas reciente primero)
          transaccionesFiltradas.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
          });

          // Limpiar tabla antes de agregar filas
          tbody.innerHTML = '';

          if (transaccionesFiltradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay transacciones</td></tr>';
            return;
          }

          // Crear filas de tabla
          transaccionesFiltradas.forEach(function (transaccion) {
            var fecha = new Date(transaccion.fecha);
            var fechaFormateada = fecha.toLocaleDateString('es-ES');

            var fila = document.createElement('tr');

            fila.innerHTML =
              '<td>' + fechaFormateada + '</td>' +
              '<td><span class="transaction-type ' + transaccion.tipo + '">' +
              (transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso') +
              '</span></td>' +
              '<td>' + (categoriasMap[transaccion.categoria] || 'Desconocida') + '</td>' +
              '<td>' + (transaccion.descripcion || '-') + '</td>' +
              '<td style="font-weight: bold; color: ' +
              (transaccion.tipo === 'ingreso' ? 'var(--income-color)' : 'var(--expense-color)') + '">' +
              '$' + parseFloat(transaccion.monto).toFixed(2) +
              '</td>' +
              '<td class="transaction-actions">' +
              '<button class="btn btn-secondary btn-small" data-id="' + transaccion.id + '">Editar</button>' +
              '<button class="btn btn-danger btn-small" data-id="' + transaccion.id + '">Eliminar</button>' +
              '</td>';

            tbody.appendChild(fila);
          });

          // Agregar eventos a los botones
          var botonesEditar = tbody.querySelectorAll('.btn-secondary');
          var botonesEliminar = tbody.querySelectorAll('.btn-danger');

          botonesEditar.forEach(function (boton) {
            boton.addEventListener('click', function () {
              var id = parseInt(this.getAttribute('data-id'));
              self.editarTransaccion(id);
            });
          });

          botonesEliminar.forEach(function (boton) {
            boton.addEventListener('click', function () {
              var id = parseInt(this.getAttribute('data-id'));
              self.eliminarTransaccion(id);
            });
          });
        });
      })
      .catch(function(error) {
        console.error('Error al mostrar transacciones:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error al cargar transacciones</td></tr>';
      });
  }

  mostrarFormularioTransaccion(transaccionId) {
    var self = this;
    var titulo = transaccionId ? 'Editar Transaccion' : 'Nueva Transaccion';

    // Obtener categorias para el select
    this.categoriaService.obtenerCategorias()
      .then(function (categorias) {
        var categoriasOptions = '';
        categorias.forEach(function (cat) {
          categoriasOptions += '<option value="' + cat.id + '">' + cat.nombre + '</option>';
        });

        var formHTML =
          '<div class="form-group">' 
          +'<label for="transaccion-tipo">Tipo</label>' +'<select id="transaccion-tipo" class="form-select">' +
          '<option value="ingreso">Ingreso</option>' +'<option value="egreso">Egreso</option>' +'</select>' +'</div>' +'<div class="form-group">' +
          '<label for="transaccion-monto">Monto</label>' +
          '<input type="number" id="transaccion-monto" class="form-input" min="0.01" step="0.01" required>' +
          '</div>' + '<div class="form-group">' + '<label for="transaccion-fecha">Fecha</label>' +
          '<input type="date" id="transaccion-fecha" class="form-input" required>' +
          '</div>' + '<div class="form-group">' + '<label for="transaccion-categoria">Categoria</label>' + '<select id="transaccion-categoria" class="form-select" required>' +
          '<option value="">Seleccione una categoria</option>' + categoriasOptions + '</select>' + '</div>' +
          '<div class="form-group">' +
          '<label for="transaccion-descripcion">Descripcion (opcional)</label>' +
          '<textarea id="transaccion-descripcion" class="form-input" rows="3"></textarea>' +
          '</div>' +'<div class="form-actions">' +'<button class="btn btn-secondary" id="btn-cancelar-transaccion">Cancelar</button>' +
          '<button class="btn btn-primary" id="btn-guardar-transaccion">Guardar</button>' +
          '</div>';

        self.modal.abrir(titulo, formHTML);

        // Si es edicion, cargar datos
        if (transaccionId) {
          self.cargarDatosTransaccion(transaccionId);
        } else {
          // Para nueva transaccion, fecha actual por defecto
          document.getElementById('transaccion-fecha').valueAsDate = new Date();
        }

        // Configurar eventos del formulario
        setTimeout(function () {
          var btnGuardar = document.getElementById('btn-guardar-transaccion');
          var btnCancelar = document.getElementById('btn-cancelar-transaccion');

          if (btnGuardar) {
            // Clonar el boton para eliminar listeners previos
            var nuevoGuardar = btnGuardar.cloneNode(true);
            btnGuardar.parentNode.replaceChild(nuevoGuardar, btnGuardar);
            
            nuevoGuardar.addEventListener('click', function () {
              self.guardarTransaccion(transaccionId);
            });
          }

          if (btnCancelar) {
            // Clonar el boton para eliminar listeners previos
            var nuevoCancelar = btnCancelar.cloneNode(true);
            btnCancelar.parentNode.replaceChild(nuevoCancelar, btnCancelar);
            
            nuevoCancelar.addEventListener('click', function () {
              self.modal.cerrar();
            });
          }
        }, 100);
      });
  }

  cargarDatosTransaccion(id) {
    var self = this;
    this.transaccionService.obtenerTransacciones()
      .then(function (transacciones) {
        var transaccion = transacciones.find(function (t) {
          return t.id === id;
        });

        if (transaccion) {
          document.getElementById('transaccion-tipo').value = transaccion.tipo;
          document.getElementById('transaccion-monto').value = transaccion.monto;
          document.getElementById('transaccion-fecha').value = transaccion.fecha.split('T')[0];
          document.getElementById('transaccion-categoria').value = transaccion.categoria;
          document.getElementById('transaccion-descripcion').value = transaccion.descripcion || '';
        }
      });
  }

  guardarTransaccion(id) {
    var tipo = document.getElementById('transaccion-tipo').value;
    var monto = parseFloat(document.getElementById('transaccion-monto').value);
    var fecha = document.getElementById('transaccion-fecha').value;
    var categoria = document.getElementById('transaccion-categoria').value;
    var descripcion = document.getElementById('transaccion-descripcion').value;

    // Validaciones
    if (!tipo || !monto || !fecha || !categoria) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    var datosTransaccion = {
      tipo: tipo,
      monto: monto,
      fecha: fecha,
      categoria: parseInt(categoria),
      descripcion: descripcion.trim()
    };

    var self = this;
    if (id) {
      // Actualizar
      datosTransaccion.id = id;
      this.transaccionService.actualizarTransaccion(id, datosTransaccion)
        .then(function () {
          self.modal.cerrar();
          self.mostrarTransacciones();
          if (self.app.dashboardUI) {
            self.app.dashboardUI.actualizarDashboard();
          }
          alert('Transaccion actualizada correctamente');
        })
        .catch(function (error) {
          alert('Error al actualizar transaccion: ' + error.message);
        });
    } else {
      // Crear nueva
      this.transaccionService.crearTransaccion(datosTransaccion)
        .then(function () {
          self.modal.cerrar();
          self.mostrarTransacciones();
          if (self.app.dashboardUI) {
            self.app.dashboardUI.actualizarDashboard();
          }
          alert('Transaccion creada correctamente');
        })
        .catch(function (error) {
          alert('Error al crear transaccion: ' + error.message);
        });
    }
  }

  editarTransaccion(id) {
    this.mostrarFormularioTransaccion(id);
  }

  eliminarTransaccion(id) {
    if (!confirm('¿Estas seguro de eliminar esta transaccion?')) {
      return;
    }

    var self = this;
    this.transaccionService.eliminarTransaccion(id)
      .then(function () {
        self.mostrarTransacciones();
        if (self.app.dashboardUI) {
          self.app.dashboardUI.actualizarDashboard();
        }
        alert('Transaccion eliminada correctamente');
      })
      .catch(function (error) {
        alert('Error al eliminar transaccion: ' + error.message);
      });
  }
}