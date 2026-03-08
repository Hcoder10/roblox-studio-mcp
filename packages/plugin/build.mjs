#!/usr/bin/env node
/**
 * Build StudioBridgeMCP.rbxmx from Luau source files — no Rojo needed.
 *
 * Usage:  node build.mjs [--install]
 *   --install  Also copies the .rbxmx to the local Roblox Plugins folder.
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const DIR = resolve(import.meta.dirname, 'src');
const OUT = resolve(import.meta.dirname, 'StudioBridgeMCP.rbxmx');

// Map of module name → filename (order doesn't matter for XML)
const MODULES = [
  { name: 'executor',   file: 'executor.lua' },
  { name: 'serializer', file: 'serializer.lua' },
  { name: 'session',    file: 'session.lua' },
  { name: 'transport',  file: 'transport.lua' },
  { name: 'ui',         file: 'ui.lua' },
];

function escape_cdata(text) {
  // CDATA cannot contain the sequence ]]>, split it if found
  return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function read_lua(filename) {
  return readFileSync(join(DIR, filename), 'utf-8');
}

function build_module_xml(name, source, referent) {
  return `    <Item class="ModuleScript" referent="${referent}">
      <Properties>
        <string name="Name">${name}</string>
        <string name="Source"><![CDATA[${escape_cdata(source)}]]></string>
      </Properties>
    </Item>`;
}

// --- Build ---

const init_source = read_lua('init.server.lua');

const module_xml = MODULES.map((m, i) => {
  const source = read_lua(m.file);
  return build_module_xml(m.name, source, i + 1);
}).join('\n');

const rbxmx = `<roblox version="4">
  <Item class="Script" referent="0">
    <Properties>
      <string name="Name">StudioBridgeMCP</string>
      <token name="RunContext">0</token>
      <string name="Source"><![CDATA[${escape_cdata(init_source)}]]></string>
    </Properties>
${module_xml}
  </Item>
</roblox>
`;

writeFileSync(OUT, rbxmx, 'utf-8');
console.log(`Built ${OUT}`);

// --- Optional install ---

if (process.argv.includes('--install')) {
  const plugins_dir = join(homedir(), 'AppData', 'Local', 'Roblox', 'Plugins');
  try {
    mkdirSync(plugins_dir, { recursive: true });
  } catch { /* exists */ }
  const dest = join(plugins_dir, 'StudioBridgeMCP.rbxmx');
  copyFileSync(OUT, dest);
  console.log(`Installed to ${dest}`);
}
