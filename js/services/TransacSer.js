class TransaccionService {
  constructor(db) {
    this.db = db;
  }

  obtenerTransacciones() {
    return this.db.obtenerTodos('transacciones');
  }

  crearTransaccion(datos) {
    return this.db.agregar('transacciones', datos);
  }

  actualizarTransaccion(id, datos) {
    return this.db.actualizar('transacciones', { ...datos, id: id });
  }

  eliminarTransaccion(id) {
    return this.db.eliminar('transacciones', id);
  }

  obtenerTransaccionesPorMes(mes, año) {
    return new Promise((resolve, reject) => {
      this.obtenerTransacciones().then(function(transacciones) {
        var filtradas = transacciones.filter(function(t) {
          var fecha = new Date(t.fecha);
          return fecha.getMonth() + 1 === mes && fecha.getFullYear() === año;
        });
        resolve(filtradas);
      })
      .catch(reject);
    });
  }
}