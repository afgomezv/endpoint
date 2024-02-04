//! //! Obtener todos los usuarios del directorio activo con autenticación (GET)
app.get("/users", (req, res) => {
  const ldapClient = getLdapClient();

  const opts = {
    filter: "(objectClass=user)",
    scope: "sub",
    attributes: [
      "employeeID",
      "givenName",
      "sn",
      "mail",
      "userParameters",
      "employeeType",
    ],
  };

  ldapClient.search(
    "OU=Usuarios,OU=INDER,DC=inder,DC=gov,DC=local",
    opts,
    (err, searchRes) => {
      if (err) {
        console.error("Error en la búsqueda de usuarios:", err);
        res.status(500).send("Error en la búsqueda de usuarios");
        return;
      }

      const usuarios = [];

      searchRes.on("searchEntry", (entry) => {
        const userData = {};

        // Iterar sobre los atributos y agregarlos al objeto userData
        entry.attributes.forEach((attribute) => {
          // Verificar si el atributo tiene valores antes de acceder a ellos
          if (attribute.vals && attribute.vals.length > 0) {
            // Separar givenName en primerNombre y segundoNombre
            if (attribute.type === "givenName") {
              const [firstName, secondName] = attribute.vals[0].split(" ");
              userData["firstName"] = firstName;
              userData["secondName"] = secondName || "";
            }
            // Separar sn en primerApellido y segundoApellido
            else if (attribute.type === "sn") {
              const [surname, secondSurname] = attribute.vals[0].split(" ");
              userData["surname"] = surname;
              userData["secondSurname"] = secondSurname || "";
            }
            // Otros atributos se agregan directamente
            else {
              userData[attribute.type] = attribute.vals[0];
            }
          }
        });

        usuarios.push(userData);
      });

      searchRes.on("error", (error) => {
        console.error("Error en la búsqueda de usuarios:", error);
        res.status(500).send("Error en la búsqueda de usuarios");
      });

      searchRes.on("end", () => {
        // Cerrar el cliente LDAP al finalizar la búsqueda
        ldapClient.unbind();

        res.json(usuarios);
      });
    }
  );
});