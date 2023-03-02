const { TextDecoder, TextEncoder } = require('util');
// const fetch = require('node-fetch');

const JsdomEnvironment = require('jest-environment-jsdom').default;

class CustomJsdomEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();

    if (!this.global.TextDecoder) {
      this.global.TextDecoder = TextDecoder;
    } else {
      throw new Error(`Unnecessary polyfill "TextDecoder"`);
    }

    if (!this.global.TextEncoder) {
      this.global.TextEncoder = TextEncoder;
    } else {
      throw new Error(`Unnecessary polyfill "TextEncoder"`);
    }

    // if (!this.global.fetch) {
    //   this.global.fetch = fetch;
    //   this.global.Headers = fetch.Headers;
    //   this.global.Request = fetch.Request;
    //   this.global.Response = fetch.Response;
    // } else {
    //   throw new Error(`Unnecessary polyfill "fetch"`);
    // }
  }
}

module.exports = CustomJsdomEnvironment;
