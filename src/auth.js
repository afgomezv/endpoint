const { getLdapClient } = require("./ladp");

//* Función para autenticar un usuario en el Directorio Activo
function authenticateUser(username, password, callback) {
  const ldapClient = getLdapClient();

  //* Construir filtro de búsqueda para encontrar el usuario
  const opts = {
    filter: `(samAccountName=${username})`,
    scope: "sub",
  };

  //* Realizar búsqueda del usuario
  ldapClient.search(
    "OU=Usuarios,OU=INDER,DC=inder,DC=gov,DC=local",
    opts,
    (err, searchRes) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error en la búsqueda: " + err.message);
      }

      let users = [];
      let hasResults = false; //? Variable de bandera

      //* Para cada entrada que coincida con el filtro, se ejecutará esta función
      searchRes.on("searchEntry", (entry) => {
        users.push(entry.pojo);
        hasResults = true; //? Se establece la bandera en verdadero
        //console.log("Entrada encontrada:", entry.pojo);
        userEntry = entry;
      });

      //* Si se reciben referencias de búsqueda, se puede agregar una lógica adicional aquí si es necesario
      searchRes.on("searchReference", (referral) => {
        console.log("Referencia de búsqueda: " + referral.uris.join());
      });

      //* Si ocurre un error durante la búsqueda, se ejecutará esta función
      searchRes.on("error", (err) => {
        console.error(err);
        res.status(500).send("Error en la búsqueda: " + err.message);
      });

      // searchRes.on("end", (result) => {
      //   if (result.status === 0 && userEntry) {
      //     //* El usuario fue encontrado en el Directorio Activo, intentar autenticar
      //     ldapClient.bind(userEntry.pojo, password, (err) => {
      //       if (err) {
      //         //* Las credenciales son inválidas
      //         callback(null, false);
      //       } else {
      //         //* Autenticación exitosa
      //         callback(null, true);
      //       }
      //     });
      //   } else {
      //     //* El usuario no fue encontrado en el Directorio Activo
      //     callback(null, false);
      //   }
      // });
    }
  );
}

module.exports = {
  authenticateUser,
};
