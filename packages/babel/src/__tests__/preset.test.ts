import { transformSync } from '@babel/core';
import { expect, it } from 'vitest';
import preset from '../preset';

const transform = (code: string, filename?: string, customAtomNames?: string[]) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [[preset, { customAtomNames }]],
  })?.code;

it('Should add a debugLabel and cache to an atom', () => {
  expect(transform(`const count$ = $value(0);`, '/src/atoms.ts')).toMatchInlineSnapshot(`
      "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
        cache: new Map(),
        get(name, inst) {
          if (this.cache.has(name)) {
            return this.cache.get(name);
          }
          this.cache.set(name, inst);
          return inst;
        }
      };
      const count$ = globalThis.ripplingAtomCache.get("/src/atoms.ts/count$", $value(0, {
        debugLabel: "count$"
      }));"`);
});

it('Should add a debugLabel and cache to multiple atoms', () => {
  expect(
    transform(
      `
  const count$ = $value(0);
  const double$ = $computed(get => get(count$) * 2);`,
      '/src/atoms.ts',
    ),
  ).toMatchInlineSnapshot(`
    "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
      cache: new Map(),
      get(name, inst) {
        if (this.cache.has(name)) {
          return this.cache.get(name);
        }
        this.cache.set(name, inst);
        return inst;
      }
    };
    const count$ = globalThis.ripplingAtomCache.get("/src/atoms.ts/count$", $value(0, {
      debugLabel: "count$"
    }));
    const double$ = globalThis.ripplingAtomCache.get("/src/atoms.ts/double$", $computed(get => get(count$) * 2, {
      debugLabel: "double$"
    }));"
  `);
});

it('Should add a cache and debugLabel for multiple exported atoms', () => {
  expect(
    transform(
      `
  export const count$ = $value(0);
  export const double$ = $computed(get => get(count$) * 2);
  `,
      '/src/atoms/index.ts',
    ),
  ).toMatchInlineSnapshot(`
    "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
      cache: new Map(),
      get(name, inst) {
        if (this.cache.has(name)) {
          return this.cache.get(name);
        }
        this.cache.set(name, inst);
        return inst;
      }
    };
    export const count$ = globalThis.ripplingAtomCache.get("/src/atoms/index.ts/count$", $value(0, {
      debugLabel: "count$"
    }));
    export const double$ = globalThis.ripplingAtomCache.get("/src/atoms/index.ts/double$", $computed(get => get(count$) * 2, {
      debugLabel: "double$"
    }));"
  `);
});

it('Should add a cache and debugLabel for a default exported atom', () => {
  expect(transform(`export default $value(0);`, '/src/atoms/index.ts')).toMatchInlineSnapshot(`
      "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
        cache: new Map(),
        get(name, inst) {
          if (this.cache.has(name)) {
            return this.cache.get(name);
          }
          this.cache.set(name, inst);
          return inst;
        }
      };
      const atoms = globalThis.ripplingAtomCache.get("/src/atoms/index.ts/atoms", $value(0, {
        debugLabel: "atoms"
      }));
      export default atoms;"
    `);
});

it('Should add a cache and debugLabel for mixed exports of atoms', () => {
  expect(
    transform(
      `
  export const count$ = $value(0);
  export default $computed(get => get(count$) * 2);
  `,
      '/src/atoms/index.ts',
    ),
  ).toMatchInlineSnapshot(`
    "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
      cache: new Map(),
      get(name, inst) {
        if (this.cache.has(name)) {
          return this.cache.get(name);
        }
        this.cache.set(name, inst);
        return inst;
      }
    };
    export const count$ = globalThis.ripplingAtomCache.get("/src/atoms/index.ts/count$", $value(0, {
      debugLabel: "count$"
    }));
    const atoms = globalThis.ripplingAtomCache.get("/src/atoms/index.ts/atoms", $computed(get => get(count$) * 2, {
      debugLabel: "atoms"
    }));
    export default atoms;"
  `);
});

it('Should fail if no filename is available', () => {
  expect(() => transform(`const count$ = $value(0);`)).toThrow('Filename must be available');
});

it('Should handle custom atom names', () => {
  expect(transform(`const mySpecialThing = myCustomAtom(0);`, '/src/atoms.ts', ['myCustomAtom']))
    .toMatchInlineSnapshot(`
    "globalThis.ripplingAtomCache = globalThis.ripplingAtomCache || {
      cache: new Map(),
      get(name, inst) {
        if (this.cache.has(name)) {
          return this.cache.get(name);
        }
        this.cache.set(name, inst);
        return inst;
      }
    };
    const mySpecialThing = globalThis.ripplingAtomCache.get("/src/atoms.ts/mySpecialThing", myCustomAtom(0, {
      debugLabel: "mySpecialThing"
    }));"
  `);
});