const express = require("express");
const { getLdapClient } = require("./ladp");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//* Endpoint de prueba
app.get("/", (req, res) => {
  const ldapClient = getLdapClient();
  //! Hacer algo con el cliente LDAP...
  ldapClient.unbind();
  res.send("Se conecto directorio activo exitoso!");
});

//* Endpoint: buscador de usuarios
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
      let hasResults = false; //? Variable de bandera

      //* Para cada entrada que coincida con el filtro, se ejecutará esta función
      searchRes.on("searchEntry", (entry) => {
        users.push(entry.pojo);
        hasResults = true; //? Se establece la bandera en verdadero
        //console.log("Entrada encontrada:", entry.pojo);
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

      //* Cuando se haya completado la búsqueda, se ejecutará esta función con todos los resultados encontrados
      searchRes.on("end", (result) => {
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

//*Endpoint: Autenticar usuarios del directorio activo
app.post("/authenticate", (req, res) => {
  const { username, password } = req.body;
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
        //* Error al realizar la búsqueda
        res.status(500).send("Error en la búsqueda del usuario");
      } else {
        let userFound = false;

        searchRes.on("searchEntry", (entry) => {
          //* Se encontró un usuario en el directorio activo
          userFound = true;
          const userDn = entry.dn.toString();
          //console.log(userDn);

          //* Autenticar al usuario utilizando su contraseña
          ldapClient.bind(userDn, password, (bindErr) => {
            if (bindErr) {
              //* La autenticación ha fallado
              res.status(401).send("Credenciales inválidas");
            } else {
              //* La autenticación ha sido exitosa
              res.send("Autenticación exitosa");
            }
          });
        });

        searchRes.on("error", (error) => {
          //* Error en la búsqueda del usuario
          res.status(500).send("Error en la búsqueda del usuario");
        });

        searchRes.on("end", () => {
          if (!userFound) {
            //* No se encontró ningún usuario en el directorio activo
            res.status(404).send("Usuario no encontrado");
          }
        });
      }
    }
  );
});

app.listen(4000, () => {
  console.log("server en port 4000");
});
