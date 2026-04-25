const express = require('express');
const bodyParser = require('body-parser');
const App = express();
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno

const Api = require('./routes/Api.js');
const Trees = require('./routes/trees.js')
const CensusTree = require("./routes/censusTree.js")
const Users = require("./routes/users.js")
const corsOptions = {
    origin: '*', // Permite que tu localhost y la app móvil se conecten sin problemas
    methods: 'GET, POST, PUT, DELETE, OPTIONS', // OPTIONS es vital para el chequeo de seguridad
    allowedHeaders: 'Content-Type, Authorization, type, Accept, Origin, X-Requested-With', // Aquí agregamos 'type'
    exposedHeaders: 'Content-Range, X-Content-Range'
};

App.use(cors(corsOptions));
App.use(express.json({ limit: '50mb' }));
App.use(express.urlencoded({ limit: '50mb', extended: true }));
App.use(express.static(__dirname + '/public'));

App.use('/api', Api);
App.use('/api/trees', Trees)
App.use('/api/censusTrees', CensusTree)
App.use('/api/users', Users)

App.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Error en el servidor', error: err.message });
});

module.exports = App