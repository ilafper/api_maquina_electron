const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const app = express();
app.use(express.json());

const uri = "mongodb+srv://ialfper:ialfper21@alumnos.zoinj.mongodb.net/alumnos?retryWrites=true&w=majority"; //
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("ESta conectado, Go go go go");
    const db = client.db('MaquinaElectron');
    return {
      productos: db.collection('producto'),
    };
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    throw new Error('Error al conectar a la base de datos');
  }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


//Obtener todos los PRoductos
app.get('/api/productos', async (req, res) => {
  try {
    const { productos } = await connectToMongoDB();
    const lista_products = await productos.find().toArray();
    res.json(lista_products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los mangas' });
  }
});

//Crear productos
app.post('/api/crearproducto', async (req, res) => {
  const nuevoProducto = req.body;
  try {
    const { productos } = await connectToMongoDB();
    const resultado = await productos.insertOne(nuevoProducto);
    console.log(`PRODUCTO creado con ID: ${resultado.insertedId}`);
    res.status(201).json({ mensaje: "Producto creado", id: resultado.insertedId });
  } catch (error) {
    console.error("Error al guardar el producto en MongoDB:", error);
    res.status(500).json({ error: 'Error interno del servidor al crear el producto' });
  }
});


//eliminar producto por id

app.delete('/api/delete/:id', async (req, res) => {
    //recivir la url
  const { id } = req.params;
  try {
    const { productos } = await connectToMongoDB();
    const resultado = await productos.deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el producto' });
  }
});


// Actualizar producto por ID

app.put("/api/actuproducto/:id", async (req, res) => {
    const { id } = req.params; 
    const datosActualizados = req.body;
    try {
        const { productos } = await connectToMongoDB();
        const resultado = await productos.updateOne(
            { _id: new ObjectId(id) }, 
            { $set: datosActualizados }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ mensaje: "Producto actualizado ISISISIS" });
    } catch (error) {
        console.error("NONNNONONO", error);
        res.status(500).json({ error: "Error servidor nONONONO" });
    }
});






module.exports = app;