/*
 * Copyright 2016 Dialog LLC <info@dlg.im>
 * @flow
 */

import path from 'path';
import type { WebOptions } from '../types';
import { resolveRealPath } from '../utils/resolve';
import { configureWebpackOutput } from './configureOutput';
import { configureWebpackOptimization } from './configureOptimization';
import { configureRules } from './configureRules';
import { configurePlugins } from './configurePlugins';
import { configureDevTool } from './configureDevTool';

export function createWebpackConfigForWeb(options: WebOptions) {
  const { bail = true, root, entry } = options;

  const config = {
    target: 'web',
    context: resolveRealPath(root),
    mode: process.env.NODE_ENV,
    entry: {
      app: [entry.js, entry.css].filter(Boolean),
    },
    resolveLoader: {
      moduleExtensions: ['-loader'],
    },
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
    bail,

    output: configureWebpackOutput(options),
    optimization: configureWebpackOptimization(options),
    module: {
      rules: configureRules(options),
    },
    plugins: configurePlugins(options),
    devtool: configureDevTool(options),
    resolve: {
      alias: {
        ...options.alias,
      },
      modules: [path.join(options.root, 'node_modules'), 'node_modules'],
    },

    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: {
        index: options.entry.html,
      },
    },
  };

  return config;
}
