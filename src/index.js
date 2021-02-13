const express = require("express");
const si = require('systeminformation');


const app = express();
const port = 3000;

app.get("/", (req, res) => {
 si.cpu()
  .then(data => res.send(data))
  .catch(error => res.send(error));
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});