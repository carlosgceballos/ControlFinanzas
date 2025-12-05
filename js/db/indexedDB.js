// Gestor de IndexedDB para el sistema de finanzas
class FinanzasDB {
    constructor() {
        this.dbName = 'FinanzasPersonalesDB';
        this.version = 1;
        this.db = null;
    }

    // Inicializar la base de datos
    async inicializar() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject('Error al abrir la base de datos');

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store de categorias
                if (!db.objectStoreNames.contains('categorias')) {
                    const categoriaStore = db.createObjectStore('categorias', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    categoriaStore.createIndex('nombre', 'nombre', { unique: true });
                }

                // Store de transacciones
                if (!db.objectStoreNames.contains('transacciones')) {
                    const transaccionStore = db.createObjectStore('transacciones', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    transaccionStore.createIndex('tipo', 'tipo', { unique: false });
                    transaccionStore.createIndex('categoria', 'categoria', { unique: false });
                    transaccionStore.createIndex('fecha', 'fecha', { unique: false });
                }

                // Store de presupuestos
                if (!db.objectStoreNames.contains('presupuestos')) {
                    const presupuestoStore = db.createObjectStore('presupuestos', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    presupuestoStore.createIndex('periodo', 'periodo', { unique: false });
                    presupuestoStore.createIndex('categoria', 'categoria', { unique: false });
                }
            };
        });
    }

    // Metodo generico para agregar datos
    async agregar(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al agregar datos');
        });
    }

    // Metodo generico para obtener todos los datos
    async obtenerTodos(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener datos');
        });
    }

    // Metodo generico para obtener un dato por ID
    async obtenerPorId(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener dato');
        });
    }

    // Metodo generico para actualizar datos
    async actualizar(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al actualizar datos');
        });
    }

    // Metodo generico para eliminar datos
    async eliminar(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Error al eliminar datos');
        });
    }

    // Inicializar categorias predefinidas
    async inicializarCategoriasPredefinidas() {
        const categoriasPredefinidas = [
            { nombre: 'Alimentacion', color: '#ef4444' },
            { nombre: 'Transporte', color: '#3b82f6' },
            { nombre: 'Ocio', color: '#8b5cf6' },
            { nombre: 'Servicios', color: '#10b981' },
            { nombre: 'Salud', color: '#f59e0b' },
            { nombre: 'Educacion', color: '#06b6d4' },
            { nombre: 'Otros', color: '#6b7280' }
        ];

        const categoriasExistentes = await this.obtenerTodos('categorias');
        
        if (categoriasExistentes.length === 0) {
            for (const categoria of categoriasPredefinidas) {
                await this.agregar('categorias', categoria);
            }
        }
    }
}