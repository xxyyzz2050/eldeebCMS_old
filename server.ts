import "zone.js/dist/zone-node";
import "reflect-metadata";
import { readFileSync } from "fs";
import { enableProdMode } from "@angular/core";
import { ngExpressEngine } from "@nguniversal/express-engine";
import { provideModuleMap } from "@nguniversal/module-map-ngfactory-loader"; //for lazy loading modules

import * as express from "express";
import { join } from "path";

enableProdMode(); // Faster server renders w/ Prod mode (dev mode never needed)

// Express server
const app = express();
const PORT = process.env.PORT || 4200; //changed from 4000 to 4200 just to same as angular default port
const DIST_FOLDER = join(process.cwd(), "dist/browser");

//https://mdbootstrap.com/support/angular/angular-universal-with-mdboostrap-not-working/
const domino = require("domino"); //Server-side DOM implementation based on Mozilla's dom.js
const template = readFileSync(join(DIST_FOLDER, "/index.html")).toString();
const win = domino.createWindow(template);
global["window"] = win;
global["Node"] = win.Node;
global["navigator"] = win.navigator;
global["Event"] = win.Event;
global["Event"]["prototype"] = win.Event.prototype;
global["document"] = win.document;

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
} = require("./dist/server/main");

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  "html",
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set("view engine", "html");
app.set("views", DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Serve static files from /browser
app.get(
  "*.*",
  express.static(DIST_FOLDER, {
    maxAge: "1y"
  })
);

// All regular routes use the Universal engine
app.get("*", (req, res) => {
  res.render("index", { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
