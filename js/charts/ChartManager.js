// Gestor de graficos con Chart.js
class ChartManager {
  constructor(app) {
    this.app = app;
    this.charts = {};
    this.mesActual = new Date().getMonth() + 1;
    this.anioActual = new Date().getFullYear();
  }

  inicializar(mes, anio) {
    this.mesActual = mes || this.mesActual;
    this.anioActual = anio || this.anioActual;
    
    this.destruirGraficos();
    this.crearGraficoGastosCategoria();
    this.crearGraficoBalanceLineas();
    this.crearGraficoEgresosComparativo();
    this.crearGraficoEvolucionBalance();
  }

  destruirGraficos() {
    for (var key in this.charts) {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    }
    this.charts = {};
  }

  crearGraficoGastosCategoria() {
    var self = this;
    var ctx = document.getElementById('chart-gastos-categoria');
    if (!ctx) return;

    this.app.transaccionService.obtenerTransaccionesPorMes(this.mesActual, this.anioActual)
      .then(function(transacciones) {
        var egresos = transacciones.filter(function(t) {
          return t.tipo === 'egreso';
        });

        return self.app.categoriaService.obtenerCategorias().then(function(categorias) {
          var gastosPorCategoria = {};
          var categoriasMap = {};
          
          for (var i = 0; i < categorias.length; i++) {
            categoriasMap[categorias[i].id] = categorias[i];
            gastosPorCategoria[categorias[i].id] = 0;
          }

          for (var j = 0; j < egresos.length; j++) {
            var catId = egresos[j].categoria;
            gastosPorCategoria[catId] += egresos[j].monto;
          }

          var labels = [];
          var datos = [];
          var colores = [];

          for (var catId in gastosPorCategoria) {
            if (gastosPorCategoria[catId] > 0) {
              var cat = categoriasMap[catId];
              if (cat) {
                labels.push(cat.nombre);
                datos.push(gastosPorCategoria[catId]);
                colores.push(cat.color);
              }
            }
          }

          if (self.charts.gastosCategoria) {
            self.charts.gastosCategoria.destroy();
          }

          self.charts.gastosCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: datos,
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      var label = context.label || '';
                      var value = context.parsed || 0;
                      return label + ': $' + value.toFixed(2);
                    }
                  }
                }
              }
            }
          });
        });
      })
      .catch(function(error) {
        console.error('Error al crear grafico de gastos por categoria:', error);
      });
  }

  crearGraficoBalanceLineas() {
    var self = this;
    var ctx = document.getElementById('chart-balance-lineas');
    if (!ctx) return;

    this.app.transaccionService.obtenerTransaccionesPorMes(this.mesActual, this.anioActual)
      .then(function(transacciones) {
        return self.app.presupuestoService.obtenerPresupuestoPorPeriodo(self.mesActual, self.anioActual)
          .then(function(presupuestos) {
            
            var ingresos = 0;
            var egresosReales = 0;
            
            for (var i = 0; i < transacciones.length; i++) {
              if (transacciones[i].tipo === 'ingreso') {
                ingresos += transacciones[i].monto;
              } else {
                egresosReales += transacciones[i].monto;
              }
            }

            var egresosEstimados = 0;
            for (var j = 0; j < presupuestos.length; j++) {
              egresosEstimados += presupuestos[j].monto;
            }

            var balanceReal = ingresos - egresosReales;
            var balanceEstimado = ingresos - egresosEstimados;

            if (self.charts.balanceLineas) {
              self.charts.balanceLineas.destroy();
            }

            self.charts.balanceLineas = new Chart(ctx, {
              type: 'line',
              data: {
                labels: ['Balance'],
                datasets: [
                  {
                    label: 'Balance Real',
                    data: [balanceReal],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Balance Estimado',
                    data: [balanceEstimado],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: true
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toFixed(0);
                      }
                    }
                  }
                }
              }
            });
          });
      });
  }

  crearGraficoEgresosComparativo() {
    var self = this;
    var ctx = document.getElementById('chart-egresos-comparativo');
    if (!ctx) return;

    this.app.transaccionService.obtenerTransaccionesPorMes(this.mesActual, this.anioActual)
      .then(function(transacciones) {
        return self.app.presupuestoService.obtenerPresupuestoPorPeriodo(self.mesActual, self.anioActual)
          .then(function(presupuestos) {
            return self.app.categoriaService.obtenerCategorias().then(function(categorias) {
              
              var categoriasMap = {};
              for (var i = 0; i < categorias.length; i++) {
                categoriasMap[categorias[i].id] = categorias[i].nombre;
              }

              var egresosReales = {};
              var egresos = transacciones.filter(function(t) {
                return t.tipo === 'egreso';
              });

              for (var j = 0; j < egresos.length; j++) {
                var catId = egresos[j].categoria;
                if (!egresosReales[catId]) {
                  egresosReales[catId] = 0;
                }
                egresosReales[catId] += egresos[j].monto;
              }

              var labels = [];
              var datosReales = [];
              var datosEstimados = [];

              for (var k = 0; k < presupuestos.length; k++) {
                var catId = presupuestos[k].categoria;
                var nombreCat = categoriasMap[catId] || 'Categoria ' + catId;
                
                labels.push(nombreCat);
                datosEstimados.push(presupuestos[k].monto);
                datosReales.push(egresosReales[catId] || 0);
              }

              if (self.charts.egresosComparativo) {
                self.charts.egresosComparativo.destroy();
              }

              self.charts.egresosComparativo = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    {
                      label: 'Presupuestado',
                      data: datosEstimados,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                      borderColor: '#10b981',
                      borderWidth: 1
                    },
                    {
                      label: 'Real',
                      data: datosReales,
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                      borderColor: '#ef4444',
                      borderWidth: 1
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toFixed(0);
                        }
                      }
                    }
                  }
                }
              });
            });
          });
      });
  }

  crearGraficoEvolucionBalance() {
    var self = this;
    var ctx = document.getElementById('chart-evolucion-balance');
    if (!ctx) return;

    this.app.transaccionService.obtenerTransacciones()
      .then(function(transacciones) {
        var meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        var balancesPorMes = {};

        for (var i = 1; i <= 12; i++) {
          balancesPorMes[i] = 0;
        }

        for (var j = 0; j < transacciones.length; j++) {
          var fecha = new Date(transacciones[j].fecha);
          if (fecha.getFullYear() === self.anioActual) {
            var mes = fecha.getMonth() + 1;
            var monto = transacciones[j].monto;
            
            if (transacciones[j].tipo === 'ingreso') {
              balancesPorMes[mes] += monto;
            } else {
              balancesPorMes[mes] -= monto;
            }
          }
        }

        var labels = [];
        var datos = [];
        
        for (var k = 1; k <= 12; k++) {
          labels.push(meses[k - 1]);
          datos.push(balancesPorMes[k]);
        }

        if (self.charts.evolucionBalance) {
          self.charts.evolucionBalance.destroy();
        }

        self.charts.evolucionBalance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Balance Mensual ' + self.anioActual,
              data: datos,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    var value = context.parsed.y;
                    return 'Balance: $' + value.toFixed(2);
                  }
                }
              }
            },
            scales: {
              y: {
                ticks: {
                  callback: function(value) {
                    return '$' + value.toFixed(0);
                  }
                }
              }
            }
          }
        });
      });
  }

  actualizarGraficos(mes, anio) {
    this.inicializar(mes, anio);
  }
}