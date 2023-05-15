const express = require("express");
const { getLdapClient } = require("./ladp");

const app = express();

//* Endpoint de prueba
app.get("/", (req, res) => {
  const ldapClient = getLdapClient();
  //! Hacer algo con el cliente LDAP...
  ldapClient.unbind();
  res.send("Se conecto directorio activo exitoso!");
});

app.get("/users/:username", (req, res) => {
  const username = req.params.username;
  const ldapClient = getLdapClient();

  const opts = {
    filter: `(samAccountName=${username})`,
    scope: "sub",
  };

  ldapClient.search(
    "OU=Usuarios,OU=INDER,DC=inder,DC=gov,DC=local",
    opts,
    (err, searchRes) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error en la búsqueda: " + err.message);
      }

      let users = [];
      let hasResults = false; // Variable de bandera

      searchRes.on("searchEntry", (entry) => {
        //* Para cada entrada que coincida con el filtro,
        //* se ejecutará esta función
        users.push(entry.pojo);
        hasResults = true; // Se establece la bandera en verdadero
        //console.log("Entrada encontrada:", entry.json);
      });

      searchRes.on("searchReference", (referral) => {
        //* Si se reciben referencias de búsqueda, se puede
        //* agregar una lógica adicional aquí si es necesario
        console.log("Referencia de búsqueda: " + referral.uris.join());
      });

      searchRes.on("error", (err) => {
        //* Si ocurre un error durante la búsqueda,
        //* se ejecutará esta función
        console.error(err);
        res.status(500).send("Error en la búsqueda: " + err.message);
      });

      searchRes.on("end", (result) => {
        //* Cuando se haya completado la búsqueda, se ejecutará
        //* esta función con todos los resultados encontrados
        if (result.status === 0) {
          ldapClient.unbind();

          if (hasResults) {
            res.send(users);
          } else {
            res.status(404).send("Usuario no encontrado");
          }
        } else {
          const errorMessage =
            "Búsqueda incompleta. Código de estado: " + result.status;
          console.error(errorMessage);
          res.status(500).send("Error en la búsqueda: " + errorMessage);
        }
      });
    }
  );
});

app.listen(4000, () => {
  console.log("server en port 4000");
});
