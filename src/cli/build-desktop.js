/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 * @flow
 */

const path = require('path');
const webpackBuild = require('../webpack/build');
const electronBuild = require('../electron/build');
const logger = require('../utils/logger');
const loadDialogConfig = require('./utils/loadDialogConfig');
const shellExec = require('./utils/shellExec');
const createWebpackConfig = require('../electron/createWebpackConfig');
const detectElectronVersion = require('../electron/detectElectronVersion');

module.exports = {
  name: 'build-desktop',
  description: 'Build desktop application',
  options: [
    [
      '--force-sign',
      'Fail if signing failed'
    ],
    [
      '--publish',
      'Publish artifacts to electron-release-server'
    ],
    [
      '--pack-only',
      'Build app without webpack bundling'
    ],
    [
      '--channel [channel]',
      'Publish to specific channel (stable, rc, beta, alpha)'
    ],
    [
      '--unlock-keychain [password]',
      'Pass password for keychain unlock before packing'
    ]
  ],
  async action(args: Object) {
    process.env.NODE_ENV = 'production';
    process.env.BABEL_ENV = 'production';

    const config = loadDialogConfig();
    if (!args.packOnly) {
      logger.info('Start bundling');
      await webpackBuild(createWebpackConfig(config.web, config.desktop));
    }

    if (args.unlockKeychain) {
      const password = JSON.stringify(args.unlockKeychain);
      try {
        await shellExec(`security unlock-keychain -p ${password} ~/Library/Keychains/login.keychain`);

        if (process.env.CSC_NAME) {
          const certName = JSON.stringify(`Developer ID Application: ${process.env.CSC_NAME}`);
          await shellExec(`security set-key-partition-list -S apple: -k ${password} -D ${certName} -t private`);
        }
      } catch (error) {
        logger.error(error.message.replace(password, '***'));
      }
    }

    logger.info('Start electron build');

    await electronBuild(config.desktop.platforms, {
      projectDir: config.desktop.root,
      publish: args.publish ? 'always' : 'never',
      config: {
        forceCodeSigning: args.forceSign,
        publish: (args.publish && config.desktop.configurePublish && config.desktop.configurePublish()) || undefined,
        electronVersion: detectElectronVersion(config.desktop.root),
        directories: {
          app: config.desktop.output,
          buildResources: path.join(config.desktop.root, 'assets')
        },
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: '${os}-${arch}-${version}.${ext}',
        appId: config.desktop.appId,
        copyright: config.desktop.copyright,
        mac: {
          category: 'public.app-category.social-networking'
        },
        protocols: {
          name: config.desktop.productName + ' URL',
          schemes: [config.desktop.schema]
        }
      }
    });
  }
};
