import * as os from 'os'
import { execSync, spawn } from 'child_process'

export function checkAppExists(appName) {
  try {
    let command;
    if (os.platform() === 'win32') {
      // Windows 使用 where 命令检查应用程序是否存在
      command = `where ${appName}`;
    } else if (os.platform() === 'darwin') {
      // macOS 使用 ls /Applications 命令检查应用程序是否存在
      console.log('-------checkAppExists app: ',appName)
      command = `ls /Applications/${appName}.app`;
    } else {
      // Linux 使用 which 命令检查应用程序是否存在
      command = `which ${appName}`;
    }

    execSync(command);
    return true;
  } catch (error) {
    console.error(error)
    return false;
  }
}




