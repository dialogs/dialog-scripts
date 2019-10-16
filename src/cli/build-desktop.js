/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 * @flow
 */

const path = require('path');

const notarize = require('electron-notarize');
const webpackBuild = require('../webpack/build');
const electronBuild = require('../electron/build');
const logger = require('../utils/logger');
const loadDialogConfig = require('./utils/loadDialogConfig');
const shellExec = require('./utils/shellExec');
const createWebpackConfig = require('../electron/createWebpackConfig');
const detectElectronVersion = require('../electron/detectElectronVersion');
const createLatestArtifact = require('../electron/createLatestArtifacts');

module.exports = {
  name: 'build-desktop',
  description: 'Build desktop application',
  options: [
    ['--force-sign', 'Fail if signing failed'],
    ['--force-notarize', 'Fail if signing failed'],
    ['--publish', 'Publish artifacts to electron-release-server'],
    ['--pack-only', 'Build app without webpack bundling'],
    [
      '--channel [channel]',
      'Publish to specific channel (stable, rc, beta, alpha)',
    ],
    [
      '--unlock-keychain [password]',
      'Pass password for keychain unlock before packing',
    ],
  ],
  async action(args: Object) {
    process.env.NODE_ENV = 'production';
    process.env.BABEL_ENV = 'production';

    const config = loadDialogConfig(args.config);
    if (!args.packOnly) {
      logger.info('Start bundling');
      await webpackBuild(createWebpackConfig(config.web, config.desktop));
    }

    if (args.unlockKeychain) {
      const password = JSON.stringify(args.unlockKeychain);
      try {
        await shellExec(
          `security unlock-keychain -p ${password} ~/Library/Keychains/login.keychain`,
        );

        if (process.env.CSC_NAME) {
          const certName = JSON.stringify(
            `Developer ID Application: ${process.env.CSC_NAME}`,
          );
          await shellExec(
            `security set-key-partition-list -S apple: -k ${password} -D ${certName} -t private`,
          );
        }
      } catch (error) {
        logger.error(error.message.replace(password, '***'));
      }
    }

    logger.info('Start electron build');

    const publish =
      (args.publish &&
        config.desktop.configurePublish &&
        config.desktop.configurePublish()) ||
      undefined;

    const result = await electronBuild(config.desktop.platforms, {
      publish: publish ? 'always' : 'never',
      projectDir: config.desktop.root,

      config: {
        publish,
        generateUpdatesFilesForAllChannels: true,
        forceCodeSigning: args.forceSign,
        electronVersion: detectElectronVersion(config.desktop.root),
        directories: {
          app: config.desktop.output,
          buildResources: path.join(config.desktop.root, 'assets'),
        },
        detectUpdateChannel: true,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: '${name}-${os}-${arch}-${version}.${ext}',
        appId: config.desktop.appId,
        copyright: config.desktop.copyright,
        extraResources: config.desktop.extraResources
          ? config.desktop.extraResources
          : [],
        mac: {
          icon: config.desktop.mac ? config.desktop.mac.icon : undefined,
          category: 'public.app-category.social-networking',
          electronUpdaterCompatibility: '>=1.0.0',
        },
        protocols: {
          name: config.desktop.productName + ' URL',
          schemes: [config.desktop.schema],
        },
        async afterSign(context) {
          const [target] = context.targets;
          if (
            target &&
            target.name === 'zip' &&
            context.electronPlatformName === 'darwin'
          ) {
            const {
              APPLE_ID: appleId,
              APPLE_ID_PASSWORD: appleIdPassword,
              APPLE_TEAM_ID: appleTeamId,
            } = process.env;
            if ((args.forceNotarize && !appleId) || !appleIdPassword) {
              throw new Error(
                'Notarization failed: APPLE_ID or APPLE_ID_PASSWORD not defined',
              );
            }

            if (appleId && appleIdPassword) {
              await notarize({
                appleId,
                appleIdPassword,
                ascProvider: appleTeamId,
                appBundleId: config.desktop.appId,
                appPath: path.join(
                  context.appOutDir,
                  `${context.packager.appInfo.productFilename}.app`,
                ),
              });
            } else {
              logger.warn('Your macOS app would not be notarized');
            }
          }
        },
      },
    });

    if (publish && publish.provider === 's3') {
      await createLatestArtifact(result, config.desktop.version, publish);
    }
  },
};
