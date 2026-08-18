#!/usr/bin/env bun
// Copies examples/demo-session into sessions/<today>-generic-url-shortener so you can try the workbench and /mock immediately.
import { cpSync, existsSync } from "node:fs";
const dir = `sessions/${new Date().toISOString().slice(0, 10)}-generic-url-shortener`;
if (existsSync(dir)) { console.log(`${dir} already exists`); process.exit(0); }
cpSync("examples/demo-session", dir, { recursive: true });
console.log(`created ${dir} — open http://localhost:7788/sessions/${dir.split("/")[1]} or run /mock`);
