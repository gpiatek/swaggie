#!/usr/bin/env node

import * as program from 'commander';
import chalk from 'chalk';
import { genCode } from './index';

const args: any = program
  // tslint:disable-next-line:no-var-requires
  .version(require('../package.json').version)
  .option(
    '-c, --config <url|path>',
    'The url or path to the configuration file',
    String,
    process.env.CONFIG_SRC
  )
  .option(
    '-s, --src <url|path>',
    'The url or path to the Open API spec file',
    String,
    process.env.OPEN_API_SRC
  )
  .option(
    '-o, --out <dir>',
    'The path to the directory where files should be generated',
    process.env.OPEN_API_OUT
  )
  .option(
    '-t, --template <name>',
    'The template that should be used (axios by default)',
    String,
    process.env.OPEN_API_TEMPLATE || 'axios'
  )
  .option(
    '--redux',
    'True if wanting to generate redux action creators',
    process.env.OPEN_API_REDUX
  )
  .option(
    '--semicolon',
    'True if wanting to use a semicolon statement terminator',
    process.env.OPEN_API_SEMICOLON
  )
  .parse(process.argv);

genCode(args).then(complete, error);

function complete(spec: ApiSpec) {
  if (args.config) {
    console.info(chalk.bold.cyan(`Tasks were succesfully executed`));
  } else {
    console.info(chalk.bold.cyan(`Api ${args.src} code generated into ${args.out}`));
  }
  process.exit(0);
}

function error(e) {
  const msg = e instanceof Error ? e.message : e;
  console.error(chalk.red(msg));
  process.exit(1);
}
