/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 * @flow
 */

const path = require('path');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');

import type { DesktopOptions, WebOptions } from '../types';
const createPackage = require('./createPackage');
const { createWebpackConfigForWeb } = require('../web/createWebpackConfig');

function createMainConfig(options: DesktopOptions) {
  return {
    name: 'desktop-main',
    context: options.root,
    entry: options.main,
    output: {
      path: options.output,
      pathinfo: true,
      filename: 'main.js',
    },
    module: {
      rules: [
        {
          test: /\.yml$/,
          loader: 'yml-loader',
        },
        {
          test: /\.(svg|png|gif|jpe?g|ico|ttf|eot|woff2?|mp3)$/,
          loader: 'file-loader',
          options: {
            name: '[sha1:hash:hex].[ext]',
          },
        },
      ],
    },
    target: 'electron-main',
    plugins: [
      new GenerateJsonPlugin(
        'package.json',
        createPackage(options),
        null,
        '  ',
      ),
      new EnvironmentPlugin(['DEPLOY_CHANNEL']),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
  };
}

function createRendererConfig(web: WebOptions, desktop: DesktopOptions) {
  return createWebpackConfigForWeb({
    ...web,
    gzip: false,
    output: path.join(desktop.output, 'app'),
  });
}

function createWebpackConfig(web: WebOptions, desktop: DesktopOptions) {
  return [createMainConfig(desktop), createRendererConfig(web, desktop)];
}

module.exports = createWebpackConfig;
