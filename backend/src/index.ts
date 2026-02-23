/**
 * Entry: load .env, then config, create app, listen on config.PORT.
 */
import "./env-loader.js";
import app from "./app.js";
import { config } from "./config/config.js";

app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
