const ldap = require("ldapjs");
const dotenv = require("dotenv");

dotenv.config();

const ldapUrl = process.env.LDAP_URL;
const baseDn = process.env.LDAP_BASE_DN;
const adminDn = process.env.LDAP_ADMIN_DN;
const adminPassword = process.env.LDAP_ADMIN_PASSWORD;

const getLdapClient = () => {
  const client = ldap.createClient({
    url: ldapUrl,
  });

  client.bind(adminDn, adminPassword, (err) => {
    if (err) {
      console.error("Error de conexión: ", err);
    } else {
      console.log("Conexión exitosa!");
    }
  });

  return client;
};

module.exports = {
  getLdapClient,
};
