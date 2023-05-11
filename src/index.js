const express = require("express");
const { getLdapClient } = require("./ladp");

const app = express();

//* Endpoint de prueba
app.get("/", (req, res) => {
  const ldapClient = getLdapClient();
  //! Hacer algo con el cliente LDAP...
  ldapClient.unbind();
  res.send("Se conectooooooo!");
});

app.get("/users/:username", (req, res) => {
  const username = req.params.username;
  const ldapClient = getLdapClient();

  const opts = {
    filter: `(samAccountName=${username})`,
    scope: "sub",
  };

  ldapClient.search("DC=inder,DC=gov,DC=co", opts, (err, searchRes) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error en la búsqueda");
    }

    let users = [];

    searchRes.on("searchEntry", (entry) => {
      // Para cada entrada que coincida con el filtro,
      // se ejecutará esta función
      users.push(entry.object);
    });

    searchRes.on("end", () => {
      // Cuando se haya completado la búsqueda, se ejecutará
      // esta función con todos los resultados encontrados
      ldapClient.unbind();
      res.send(users);
    });
  });
});

app.listen(4000, () => {
  console.log("server en port 4000");
});
