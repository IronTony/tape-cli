import { Command, flags } from '@oclif/command'
import cli from 'cli-ux'
import * as clipboardy from 'clipboardy'
import * as chalk from 'chalk'

import { uploadFile } from '../helpers/s3'
import XcodeScreenshot from '../services/xcode-screenshot'
import { getDevices, getActiveDevice } from '../services/device.service'
import AndroidScreenShot from '../services/android-screenshot'
import { deviceString } from '../helpers/device.helpers'

export default class Image extends Command {
  static description = 'Record and take screenshots of the iOS simulator'

  static examples = [
    `$ rec image
🎉 Screenshot uploaded. Copied URL to clipboard 🔖 ! -> \n https://example.com/image.png
`,
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    debug: flags.boolean({ char: 'd' }),
    local: flags.boolean({ char: 'l' }), // dont upload
  }

  async run() {
    // Check # of devices
    // If more than one device, ask to select device and advise that they can set their active device using 'rec devices'
    // If only one device, go ahead
    const { flags } = this.parse(Image)

    const device = await getActiveDevice()

    if (!device) return

    console.log(`📱 Device: ${deviceString(device)}`)

    const ScreenshotKlass =
      device.type === 'android' ? AndroidScreenShot : XcodeScreenshot
    const screenshot = new ScreenshotKlass({ verbose: flags.debug })
    const path = await screenshot.save()

    if (flags.local) {
      clipboardy.writeSync(path)
      console.log('🎉 Screenshot saved locally. Path in your clipboard')
    } else {
      cli.action.start('🔗 Uploading file...')
      const url = await uploadFile(path)
      clipboardy.writeSync(url)
      cli.action.stop(
        `🎉 Screenshot uploaded. Copied URL to clipboard 🔖 ! -> \n ${url}`
      )
      screenshot.destroy()
    }
  }
}
