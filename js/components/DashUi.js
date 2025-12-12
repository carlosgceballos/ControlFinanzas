// Interfaz del Dashboard con resumen y graficos
class DashboardUI {
  constructor(app) {
    this.app = app;
    this.chartManager = new ChartManager(app);
    this.mesActual = new Date().getMonth() + 1;
    this.anioActual = new Date().getFullYear();
  }
  //

  inicializar() {
    this.cargarFiltrosTiempo();
    this.configurarEventosFiltros();
    this.actualizarDashboard();
  }

  cargarFiltrosTiempo() {
    var selectMes = document.getElementById('month-filter');
    var selectAnio = document.getElementById('year-filter');
    
    if (!selectMes || !selectAnio) return;

    var meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    selectMes.innerHTML = '<option value="">Seleccionar mes</option>';
    for (var i = 0; i < meses.length; i++) {
      var option = document.createElement('option');
      option.value = i + 1;
      option.textContent = meses[i];
      if (i + 1 === this.mesActual) {
        option.selected = true;
      }
      selectMes.appendChild(option);
    }

    selectAnio.innerHTML = '<option value="">Seleccionar año</option>';
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

  configurarEventosFiltros() {
    var self = this;
    var selectMes = document.getElementById('month-filter');
    var selectAnio = document.getElementById('year-filter');

    if (selectMes) {
      selectMes.addEventListener('change', function() {
        var mes = parseInt(this.value);
        if (!isNaN(mes)) {
          self.mesActual = mes;
          self.actualizarDashboard();
        }
      });
    }

    if (selectAnio) {
      selectAnio.addEventListener('change', function() {
        var anio = parseInt(this.value);
        if (!isNaN(anio)) {
          self.anioActual = anio;
          self.actualizarDashboard();
        }
      });
    }
  }

  actualizarDashboard() {
    this.actualizarResumen();
    this.actualizarTransaccionesRecientes();
    this.chartManager.actualizarGraficos(this.mesActual, this.anioActual);
  }

  actualizarResumen() {
    var self = this;
    
    this.app.transaccionService.obtenerTransaccionesPorMes(this.mesActual, this.anioActual)
      .then(function(transacciones) {
        var totalIngresos = 0;
        var totalEgresos = 0;

        for (var i = 0; i < transacciones.length; i++) {
          if (transacciones[i].tipo === 'ingreso') {
            totalIngresos += transacciones[i].monto;
          } else if (transacciones[i].tipo === 'egreso') {
            totalEgresos += transacciones[i].monto;
          }
        }

        var balance = totalIngresos - totalEgresos;

        var elemIngresos = document.getElementById('total-ingresos');
        var elemEgresos = document.getElementById('total-egresos');
        var elemBalance = document.getElementById('balance-total');

        if (elemIngresos) {
          elemIngresos.textContent = '$' + totalIngresos.toFixed(2);
        }
        if (elemEgresos) {
          elemEgresos.textContent = '$' + totalEgresos.toFixed(2);
        }
        if (elemBalance) {
          elemBalance.textContent = '$' + balance.toFixed(2);
          elemBalance.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        }
      })
      .catch(function(error) {
        console.error('Error al actualizar resumen:', error);
      });
  }

  actualizarTransaccionesRecientes() {
    var self = this;
    var container = document.getElementById('recent-transactions-list');
    
    if (!container) return;

    this.app.transaccionService.obtenerTransacciones()
      .then(function(transacciones) {
        transacciones.sort(function(a, b) {
          return new Date(b.fecha) - new Date(a.fecha);
        });

        var recientes = transacciones.slice(0, 5);

        if (recientes.length === 0) {
          container.innerHTML = '<p>No hay transacciones registradas</p>';
          return;
        }

        return self.app.categoriaService.obtenerCategorias().then(function(categorias) {
          var categoriasMap = {};
          for (var i = 0; i < categorias.length; i++) {
            categoriasMap[categorias[i].id] = categorias[i].nombre;
          }

          container.innerHTML = '';

          for (var j = 0; j < recientes.length; j++) {
            var transaccion = recientes[j];
            var fecha = new Date(transaccion.fecha);
            var fechaFormateada = fecha.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short'
            });

            var itemDiv = document.createElement('div');
            itemDiv.className = 'recent-transaction-item';

            var detallesDiv = document.createElement('div');
            detallesDiv.className = 'transaction-details';

            var descDiv = document.createElement('div');
            descDiv.className = 'transaction-desc';
            descDiv.textContent = transaccion.descripcion || 'Sin descripcion';

            var metaDiv = document.createElement('div');
            metaDiv.className = 'transaction-meta';
            metaDiv.textContent = fechaFormateada + ' • ' + 
              (categoriasMap[transaccion.categoria] || 'Sin categoria');

            detallesDiv.appendChild(descDiv);
            detallesDiv.appendChild(metaDiv);

            var montoDiv = document.createElement('div');
            montoDiv.className = 'transaction-amount ' + transaccion.tipo;
            montoDiv.textContent = (transaccion.tipo === 'ingreso' ? '+' : '-') + 
              '$' + transaccion.monto.toFixed(2);

            itemDiv.appendChild(detallesDiv);
            itemDiv.appendChild(montoDiv);
            container.appendChild(itemDiv);
          }
        });
      })
      .catch(function(error) {
        console.error('Error al cargar transacciones recientes:', error);
        container.innerHTML = '<p>Error al cargar transacciones</p>';
      });
  }
}