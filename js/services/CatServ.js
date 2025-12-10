class CategoriaService {
  constructor(db) {
    this.db = db;
  }

  obtenerCategorias() {
    return new Promise((resolve, reject) => {
      this.db.obtenerTodos('categorias').then(function(categorias) {
        categorias.sort(function(a, b) {
          if (a.nombre < b.nombre) 
            return -1;
          if (a.nombre > b.nombre) 
            return 1;
          return 0;
        });
        resolve(categorias);
      })
      .catch(function(error) {
        console.error('Error al obtener categorías:', error);
        resolve([]);
      });
    });
  }

  crearCategoria(nombre, color) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.obtenerCategorias()
      .then(function(categorias) {
        var existe = false;
        for (var i = 0; i < categorias.length; i++) {
          if (categorias[i].nombre.toLowerCase() === nombre.toLowerCase()) {
            existe = true;
            break;
          }
        }
                    
        if (existe) {
          reject(new Error('Ya existe una categoría con ese nombre'));
          return;
        }

        if (!nombre || nombre.trim() === '') {
          reject(new Error('El nombre es obligatorio'));
          return;
        }

        if (!color) {
          var colores = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6b7280'];
          color = colores[Math.floor(Math.random() * colores.length)];
        }

        var nuevaCategoria = {
          nombre: nombre.trim(),
          color: color,
          fechaCreacion: new Date().toISOString()
        };

        self.db.agregar('categorias', nuevaCategoria)
        .then(function(id) {
            console.log('Categoría creada con ID:', id);
            nuevaCategoria.id = id;
            resolve(nuevaCategoria);
          })
        .catch(function(error) {
          reject(error);
        });
      })
      .catch(function(error) {
        reject(error);
      });
    });
  }

  actualizarCategoria(id, datos) {
    var self = this;
    return new Promise(function(resolve, reject) {
    // Obtener la categoría actual
    self.db.obtenerPorId('categorias', id).then(function(categoriaActual) {
      if (!categoriaActual) {
        reject(new Error('Categoría no encontrada'));
        return;
      }

    // Validar nombre único (si se está cambiando)
    if (datos.nombre && datos.nombre !== categoriaActual.nombre) {
      self.obtenerCategorias().then(function(categorias) {
        var existe = false;
        for (var i = 0; i < categorias.length; i++) {
          if (categorias[i].nombre.toLowerCase() === datos.nombre.toLowerCase() && categorias[i].id !== id) {
            existe = true;
            break;
          }
        }
                            
        if (existe) {
          reject(new Error('Ya existe una categoría con ese nombre'));
          return;
        }
                            
        // Actualizar categoría
        var categoriaActualizada = {
          ...categoriaActual,
          ...datos,
          fechaActualizacion: new Date().toISOString()
        };
                            
        self.db.actualizar('categorias', categoriaActualizada).then(resolve).catch(reject);
      })
      .catch(reject);
    } else {
    // Actualizar sin cambiar nombre
        var categoriaActualizada = {
          ...categoriaActual,
          ...datos,
          fechaActualizacion: new Date().toISOString()
        };
                    
        self.db.actualizar('categorias', categoriaActualizada)
        .then(resolve)
        .catch(reject);
      } 
      })
      .catch(reject);
    });
  }

  eliminarCategoria(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.db.obtenerTodos('transacciones')
      .then(function(transacciones) {
      var transaccionesAsociadas = [];
      for (var i = 0; i < transacciones.length; i++) {
        if (transacciones[i].categoria === id) {
          transaccionesAsociadas.push(transacciones[i]);
        }
      }
                    
      if (transaccionesAsociadas.length > 0) {
        console.log('Eliminando ' + transaccionesAsociadas.length + ' transacciones asociadas...');
                        
        var eliminaciones = [];
        for (var j = 0; j < transaccionesAsociadas.length; j++) {
          eliminaciones.push(self.db.eliminar('transacciones', transaccionesAsociadas[j].id));
        }
                        
        Promise.all(eliminaciones)
        .then(function() {
          return self.db.eliminar('categorias', id);
        })
        .then(function() {
          resolve(true);
        })
        .catch(reject);
      } else {
          self.db.eliminar('categorias', id).then(function() {
            resolve(true);
          })
          .catch(reject);
        }
      })
      .catch(reject);
    });
  }
}