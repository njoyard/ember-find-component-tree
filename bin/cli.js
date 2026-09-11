#!/usr/bin/env node

const { findComponentTree } = require('../src/index.js');

const args = process.argv.slice(2);
const packageName = args.find((arg) => !arg.startsWith('--'));

if (!packageName) {
  console.error('Usage: ember-find-component-tree <package-name>');
  process.exit(1);
}

findComponentTree(packageName)
  .then(({ tree, list }) => {
    console.log(`Component tree from package ${packageName}\n`);
    printTree(tree);
    console.log(`\nList of all used components from ${packageName}\n`);
    list.forEach((path) => console.log(path));
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });

function printTree(nodes, indent = 0) {
  for (const node of nodes) {
    const circular = node.circular ? ' (circular)' : '';
    console.log(`${'  '.repeat(indent)}${node.name}${circular}`);
    if (node.children.length > 0) {
      printTree(node.children, indent + 1);
    }
  }
}
