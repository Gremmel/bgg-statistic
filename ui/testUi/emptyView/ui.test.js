/* eslint-disable arrow-body-style */
/* eslint-disable no-undef */

const fs = require('fs-extra');
const path = require('path');
let url;

describe('UI', () => {
  function wait (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  beforeAll(async () => {
    // eslint-disable-next-line no-sync
    if (fs.existsSync(path.join(__dirname, '..', '..', 'local'))) {
      url = 'http://127.0.0.1:3000';
    } else {
      url = 'http://10.254.10.7:33339/';
    }

    await page.setViewport({ width: 800, height: 600 });

    // eslint-disable-next-line no-undef
    await page.goto(url);

    const version = await page.browser().version();

    // eslint-disable-next-line no-console
    console.log('chrome version:', version);

    // ordner für screenshots erzeugen
    await fs.ensureDir(path.join(__dirname, '..', '..', 'testOutput', 'testUi', 'screenshots'));
  });

  // consolen ausgaben
  // page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  // Anmelden
  it('"Hallo vom Server" muss da stehen', async () => {
    await wait(500);
    await expect(page).toMatch('Hallo vom Server');
  });

  // Screenshot
  it('Screenshot', async () => {
    await page.screenshot({
      path: 'testOutput/testUi/screenshots/home.png'
    });
  });
});
