# ember-find-component-tree

This tool helps finding which components from an addon an Ember app/addon uses, directly or indirectly.

It can be useful to help planning GJS migration for components in a shared addon while migrating its consumers to Vite:

1. Migrate a consumer app to GJS
2. Use this tool to list which components from the shared addon are used by the consumer app
3. Migrate those only to GJS
4. Migrate the consumer app to Vite
5. Repeat for other consumer apps

## Usage

From a consumer app/addon repository:

```sh
pnpm dlx ember-find-component-tree @myorg/my-shared-addon
```

> _Note:_ make sure dependencies are installed - the tool expects the addon to be available under `node_modules`.

## What it does

1. Scans all `.gjs` / `.gts` files in `app/components`, `app/templates`, `addon/components`, and `addon/templates` of the current repository.
2. Collects imports matching `@myorg/my-shared-addon/components/...` (default, named, and aliased imports are supported).
3. For each imported component, locates its implementation inside `node_modules/@myorg/my-shared-addon`:
   - `addon/components/**/x.gjs` (or `.gts`) — parses the `<template>` block.
   - `.js` / `.ts` — parses a sibling `.hbs` or `addon/templates/components/**/x.hbs`.
4. Parses the component template with `@glimmer/syntax` and recursively discovers which other components _from the same package_ it uses. References are resolved through the file's imports, or — for classic `.hbs` templates — through package-path forms like `<Icon />`, `<Form::Field />`, `{{icon}}`, or `{{form/field}}` when a matching file exists under the package's `addon/components`.
5. Prints a tree of component dependencies anchored at the repository files that import from the package, followed by a de-duplicated, sorted list of all package component paths.

## Example output

```
Component tree from package @myorg/my-shared-addon

app/components/my-component.gjs
  @myorg/my-shared-addon/components/button
    @myorg/my-shared-addon/components/icon
app/components/panel.gjs
  @myorg/my-shared-addon/components/card

List of all used components from @myorg/my-shared-addon

@myorg/my-shared-addon/components/button
@myorg/my-shared-addon/components/card
@myorg/my-shared-addon/components/icon
```

## Development

```sh
pnpm i
pnpm test
```
