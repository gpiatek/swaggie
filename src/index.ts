import 'isomorphic-fetch';
import * as assert from 'assert';
import * as fs from 'fs';

import { resolveSpec, getOperations } from './spec';
import genJsCode from './gen/js';
import { removeOldFiles } from './gen/util';

export function genCode(options: FullAppOptions): Promise<any> {
  return verifyOptions(options)
    .then(applyConfigFile)
    .then((options) => {
      options.forEach((opts) =>
        resolveSpec(opts.src, { ignoreRefType: '#/definitions/' }).then((spec) => gen(spec, opts))
      );
    });
}

function verifyOptions(options: FullAppOptions): Promise<any> {
  try {
    if (!options.config && (!options.src || !options.out)) {
      assert.fail('You need to provide at least config file or --src and --out parameters');
    }
    if (options.config && options.src && options.out) {
      assert.fail('You provided both config and --src and --out parameters. Come on!');
    }
    return Promise.resolve(options);
  } catch (e) {
    return Promise.reject(e);
  }
}

function applyConfigFile(options: FullAppOptions): Promise<ClientOptions[]> {
  return new Promise((resolve, reject) => {
    if (!options.config) {
      return resolve([options]);
    }

    const configUrl = options.config;
    readFile(configUrl).then((contents) => {
      const parsedConfig = JSON.parse(contents);
      if (!parsedConfig || parsedConfig.length < 1) {
        return reject(
          'Could not correctly load config file. Or it does not contain any configuration entries'
        );
      }
      resolve(parsedConfig);
    });
  });
}

function gen(spec: ApiSpec, options: ClientOptions): ApiSpec {
  removeOldFiles(options);
  const operations = getOperations(spec);
  return genJsCode(spec, operations, options);
}

function readFile(filePath: string): Promise<string> {
  return new Promise((res, rej) =>
    fs.readFile(filePath, 'utf8', (err, contents) => (err ? rej(err) : res(contents)))
  );
}
