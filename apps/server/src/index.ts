import app from "./app";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// this is file the actual execution starts for the backend as this is esentially
//  //a  listner and it brings more 
// modularity in the code as we can  now test app.js without launching the server and also we can 
// use this file to launch the server in production and dev environment with different ports and other configurations 