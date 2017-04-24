/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

const Promise = require('bluebird');
const { build: _build, Platform, Arch } = require('electron-builder');
const deploy = require('./deploy');

type PlatformType = 'osx' | 'linux' | 'windows';

function getTaskByPlatform(platform: PlatformType): mixed[] {
  switch (platform) {
    case 'osx':
      return ['osx_64', Platform.MAC.createTarget('zip', Arch.x64)];
      
    case 'linux':
      return ['linux_32', Platform.LINUX.createTarget('deb', Arch.ia32)];
      
    case 'windows':
      return ['windows_32', Platform.WINDOWS.createTarget('nsis', Arch.ia32, Arch.x64)];
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function build(config: Object, platforms: PlatformType[]): Promise<Array<[string, string]>> {
  const result = [];
  
  const tasks = platforms.map((platform) => getTaskByPlatform(platform));
  
  for (const [platform, targets] of tasks) {
    const [path] = await _build({ config, targets });
    result.push([platform, path]);
  }
  
  return result;
}

module.exports = build;