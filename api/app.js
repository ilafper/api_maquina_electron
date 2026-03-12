const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const { z, regex } = require('zod');
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
    const db = client.db('Agenda_Recu');
    return {
      clientes: db.collection('clientes'),
    };
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    throw new Error('Error al conectar a la base de datos');
  }
}



app.get('/api/clientes', async (req, res) => {
  try {
    const { clientes } = await connectToMongoDB();
    const lista_clientes = await clientes.find().toArray();
    console.log(lista_clientes);
    
    res.json({ success: true,mensaje:"todos los clientes Sisi" , lista_clientes});
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los mangas' });
  }
});

//Crear cliente 
app.post('/api/crearcliente', async (req, res) => {
  try {
    // recpger los datos 
    const {nombre, apellidos,telefono,direccion,correo} = req.body;

    const { clientes } = await connectToMongoDB();
    // crear el esquema para validar con zod
    const resultado = z.object({
      nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
      apellidos: z.string().min(3, "Los apellidos deben tener al menos 3 caracteres"),
      //valedar en el tlf no meter letras y un minimo y maximo
      telefono: z.string() .regex(/^\d{7,15}$/, "El teléfono debe contener solo números (7-15 dígitos)").min(7,"minimo 7 digitos").max(15,'maximo 15 digitos'),
      correo: z.email("Correo electrónico inválido"),
      direccion:z.string().min(5, "la direccion debe estar correcta ").max(100, 'la longitud no puede ser mayor que 100 caracteres'),
      
    }).safeParse({nombre, apellidos,telefono,direccion,correo});

    // coger el mensaje de error para mostarar
     if (!resultado.success) {
      console.log("sisis zod");
      //resultado.error?.issues?.[0]?.message;
      const primerError = resultado.error?.issues?.[0]?.message;;
      console.log(primerError);
      
      return res.status(400).json({
        success: false,
        message: primerError  
      });
    }


    // Verificar correo duplicado
    const usuarioExistente = await clientes.findOne({ correo });
    
    if (usuarioExistente) {
      return res.status(409).json({ 
        success: false,
        message: "El correo ya está registrado" 
      });
    }


    const code_user = 'codigo' + Math.floor(Math.random() * 1000);
    // nuevo user
    
    const nuevoUsuario = {
      nombre,
      apellidos,
      telefono,
      direccion,
      correo,
      code_user
    };


    console.log("nuevo nuevo",nuevoUsuario);
    //insertar en l base de datos 
    await clientes.insertOne(nuevoUsuario);

    // mensaje final correcto si fue bien
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: {
        nombre,
        apellidos,
        telefono,
        direccion,
        correo,
        code_user
      }
    });

    
  } catch (error) {
    console.error("Error al guardar el cliente", error);
    res.status(500).json({ error: 'Error interno del servidor al crear el producto' });
  }

});




 //eliminar producto por id
app.delete("/api/eliminarcliente/:id", async (req, res) => {
  const { clientes } = await connectToMongoDB();

  try {
    const id_eliminar = req.params.id;

    console.log(id_eliminar);
    
    // borrar el borrar y su e vento
    const resultado = await clientes.deleteOne({ code_user: id_eliminar});

 
    if (resultado.deletedCount === 0 ) {
      return res.status(404).json({success:false, error: "No se encontro el cliente" });
    }

    res.json({success:true, mensaje: "cliente con id: " + id_eliminar + "eliminado correctamente" });

  } catch (error) {
    res.status(500).json({ error: "Error al eliminar", detalle: error.message });
  }

});



app.get("/api/filtronombre/:nombreBusqueda", async (req, res) => {
  const { clientes } = await connectToMongoDB();

  try {
    const nombreBusqueda = req.params.nombreBusqueda; 
    console.log("Buscando nombre:", nombreBusqueda);

    if (!nombreBusqueda) {
      return res.status(400).json({ success: false, error: "Debes enviar un nombre" });
    }

    // busqueda parcial del campo nombre
    const filtroNombre = await clientes.find({ nombre: new RegExp(nombreBusqueda, 'i') }).toArray();
    console.log(filtroNombre);

    if (filtroNombre.length=== 0 ) {
      console.log("no hay coincidencias");
      return res.json({ success: false, error:"no hay coincidencias"});
    }


    res.json({ success: true, mensaje:"todas las coincidencias", datos: filtroNombre });

  } catch (error) {
    res.status(500).json({ success: false, error: "Error al encontrar", detalle: error.message });
  }
});


//filtro apellidos

app.get("/api/filtroapellidos/:apeBusqueda", async (req, res) => {
  const { clientes } = await connectToMongoDB();

  try {
    const apeBusqueda = req.params.apeBusqueda; 
    console.log("Buscando apellido:", apeBusqueda);

    if (!apeBusqueda) {
      return res.status(400).json({ success: false, error: "Debes enviar un apellido" });
    }

    // busqueda parcial del campo nombre
    const filtroapellidos = await clientes.find({ apellidos: new RegExp(apeBusqueda, 'i') }).toArray();
    console.log(filtroapellidos);

    if (filtroapellidos.length=== 0 ) {
      console.log("no hay coincidencias");
      return res.json({ success: false, error:"no hay coincidencias"});
    }


    res.json({ success: true, mensaje:"todas las coincidencias", datos: filtroapellidos });

  } catch (error) {
    res.status(500).json({ success: false, error: "Error al encontrar", detalle: error.message });
  }
});




app.get("/api/filtrotelefono/:tlfBusqueda", async (req, res) => {
  const { clientes } = await connectToMongoDB();

  try {
    const tlfBusqueda = req.params.tlfBusqueda; 
    console.log("Buscando apellido:", tlfBusqueda);

    if (!tlfBusqueda) {
      return res.status(400).json({ success: false, error: "Debes enviar un apellido" });
    }

    // busqueda parcial del campo nombre
    const filtrotelefono = await clientes.find({ telefono: new RegExp(tlfBusqueda, 'i') }).toArray();
    
    console.log(filtrotelefono);

    if (filtrotelefono.length=== 0 ) {
      console.log("no hay coincidencias");
      return res.json({ success: false, error:"no hay coincidencias"});
    }

    let lista_telefonos=[]

    for(let cada_tele of filtrotelefono){
      lista_telefonos.push(cada_tele.telefono);
    }
    console.log("solo telefonos",lista_telefonos);
    

    res.json({ success: true, mensaje:"todas las coincidencias", datos: lista_telefonos });

  } catch (error) {
    res.status(500).json({ success: false, error: "Error al encontrar", detalle: error.message });
  }
});









// // Actualizar producto por ID
// app.put("/api/actuproducto/:id", async (req, res) => {
//     const { id } = req.params; 
//     const datosActualizados = req.body;
//     try {
//         const { productos } = await connectToMongoDB();
//         const resultado = await productos.updateOne(
//             { _id: new ObjectId(id) }, 
//             { $set: datosActualizados }
//         );

//         if (resultado.matchedCount === 0) {
//             return res.status(404).json({ error: "Producto no encontrado" });
//         }

//         res.json({ mensaje: "Producto actualizado ISISISIS" });
//     } catch (error) {
//         console.error("NONNNONONO", error);
//         res.status(500).json({ error: "Error servidor nONONONO" });
//     }
// });






module.exports = app;