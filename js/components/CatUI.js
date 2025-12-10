class CategoriasUI {
    constructor(app) {
        this.app = app;
        this.categoriaService = app.categoriaService;
        this.modal = app.modal;
    }

    inicializar() {
        this.configurarEventos();
        this.mostrarCategorias();
    }

    configurarEventos() {
        var self = this;
        var btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
        
        if (btnNuevaCategoria) {
            // Clonar el boton para eliminar listeners previos
            var nuevoBoton = btnNuevaCategoria.cloneNode(true);
            btnNuevaCategoria.parentNode.replaceChild(nuevoBoton, btnNuevaCategoria);
            
            // Agregar el evento al nuevo boton
            nuevoBoton.addEventListener('click', function() {
                self.mostrarFormularioCategoria();
            });
        }
    }

    mostrarCategorias() {
        var self = this;
        var categoriesGrid = document.getElementById('categories-grid');
    
        if (!categoriesGrid) return;
    
        this.categoriaService.obtenerCategorias()
        .then(function(categorias) {
            categoriesGrid.innerHTML = '';
            
            if (categorias.length === 0) {
                categoriesGrid.innerHTML = '<p>No hay categorias creadas</p>';
                return;
            }
            
            for (var i = 0; i < categorias.length; i++) {
                var categoria = categorias[i];
                var categoriaCard = document.createElement('div');
                categoriaCard.className = 'card category-card';
                categoriaCard.style.borderLeftColor = categoria.color;
                
                categoriaCard.innerHTML = 
                    '<div class="category-header">' +
                        '<div class="category-name">' + categoria.nombre + '</div>' +
                        '<div class="category-count">0 transacciones</div>' +
                    '</div>' +
                    '<div class="category-actions">' +
                        '<button class="btn btn-secondary btn-small" data-id="' + categoria.id + '">Editar</button>' +
                        '<button class="btn btn-danger btn-small" data-id="' + categoria.id + '">Eliminar</button>' +
                    '</div>';
                
                categoriesGrid.appendChild(categoriaCard);
                
                // Boton editar
                var btnEditar = categoriaCard.querySelector('.btn-secondary');
                btnEditar.addEventListener('click', function() {
                    var id = parseInt(this.getAttribute('data-id'));
                    self.editarCategoria(id);
                });
                
                // Boton eliminar
                var btnEliminar = categoriaCard.querySelector('.btn-danger');
                btnEliminar.addEventListener('click', function() {
                    var id = parseInt(this.getAttribute('data-id'));
                    self.eliminarCategoria(id);
                });
            }
        })
        .catch(function(error) {
            console.error('Error al mostrar categorias:', error);
        });
    }

    editarCategoria(id) {
        var self = this;
        this.categoriaService.obtenerCategorias()
        .then(function(categorias) {
            var categoria = null;
            for (var i = 0; i < categorias.length; i++) {
                if (categorias[i].id === id) {
                    categoria = categorias[i];
                    break;
                }
            }
            
            if (!categoria) {
                alert('Categoria no encontrada');
                return;
            }
            
            self.mostrarFormularioCategoria(categoria);
        })
        .catch(function(error) {
            alert('Error al obtener categoria: ' + error.message);
        });
    }

   mostrarFormularioCategoria(categoria) {
        var esEdicion = !!categoria;
        var titulo = esEdicion ? 'Editar Categoria' : 'Nueva Categoria';
    
        var formHTML = 
        '<div class="form-group">' +
            '<label for="categoria-nombre">Nombre de la categoria</label>' +
            '<input type="text" id="categoria-nombre" class="form-input" placeholder="Ej: Entretenimiento"' +
                   (esEdicion ? ' value="' + categoria.nombre + '"' : '') + '>' +
        '</div>' +
        '<div class="form-group">' +
            '<label for="categoria-color">Color</label>' +
            '<input type="color" id="categoria-color" class="form-input"' +
                   (esEdicion ? ' value="' + categoria.color + '"' : ' value="#6366f1"') + '>' +
        '</div>' +
        '<div class="form-actions">' +
            '<button class="btn btn-secondary" id="btn-cancelar-categoria">Cancelar</button>' +
            '<button class="btn btn-primary" id="btn-guardar-categoria">' +
                (esEdicion ? 'Actualizar' : 'Guardar') +
            '</button>' +
        '</div>';

        this.modal.abrir(titulo, formHTML);
    
        var self = this;
        setTimeout(function() {
            var btnGuardar = document.getElementById('btn-guardar-categoria');
            var btnCancelar = document.getElementById('btn-cancelar-categoria');
            
            if (btnGuardar) {
                // Clonar para eliminar listeners previos
                var nuevoGuardar = btnGuardar.cloneNode(true);
                btnGuardar.parentNode.replaceChild(nuevoGuardar, btnGuardar);
                
                nuevoGuardar.addEventListener('click', function() {
                    if (esEdicion) {
                        self.actualizarCategoria(categoria.id);
                    } else {
                        self.guardarCategoria();
                    }
                });
            }
            
            if (btnCancelar) {
                // Clonar para eliminar listeners previos
                var nuevoCancelar = btnCancelar.cloneNode(true);
                btnCancelar.parentNode.replaceChild(nuevoCancelar, btnCancelar);
                
                nuevoCancelar.addEventListener('click', function() {
                    self.modal.cerrar();
                });
            }
        }, 100);
    }

    guardarCategoria() {
        var nombreInput = document.getElementById('categoria-nombre');
        var colorInput = document.getElementById('categoria-color');
        
        if (!nombreInput || !nombreInput.value.trim()) {
            alert('El nombre de la categoria es obligatorio');
            return;
        }
        
        var nombre = nombreInput.value.trim();
        var color = colorInput ? colorInput.value : null;
        
        var self = this;
        this.categoriaService.crearCategoria(nombre, color)
            .then(function(categoria) {
                console.log('Categoria creada:', categoria);
                self.modal.cerrar();
                self.mostrarCategorias();
                alert('Categoria creada correctamente');
            })
            .catch(function(error) {
                alert('Error: ' + error.message);
            });
    }

    eliminarCategoria(id) {
        if (!confirm('¿Estas seguro de eliminar esta categoria? Se eliminaran tambien todas las transacciones asociadas.')) {
            return;
        }
        
        var self = this;
        this.categoriaService.eliminarCategoria(id)
            .then(function() {
                console.log('Categoria eliminada:', id);
                self.mostrarCategorias();
                alert('Categoria eliminada correctamente');
            })
            .catch(function(error) {
                alert('Error al eliminar categoria: ' + error.message);
            });
    }

    actualizarCategoria(id) {
        var nombreInput = document.getElementById('categoria-nombre');
        var colorInput = document.getElementById('categoria-color');
    
        if (!nombreInput || !nombreInput.value.trim()) {
            alert('El nombre de la categoria es obligatorio');
            return;
        }
    
        var datos = {
            nombre: nombreInput.value.trim(),
            color: colorInput ? colorInput.value : '#6366f1'
        };
    
        var self = this;
        this.categoriaService.actualizarCategoria(id, datos).then(function() {
            console.log('Categoria actualizada:', id);
            self.modal.cerrar();
            self.mostrarCategorias();
            alert('Categoria actualizada correctamente');
        })
        .catch(function(error) {
            alert('Error: ' + error.message);
        });
    }
}