/*
 * Copyright 2016 Dialog LLC <info@dlg.im>
 * @flow
 */

export type SentryConfig = {
  url?: string,
  apiKey: string,
  project: string,
  organisation: string,
};

export type WebpackRule = {
  test: string,
  use: string,
  include?: string,
  exclude?: string,
};

export type CopyWebpackPluginConfig = {
  patterns: Array<Object | string>,
  options: {
    debug: string,
    ignore: Array<string>,
    context: string,
    copyUnmodified: boolean,
  },
};

export type WebOptions = {
  bail?: boolean,
  root: string,
  entry: {
    js: string,
    css: string,
    html: string,
  },
  paths: {
    js: string,
    styles: string,
    cssModules: string,
    valFiles?: string[],
  },
  rules?: Array<WebpackRule>,
  alias?: string[],
  favicon: string,
  output: string,
  version: string,
  override: { [path: string]: string },
  cssPrefix: string,
  environment: string,
  gzip?: boolean,
  devtool?: string | boolean,
  configureSentry?: () => SentryConfig,
  copyWebpack?: CopyWebpackPluginConfig,
};

export type PlatformType =
  | 'macos'
  | 'deb'
  | 'deb_32'
  | 'deb_64'
  | 'rpm'
  | 'rpm_32'
  | 'rpm_64'
  | 'linux'
  | 'windows'
  | 'nsis'
  | 'nsis_32'
  | 'nsis_64'
  | 'msi'
  | 'msi_32'
  | 'msi_64';

type S3PublishOptions = {
  provider: 's3',
  bucket: string,
  region?: string,
  acl?: 'private' | 'public-read',
  endpoint?: string,
  channel?: string,
  path?: string,
};

export type DesktopPublishOptions = S3PublishOptions;

export type DesktopOptions = {
  root: string,
  main: string,
  output: string,
  version: string,
  homepage: string,
  name: string,
  productName: string,
  description: string,
  author: {
    name: string,
    email: string,
  },
  appId: string,
  copyright: string,
  schema: string,
  platforms: PlatformType[],
  configurePublish?: () => ?DesktopPublishOptions,
  extraResources?: Array<string> | string,
  mac: {
    icon: string,
  },
};
