
class PresupuestoService {
    constructor(db) {
        this.db = db;
    }

    obtenerPresupuestos() {
        return this.db.obtenerTodos('presupuestos');
    }

    crearPresupuesto(datos) {
        return this.db.agregar('presupuestos', datos);
    }

    actualizarPresupuesto(id, datos) {
        return this.db.actualizar('presupuestos', { ...datos, id: id });
    }

    eliminarPresupuesto(id) {
        return this.db.eliminar('presupuestos', id);
    }

    obtenerPresupuestoPorPeriodo(mes, año) {
        return new Promise((resolve, reject) => {
            this.obtenerPresupuestos()
                .then(function(presupuestos) {
                    var periodoActual = año + '-' + mes.toString().padStart(2, '0');
                    var filtrados = presupuestos.filter(function(p) {
                        var partes = p.periodo.split('-');
                        var inicioMes = parseInt(partes[1]);
                        var inicioAño = parseInt(partes[0]);
                        
                        // Para presupuestos anuales
                        if (p.tipo === 'anual') {
                            // Anual cubre todo el año
                            return año === inicioAño;
                        }
                        // Para presupuestos mensuales
                        else if (p.tipo === 'mensual') {
                            var mesInicio = inicioMes;
                            var añoInicio = inicioAño;
                            
                            // Calcular si está dentro del rango
                            var fechaInicio = new Date(añoInicio, mesInicio - 1, 1);
                            var fechaConsulta = new Date(año, mes - 1, 1);
                            
                            if (fechaConsulta < fechaInicio) {
                                return false; // Aún no empieza
                            }
                            
                            // Verificar si es recurrente
                            if (p.repeticion === 'recurrente') {
                                return true; // Recurrente aplica a todos los meses después del inicio
                            }
                            
                            // Verificar si tiene fecha fin
                            if (p.mesFin && p.añoFin) {
                                var fechaFin = new Date(p.añoFin, p.mesFin - 1, 30);
                                return fechaConsulta <= fechaFin;
                            }
                            
                            // Si no es recurrente y no tiene fecha fin, es solo para el mes inicial
                            return periodoActual === p.periodo;
                        }
                        return false;
                    });
                    resolve(filtrados);
                })
                .catch(reject);
        });
    }
}
