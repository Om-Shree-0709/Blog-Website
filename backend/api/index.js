import serverless from "serverless-http";
import app from "../server.js";

// Export wrapped app
export default serverless(app);
